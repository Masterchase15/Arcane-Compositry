/**
 * lib/api.ts - how the React app talks to the server (server/api.js is the other side).
 *
 * Every request carries ?group=<id> of the campaign the current page is using,
 * so the server knows whose homebrew, notes and party to use. That campaign is
 * set by <GroupScope> (lib/catalog.tsx) before a page draws; pass
 * { group: id } (or null) to send a different one.
 */

export type Role = 'dm' | 'player';

export interface User {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  email: string;
  emailVerified: boolean;
  askForEmail: boolean;
}

export interface Group {
  id: string;
  name: string;
  role: Role;
  inviteCode?: string; // only for the campaign's DMs
}

export interface Me {
  user: User | null;
  groups: Group[];
  inviteRequired: boolean;
  mailEnabled: boolean;
}

export interface CharacterSummary {
  id: string;
  name: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  groupId: string | null;
  groupName: string;
  className: string;
  subclass: string;
  level: number;
  species: string;
}

/** An error from the server. `fields` holds per-field messages for forms. */
export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

let currentGroupId: string | null = null;
/** Which campaign requests are for (set by GroupScope). */
export const setRequestGroup = (id: string | null) => { currentGroupId = id; };
export const getRequestGroup = () => currentGroupId;

/** Sends a request to /api/... and returns the JSON answer. Throws ApiError on failure. */
export async function api<T = any>(method: string, path: string, body?: unknown, options: { group?: string | null } = {}): Promise<T> {
  const groupId = 'group' in options ? options.group : currentGroupId;
  const url = groupId ? `/api${path}${path.includes('?') ? '&' : '?'}group=${encodeURIComponent(groupId)}` : `/api${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: method === 'GET' ? {} : { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || 'Something went wrong.', response.status, data.fields);
  return data as T;
}

/** The message to show for any caught error. */
export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');
