/**
 * components/layout.tsx - the frame around every page: top bar, phone tab bar,
 * menus, and the gold campaign banner shown only inside a campaign hub.
 *
 * ─── TO ADD A PAGE TO THE MENU ──────────────────────────────────────────────
 *  Add it to NAV below (and its route in App.tsx). `tab: true` also puts it in
 *  the phone bottom bar - keep that to 5.
 */
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft, BookOpen, Calculator, Compass, Crown, Flag, House, LogOut, Menu, Moon, ScrollText,
  Shield, Sparkles, Sun, Sword, UserRound, Users, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { api, type Group } from '@/lib/api';
import { invalidateLists } from '@/lib/catalog';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface NavEntry { to: string; label: string; icon: LucideIcon; tab?: boolean; topbar?: boolean }
const NAV: NavEntry[] = [
  { to: '/', label: 'Home', icon: House, topbar: false },
  { to: '/codex', label: 'Codex', icon: BookOpen, tab: true },
  { to: '/craft', label: 'Spellcraft', icon: Sparkles, tab: true },
  { to: '/tools', label: 'Calculators', icon: Calculator },
  { to: '/spells', label: 'Spells', icon: ScrollText, tab: true },
  { to: '/items', label: 'Items & Weapons', icon: Sword },
  { to: '/classes', label: 'Classes', icon: Shield },
  { to: '/characters', label: 'Characters', icon: Users, tab: true },
  { to: '/campaigns', label: 'Campaigns', icon: Flag, tab: true },
  { to: '/guide', label: 'Guide', icon: Compass },
];

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col pb-16 xl:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to content</a>
      <TopBar />
      <Outlet />
      <TabBar />
    </div>
  );
}

/** The usual page width and padding. */
export function Main({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main id="main" tabIndex={-1} className={cn('mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:py-8', className)}>{children}</main>;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground',
    isActive ? 'text-primary underline decoration-gold decoration-2 underline-offset-8' : 'text-muted-foreground');

function TopBar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-15 max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Arcane Compositry home">
          <span className="flex size-9 items-center justify-center rounded-full border-2 border-gold font-serif text-sm font-bold text-primary" aria-hidden>AC</span>
          <span className="hidden leading-tight sm:block">
            <b className="block font-serif text-base">Arcane Compositry</b>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold-ink">Dungeons &amp; Dragons</span>
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-0.5 xl:flex" aria-label="Main">
          {NAV.filter((n) => n.topbar !== false).map((n) => (
            <NavLink key={n.to} to={n.to} className={navClass} end={n.to === '/'}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <AccountMenu />
          <MobileMenu />
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-gold to-transparent" aria-hidden />
    </header>
  );
}

function AccountMenu() {
  const { user, refresh } = useSession();
  const navigate = useNavigate();
  if (!user) return <Button asChild size="sm"><Link to="/account">Sign in</Link></Button>;

  const signOut = async () => {
    await api('POST', '/auth/logout', {}, { group: null }).catch(() => {});
    await refresh();
    invalidateLists();
    toast.success('Signed out.');
    navigate('/');
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-44"><UserRound /><span className="truncate">{user.displayName}</span></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{user.displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/campaigns"><Flag />My campaigns</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/characters"><Users />My characters</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/account"><UserRound />Account settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}><LogOut />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Phones and small screens: everything in a slide-in menu. */
function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu"><Menu /></Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader><SheetTitle className="font-serif">Menu</SheetTitle></SheetHeader>
        <nav className="flex flex-col gap-1 px-3" aria-label="Menu">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2.5 font-semibold hover:bg-accent', isActive && 'bg-accent text-accent-foreground')}>
              <n.icon className="size-5" />{n.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t bg-card xl:hidden" aria-label="Main">
      {NAV.filter((n) => n.tab).map((n) => (
        <NavLink key={n.to} to={n.to}
          className={({ isActive }) => cn('flex flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>
          <n.icon className="size-5" />{n.label}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * The gold banner under the top bar inside a campaign hub, so it is always
 * clear whether you are browsing the site or in a campaign.
 */
export function CampaignBar({ group }: { group: Group }) {
  const { groups } = useSession();
  const others = groups.filter((g) => g.id !== group.id);
  return (
    <div className="sticky top-[3.875rem] z-30 border-b-2 border-gold bg-gold-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-3">
          <Flag className="size-5 text-gold-ink" aria-hidden />
          <div className="leading-tight">
            <span className="kicker block">Campaign</span>
            <b className="font-serif text-lg">{group.name}</b>
          </div>
          <Badge variant={group.role === 'dm' ? 'default' : 'secondary'}>{group.role === 'dm' ? <><Crown />DM</> : 'Player'}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {others.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">Switch</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {others.map((g) => (
                  <DropdownMenuItem key={g.id} asChild><Link to={`/campaign/${g.id}`}>{g.role === 'dm' ? <Crown /> : <Flag />}{g.name}</Link></DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/campaigns">All campaigns</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft />Exit to site</Link></Button>
        </div>
      </div>
    </div>
  );
}
