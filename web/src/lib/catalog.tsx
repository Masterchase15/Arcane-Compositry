/**
 * lib/catalog.tsx - which campaign and rulesets a page uses, and the spell / item / class lists.
 *
 * <GroupScope groupId={...}> wraps every page (see App.tsx). It decides the
 * campaign the page's requests are for, loads that campaign's classes and
 * Components into the rules (shared/rules/constants.js keeps them in shared
 * lists that the formulas read), and only then shows the page.
 *   - inside a campaign hub: that campaign
 *   - the character sheet: the character's campaign
 *   - everywhere else: the Rulesets filter's campaign, or none
 * The rulesets are the campaign's own; with no campaign, the `rulesets` given
 * (the Rulesets filter's choice), or every ruleset.
 *
 * In a page:
 *   const { group, isDM, uses } = useScope();
 *   if (uses(ARCANE)) ...                      // is Arcane Compositry in play here?
 *   const { data: spells } = useSpells();      // cached per campaign, only the rulesets in use
 *   const { data, reload } = useApi<T>('/characters');   // not cached
 * After a DM edit, call invalidateLists() so every list is fetched again.
 */
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { setClasses, setComponents } from '@shared/rules/constants.js';
import { ARCANE, DEFAULT_RULESETS } from '@shared/rules/rulesets.js';
import { api, errorMessage, setRequestGroup, type Group } from './api';
import { useSession } from './session';
import { Loading } from '@/components/page';

// ── Shared cache of lists, per campaign ─────────────────────────────────────
const cache = new Map<string, Promise<any>>();
let version = 0;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };

/** Forget every cached list (after a DM adds, edits, hides or deletes an entry). */
export function invalidateLists() {
  cache.clear();
  version++;
  listeners.forEach((fn) => fn());
}

function cached<T>(groupId: string | null, path: string): Promise<T> {
  const key = `${groupId ?? ''}|${path}`;
  let p = cache.get(key);
  if (!p) {
    p = api<T>('GET', path, undefined, { group: groupId });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

// ── The scope ────────────────────────────────────────────────────────────────
interface Scope { group: Group | null; isDM: boolean; rulesets: string[]; uses: (ruleset: string) => boolean }
const scopeFor = (group: Group | null, rulesets: string[]): Scope =>
  ({ group, isDM: group?.role === 'dm', rulesets, uses: (r) => rulesets.includes(r) });
const ScopeContext = createContext<Scope>(scopeFor(null, DEFAULT_RULESETS));
export const useScope = () => useContext(ScopeContext);

/** Keeps only the entries from the rulesets in use (works on a list, or an object of lists). */
function inRulesets<T>(data: T, rulesets: string[]): T {
  const keep = (list: any[]) => list.filter((e) => !e?.ruleset || rulesets.includes(e.ruleset));
  if (Array.isArray(data)) return keep(data) as T;
  if (data && typeof data === 'object') {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? keep(v) : v])) as T;
  }
  return data;
}

export function GroupScope({ groupId, rulesets, children }: { groupId: string | null; rulesets?: string[]; children: ReactNode }) {
  const { findGroup, loaded } = useSession();
  const group = findGroup(groupId);
  const id = group?.id ?? null;
  const active = group?.rulesets ?? rulesets ?? DEFAULT_RULESETS;
  const key = `${id}|${active.join(',')}`;
  const v = useSyncExternalStore(subscribe, () => version);
  const [ready, setReady] = useState<string | null>(null); // the "id|rulesets|version" that is loaded

  useEffect(() => {
    if (!loaded) return;
    let alive = true;
    setRequestGroup(id);
    Promise.all([
      cached<{ classes: any[] }>(id, '/classes').then((r) => setClasses(inRulesets(r.classes, active))),
      active.includes(ARCANE)
        ? cached<{ components: any[] }>(id, '/components').then((r) => setComponents(inRulesets(r.components, active)))
        : setComponents([]),
    ]).catch(() => { /* the page shows its own errors; the rules fall back to empty lists */ })
      .finally(() => { if (alive) setReady(`${key}|${v}`); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, v, loaded]);

  const scope = useMemo(() => scopeFor(group, active), [group, key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (ready !== `${key}|${v}`) return <Loading />;
  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;
}

// ── Data hooks ───────────────────────────────────────────────────────────────
interface Loaded<T> { data: T | undefined; error: string | null; loading: boolean; reload: () => void }

function useLoad<T>(load: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const [state, setState] = useState<{ data?: T; error: string | null; loading: boolean }>({ error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    load().then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err) => alive && setState({ error: errorMessage(err), loading: false }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, data: state.data, reload: () => setTick((t) => t + 1) };
}

/** Any GET request, fetched fresh each time the page shows (pass null to skip). */
export function useApi<T = any>(path: string | null): Loaded<T> {
  const { group } = useScope();
  return useLoad<T>(() => (path ? api<T>('GET', path) : Promise.resolve(undefined as T)), [path, group?.id]);
}

export function useList<T>(path: string, pick: (r: any) => T): Loaded<T> {
  const { group, rulesets } = useScope();
  const v = useSyncExternalStore(subscribe, () => version);
  return useLoad<T>(() => cached<any>(group?.id ?? null, path).then((r) => inRulesets(pick(r), rulesets)), [path, group?.id, rulesets.join(','), v]);
}

export interface SpellLists { codified: any[]; compositry: any[] }
export const useSpells = () => useList<SpellLists>('/spells', (r) => r);
export const useItems = () => useList<any[]>('/items', (r) => r.items);
export const useClasses = () => useList<any[]>('/classes', (r) => r.classes);
export const useComponents = () => useList<any[]>('/components', (r) => r.components);
export const useSubclasses = () => useList<any[]>('/subclasses', (r) => r.subclasses);
export const useNpcs = () => useList<any[]>('/npcs', (r) => r.npcs);

/** Any of the homebrew-editable lists by name (the campaign hub's editors use this). */
const LIST_SOURCES: Record<string, [string, (r: any) => any[]]> = {
  codified: ['/spells', (r) => r.codified], compositry: ['/spells', (r) => r.compositry],
  components: ['/components', (r) => r.components], items: ['/items', (r) => r.items],
  classes: ['/classes', (r) => r.classes], subclasses: ['/subclasses', (r) => r.subclasses], npcs: ['/npcs', (r) => r.npcs],
};
export const useCatalogList = (listName: string) => useList<any[]>(...LIST_SOURCES[listName]);

/**
 * Every subclass that belongs to a class: the ones from the Subclasses list whose
 * `className` matches, plus any quick ones typed straight onto the class itself.
 */
export function subclassesOf(cls: any, subclasses: any[] = []) {
  if (!cls) return [];
  const listed = subclasses.filter((s) => s.className.toLowerCase() === cls.name.toLowerCase());
  const quick = (cls.subclasses || [])
    .filter((q: any) => !listed.some((s) => s.name.toLowerCase() === q.name.toLowerCase()))
    .map((q: any, i: number) => ({ id: `quick-${i}`, name: q.name, className: cls.name, description: q.text, features: q.features, compositry: '', tags: [], source: '', hidden: false, quick: true }));
  return [...listed, ...quick];
}
