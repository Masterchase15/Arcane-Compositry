/**
 * lib/session.tsx - who is signed in, and their campaigns. Use it anywhere:
 *
 *   const { user, groups, mailEnabled, refresh, homebrew, setHomebrew } = useSession();
 *
 * `homebrew` is the browsing pages' Homebrew filter: the campaign whose
 * homebrew the spell / item / class lists include (null = standard rules only).
 * It is remembered in this browser.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type Group, type Me, type User } from './api';

interface Session {
  loaded: boolean;
  user: User | null;
  groups: Group[];
  inviteRequired: boolean;
  mailEnabled: boolean;
  findGroup: (id: string | null | undefined) => Group | null;
  /** Fetches the user and their campaigns again (after signing in, joining, leaving...). */
  refresh: () => Promise<Me>;
  homebrew: string | null;
  setHomebrew: (id: string | null) => void;
}

const SessionContext = createContext<Session | null>(null);
const HOMEBREW_KEY = 'ac-homebrew';
const store = {
  get: () => { try { return localStorage.getItem(HOMEBREW_KEY); } catch { return null; } },
  set: (id: string | null) => { try { if (id) localStorage.setItem(HOMEBREW_KEY, id); else localStorage.removeItem(HOMEBREW_KEY); } catch { /* private mode */ } },
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me>({ user: null, groups: [], inviteRequired: false, mailEnabled: false });
  const [loaded, setLoaded] = useState(false);
  const [homebrew, setHomebrewState] = useState<string | null>(store.get());

  const refresh = useCallback(async () => {
    let next: Me;
    try { next = await api<Me>('GET', '/auth/me', undefined, { group: null }); }
    catch { next = { user: null, groups: [], inviteRequired: false, mailEnabled: false }; }
    setMe(next);
    setLoaded(true);
    return next;
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // Forget a Homebrew choice for a campaign you are no longer in.
  useEffect(() => {
    if (loaded && homebrew && !me.groups.some((g) => g.id === homebrew)) { setHomebrewState(null); store.set(null); }
  }, [loaded, homebrew, me.groups]);

  const value = useMemo<Session>(() => ({
    loaded,
    ...me,
    findGroup: (id) => me.groups.find((g) => g.id === id) ?? null,
    refresh,
    homebrew,
    setHomebrew: (id) => { setHomebrewState(id); store.set(id); },
  }), [loaded, me, refresh, homebrew]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession must be inside <SessionProvider>');
  return s;
}
