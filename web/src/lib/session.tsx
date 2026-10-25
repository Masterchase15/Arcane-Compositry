/**
 * lib/session.tsx - who is signed in, and their campaigns. Use it anywhere:
 *
 *   const { user, groups, mailEnabled, refresh, browse, setBrowse } = useSession();
 *
 * `browse` is the browsing pages' Rulesets filter (components/rulesets-bar.tsx):
 *   browse.campaign   the campaign whose rulesets and homebrew the spell / item /
 *                     class lists use (null = no campaign)
 *   browse.rulesets   with no campaign: the rulesets to show
 * Both are remembered in this browser.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cleanRulesets, DEFAULT_RULESETS } from '@shared/rules/rulesets.js';
import { api, type Group, type Me, type User } from './api';

export interface Browse { campaign: string | null; rulesets: string[] }

interface Session {
  loaded: boolean;
  user: User | null;
  groups: Group[];
  inviteRequired: boolean;
  mailEnabled: boolean;
  findGroup: (id: string | null | undefined) => Group | null;
  /** Fetches the user and their campaigns again (after signing in, joining, leaving...). */
  refresh: () => Promise<Me>;
  browse: Browse;
  setBrowse: (next: Partial<Browse>) => void;
}

const SessionContext = createContext<Session | null>(null);
const CAMPAIGN_KEY = 'ac-homebrew'; // the old name of the filter - kept so the choice survives
const RULESETS_KEY = 'ac-rulesets';
const store = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, v: string | null) => { try { if (v) localStorage.setItem(key, v); else localStorage.removeItem(key); } catch { /* private mode */ } },
};
const savedRulesets = (): string[] => {
  try { const v = JSON.parse(store.get(RULESETS_KEY) || 'null'); return v ? cleanRulesets(v) : [...DEFAULT_RULESETS]; }
  catch { return [...DEFAULT_RULESETS]; }
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me>({ user: null, groups: [], inviteRequired: false, mailEnabled: false });
  const [loaded, setLoaded] = useState(false);
  const [browse, setBrowseState] = useState<Browse>(() => ({ campaign: store.get(CAMPAIGN_KEY), rulesets: savedRulesets() }));

  const refresh = useCallback(async () => {
    let next: Me;
    try { next = await api<Me>('GET', '/auth/me', undefined, { group: null }); }
    catch { next = { user: null, groups: [], inviteRequired: false, mailEnabled: false }; }
    setMe(next);
    setLoaded(true);
    return next;
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const setBrowse = useCallback((next: Partial<Browse>) => {
    setBrowseState((prev) => {
      const out = { ...prev, ...next, rulesets: cleanRulesets(next.rulesets ?? prev.rulesets) };
      store.set(CAMPAIGN_KEY, out.campaign);
      store.set(RULESETS_KEY, JSON.stringify(out.rulesets));
      return out;
    });
  }, []);

  // Forget a campaign choice for a campaign you are no longer in.
  useEffect(() => {
    if (loaded && browse.campaign && !me.groups.some((g) => g.id === browse.campaign)) setBrowse({ campaign: null });
  }, [loaded, browse.campaign, me.groups, setBrowse]);

  const value = useMemo<Session>(() => ({
    loaded,
    ...me,
    findGroup: (id) => me.groups.find((g) => g.id === id) ?? null,
    refresh,
    browse,
    setBrowse,
  }), [loaded, me, refresh, browse, setBrowse]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession must be inside <SessionProvider>');
  return s;
}
