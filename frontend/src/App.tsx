import React, { useState, useEffect } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  Link,
  useRouterState,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Sun, Moon, Car, Menu, X, Heart } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import PriceAlertBanner from './components/PriceAlertBanner';

// Pages
import DashboardPage from './pages/DashboardPage';
import AddListingPage from './pages/AddListingPage';
import ComparisonPage from './pages/ComparisonPage';
import WatchlistPage from './pages/WatchlistPage';
import PriceAlertsPage from './pages/PriceAlertsPage';
import SavedSearchesPage from './pages/SavedSearchesPage';
import CSVImportPage from './pages/CSVImportPage';
import MarketOverviewPage from './pages/MarketOverviewPage';
import DuplicateMergePage from './pages/DuplicateMergePage';
import ActivityLogPage from './pages/ActivityLogPage';
import SharedWatchlistPage from './pages/SharedWatchlistPage';
import DepreciationCurvePage from './pages/DepreciationCurvePage';
import CrossModelSearchPage from './pages/CrossModelSearchPage';

const queryClient = new QueryClient();

// ─── Routes ────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardPage });
const addRoute = createRoute({ getParentRoute: () => rootRoute, path: '/add', component: AddListingPage });
const comparisonRoute = createRoute({ getParentRoute: () => rootRoute, path: '/comparison', component: ComparisonPage });
const watchlistRoute = createRoute({ getParentRoute: () => rootRoute, path: '/watchlist', component: WatchlistPage });
const alertsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/alerts', component: PriceAlertsPage });
const savedSearchesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/saved-searches', component: SavedSearchesPage });
const importRoute = createRoute({ getParentRoute: () => rootRoute, path: '/import', component: CSVImportPage });
const marketRoute = createRoute({ getParentRoute: () => rootRoute, path: '/market', component: MarketOverviewPage });
const duplicatesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/duplicates', component: DuplicateMergePage });
const activityRoute = createRoute({ getParentRoute: () => rootRoute, path: '/activity', component: ActivityLogPage });
const sharedWatchlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shared-watchlist/$token',
  component: SharedWatchlistPage,
});
const depreciationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/depreciation',
  component: DepreciationCurvePage,
});
const crossSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cross-search',
  component: CrossModelSearchPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  addRoute,
  comparisonRoute,
  watchlistRoute,
  alertsRoute,
  savedSearchesRoute,
  importRoute,
  marketRoute,
  duplicatesRoute,
  activityRoute,
  sharedWatchlistRoute,
  depreciationRoute,
  crossSearchRoute,
]);

const router = createRouter({ routeTree });

// ─── Theme Toggle ───────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-muted-text hover:text-amber hover:bg-amber/10 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

// ─── Auth Button ────────────────────────────────────────────────────────────
function AuthButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      qc.clear();
    } else {
      try {
        await login();
      } catch (err: any) {
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={isLoggingIn}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
        isAuthenticated
          ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
          : 'bg-amber hover:bg-amber/80 text-zinc-900'
      }`}
    >
      {isLoggingIn ? 'Signing in…' : isAuthenticated ? 'Sign Out' : 'Sign In'}
    </button>
  );
}

// ─── Nav Link ───────────────────────────────────────────────────────────────
function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const state = useRouterState();
  const isActive = state.location.pathname === to;
  return (
    <Link
      to={to}
      className={`text-xs font-medium px-2 py-1 rounded transition-colors whitespace-nowrap ${
        isActive
          ? 'text-amber bg-amber/10'
          : 'text-muted-text hover:text-foreground hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  );
}

// ─── Profile Setup Modal ────────────────────────────────────────────────────
function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isAuthenticated = !!identity;
  const showModal = isAuthenticated && !isLoading && isFetched && userProfile === null && !submitted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveProfile.mutateAsync({ name: name.trim() });
    setSubmitted(true);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-steel-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold text-foreground mb-1 font-rajdhani">Welcome!</h2>
        <p className="text-sm text-muted-text mb-4">Enter your name to get started.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 rounded bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full py-2 rounded bg-amber text-zinc-900 text-sm font-semibold hover:bg-amber/80 disabled:opacity-50 transition-colors"
          >
            {saveProfile.isPending ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────
function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/add', label: 'Add Listing' },
    { to: '/import', label: 'CSV Import' },
    { to: '/comparison', label: 'Compare' },
    { to: '/cross-search', label: 'Cross-Model Search' },
    { to: '/market', label: 'Market' },
    { to: '/depreciation', label: 'Depreciation' },
    { to: '/watchlist', label: 'Watchlist' },
    { to: '/alerts', label: 'Alerts' },
    { to: '/saved-searches', label: 'Saved Searches' },
    { to: '/duplicates', label: 'Duplicates' },
    { to: '/activity', label: 'Activity Log' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-steel-border">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center h-14 gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Car className="w-5 h-5 text-amber" />
              <span className="font-bold text-sm font-rajdhani tracking-widest text-foreground uppercase">
                AutoTrack
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 ml-auto">
              <ThemeToggle />
              <AuthButton />
              {/* Mobile menu toggle */}
              <button
                className="lg:hidden p-2 rounded text-muted-text hover:text-foreground"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="lg:hidden pb-3 flex flex-wrap gap-1">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Price Alert Banner */}
      <PriceAlertBanner />

      {/* Profile Setup */}
      <ProfileSetupModal />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-steel-border bg-surface/60 py-6 mt-8">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-text">
          <span>© {new Date().getFullYear()} AutoTrack. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-amber fill-amber" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'autotrack'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
