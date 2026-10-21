/**
 * lib/catalog.tsx - which campaign a page uses, and the spell / item / class lists.
 *
 * <GroupScope groupId={...}> wraps every page (see App.tsx). It decides the
 * campaign the page's requests are for, loads that campaign's classes and
 * Components into the rules (shared/rules/constants.js keeps them in shared
 * lists that the formulas read), and only then shows the page.
 *   - inside a campaign hub: that campaign
 *   - the character sheet: the character's campaign
 *   - everywhere else: the Homebrew filter's choice, or none (standard rules)
 *
 * In a page:
 *   const { group, isDM } = useScope();
 *   const { data: spells } = useSpells();      // cached per campaign
 *   const { data, reload } = useApi<T>('/characters');   // not cached
 * After a DM edit, call invalidateLists() so every list is fetched again.
 */
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { setClasses, setComponents } from '@shared/rules/constants.js';
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
interface Scope { group: Group | null; isDM: boolean }
const ScopeContext = createContext<Scope>({ group: null, isDM: false });
export const useScope = () => useContext(ScopeContext);

export function GroupScope({ groupId, children }: { groupId: string | null; children: ReactNode }) {
  const { findGroup, loaded } = useSession();
  const group = findGroup(groupId);
  const id = group?.id ?? null;
  const v = useSyncExternalStore(subscribe, () => version);
  const [ready, setReady] = useState<string | null>(null); // the "id|version" that is loaded

  useEffect(() => {
    if (!loaded) return;
    let alive = true;
    setRequestGroup(id);
    Promise.all([
      cached<{ classes: any[] }>(id, '/classes').then((r) => setClasses(r.classes)),
      cached<{ components: any[] }>(id, '/components').then((r) => setComponents(r.components)),
    ]).catch(() => { /* the page shows its own errors; the rules fall back to empty lists */ })
      .finally(() => { if (alive) setReady(`${id}|${v}`); });
    return () => { alive = false; };
  }, [id, v, loaded]);

  if (ready !== `${id}|${v}`) return <Loading />;
  return <ScopeContext.Provider value={{ group, isDM: group?.role === 'dm' }}>{children}</ScopeContext.Provider>;
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
  const { group } = useScope();
  const v = useSyncExternalStore(subscribe, () => version);
  return useLoad<T>(() => cached<any>(group?.id ?? null, path).then(pick), [path, group?.id, v]);
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
