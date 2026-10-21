/**
 * App.tsx - every page and its address.
 *
 * ─── TO ADD A PAGE ─────────────────────────────────────────────────────────
 *  1. Create web/src/pages/my-page.tsx with `export default function MyPage() {...}`.
 *  2. Add a lazy import and a <Route> below.
 *  3. Optionally add it to NAV in components/layout.tsx so it shows in the menu.
 *
 * Browsing pages sit in <BrowseScope>: they use the Homebrew filter's campaign
 * (or none). The campaign hub sits in <CampaignScope>: it uses its own campaign
 * and shows the gold campaign banner. (See lib/catalog.tsx.)
 */
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Outlet, Route, Routes, useLocation, useParams } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CampaignBar, Layout, Main } from '@/components/layout';
import { ConfirmProvider } from '@/components/confirm';
import { Empty, Loading } from '@/components/page';
import { GroupScope } from '@/lib/catalog';
import { SessionProvider, useSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

const Home = page(() => import('./pages/home'));
const Codex = page(() => import('./pages/codex'));
const Craft = page(() => import('./pages/craft'));
const Tools = page(() => import('./pages/tools'));
const Spells = page(() => import('./pages/spells'));
const Components = page(() => import('./pages/components'));
const Items = page(() => import('./pages/items'));
const Classes = page(() => import('./pages/classes'));
const Characters = page(() => import('./pages/characters'));
const NewCharacter = page(() => import('./pages/new-character'));
const Sheet = page(() => import('./pages/sheet'));
const Guide = page(() => import('./pages/guide'));
const Account = page(() => import('./pages/account'));
const Campaigns = page(() => import('./pages/campaigns'));
const Campaign = page(() => import('./pages/campaign'));
const EmailLinks = page(() => import('./pages/email-links'));

/**
 * Loads a page's code when it is first visited. After a new version of the site
 * is deployed, a tab that was already open asks for page files that no longer
 * exist - then reload once to get the new version.
 */
function page(load: () => Promise<{ default: ComponentType }>) {
  return lazy(() => load().catch((err) => {
    const KEY = 'ac-reloaded-for-update';
    let reloaded: string | null = null;
    try { reloaded = sessionStorage.getItem(KEY); sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    if (!reloaded) { location.reload(); return new Promise<never>(() => {}); }
    throw err;
  }).then((m) => { try { sessionStorage.removeItem('ac-reloaded-for-update'); } catch { /* ignore */ } return m; }));
}

export function App() {
  return (
    <SessionProvider>
      <TooltipProvider>
        <ConfirmProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route element={<BrowseScope />}>
                <Route index element={<Home />} />
                <Route path="codex/:chapter?" element={<Codex />} />
                <Route path="craft" element={<Craft />} />
                <Route path="tools" element={<Tools />} />
                <Route path="spells/components" element={<Components />} />
                <Route path="spells/:list?" element={<Spells />} />
                <Route path="items" element={<Items />} />
                <Route path="classes/:id?" element={<Classes />} />
                <Route path="characters" element={<Characters />} />
                <Route path="characters/new" element={<NewCharacter />} />
                <Route path="characters/:id" element={<Sheet />} />
                <Route path="guide" element={<Guide />} />
                <Route path="account" element={<Account />} />
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="forgot" element={<EmailLinks />} />
                <Route path="reset" element={<EmailLinks />} />
                <Route path="verify" element={<EmailLinks />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="campaign/:id" element={<CampaignScope />} />
            </Route>
          </Routes>
          <Toaster richColors closeButton />
        </ConfirmProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}

/** Browsing pages: the Homebrew filter's campaign, or the standard rules. */
function BrowseScope() {
  const { homebrew } = useSession();
  return (
    <GroupScope groupId={homebrew}>
      <Main>
        <Suspense fallback={<Loading />}><Outlet /></Suspense>
      </Main>
    </GroupScope>
  );
}

/** A campaign hub: its own campaign, with the gold banner. */
function CampaignScope() {
  const { id } = useParams();
  const { findGroup, loaded } = useSession();
  const group = findGroup(id);
  if (!loaded) return <Loading />;
  if (!group) {
    return (
      <Main>
        <Empty title="Campaign not found" action={<Button asChild><Link to="/campaigns">My campaigns</Link></Button>}>
          You are not in this campaign, or it no longer exists.
        </Empty>
      </Main>
    );
  }
  return (
    <GroupScope groupId={group.id}>
      <CampaignBar group={group} />
      <Main>
        <Suspense fallback={<Loading />}><Campaign /></Suspense>
      </Main>
    </GroupScope>
  );
}

function NotFound() {
  return (
    <Empty title="Page not found" action={<Button asChild><Link to="/">Back to home</Link></Button>}>
      That page does not exist.
    </Empty>
  );
}

/** Start each new page at the top (but not when only the ?query changes). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
