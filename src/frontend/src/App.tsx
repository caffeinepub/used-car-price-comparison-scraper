import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import {
  Activity,
  BarChart2,
  Bell,
  BookmarkCheck,
  Calculator,
  Car,
  ChevronDown,
  GitMerge,
  Heart,
  MapPin,
  Menu,
  Moon,
  PlusCircle,
  Search,
  Sun,
  TrendingDown,
  Upload,
  X,
} from "lucide-react";
import { ThemeProvider } from "next-themes";
import type React from "react";
import { useEffect, useState } from "react";
import PriceAlertBanner from "./components/PriceAlertBanner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useTheme } from "./hooks/useTheme";

import ActivityLogPage from "./pages/ActivityLogPage";
import AddListingPage from "./pages/AddListingPage";
import CSVImportPage from "./pages/CSVImportPage";
import ComparisonPage from "./pages/ComparisonPage";
import CrossModelSearchPage from "./pages/CrossModelSearchPage";
// Pages
import DashboardPage from "./pages/DashboardPage";
import DepreciationCurvePage from "./pages/DepreciationCurvePage";
import DuplicateMergePage from "./pages/DuplicateMergePage";
import MarketOverviewPage from "./pages/MarketOverviewPage";
import OwnershipCostPage from "./pages/OwnershipCostPage";
import PriceAlertsPage from "./pages/PriceAlertsPage";
import RegionalBreakdownPage from "./pages/RegionalBreakdownPage";
import SavedSearchesPage from "./pages/SavedSearchesPage";
import SharedComparisonPage from "./pages/SharedComparisonPage";
import SharedWatchlistPage from "./pages/SharedWatchlistPage";
import WatchlistPage from "./pages/WatchlistPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

// App icons – referenced here so the build pipeline preserves these files
const _APP_ICON = "/assets/generated/atp-touch-icon.dim_180x180.png";
const _APP_ICON_LG = "/assets/generated/atp-app-icon.dim_512x512.png";

// ─── Profile Setup Modal ──────────────────────────────────────────────────────

function ProfileSetupModal({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { actor } = useActor();

  const handleSave = async () => {
    if (!name.trim() || !actor) return;
    setSaving(true);
    try {
      await actor.saveCallerUserProfile({ name: name.trim() });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-steel-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Welcome!</h2>
            <p className="text-xs text-muted-text">
              Set up your profile to get started
            </p>
          </div>
        </div>
        <label
          htmlFor="profile-name"
          className="block text-xs font-medium text-muted-text mb-1.5"
        >
          Your name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="e.g. Alex Johnson"
          className="w-full bg-background border border-steel-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-text focus:outline-none focus:ring-1 focus:ring-amber mb-4"
        />
        <Button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full bg-amber hover:bg-amber/90 text-charcoal font-bold"
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg border border-steel-border bg-surface hover:border-amber/40 flex items-center justify-center transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-muted-text" />
      ) : (
        <Moon className="w-4 h-4 text-muted-text" />
      )}
    </button>
  );
}

// ─── Auth Button ──────────────────────────────────────────────────────────────

function AuthButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      qc.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleAuth}
      disabled={isLoggingIn}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
        isAuthenticated
          ? "border-steel-border text-muted-text hover:border-amber/40 hover:text-foreground bg-surface"
          : "border-amber/40 text-amber hover:bg-amber/10 bg-transparent"
      } disabled:opacity-50`}
    >
      {isLoggingIn ? "Signing in…" : isAuthenticated ? "Sign out" : "Sign in"}
    </button>
  );
}

// ─── Nav Link ─────────────────────────────────────────────────────────────────

function NavLink({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  const isActive =
    window.location.pathname === to || window.location.hash === `#${to}`;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
        isActive
          ? "bg-amber/10 text-amber border border-amber/20"
          : "text-muted-text hover:text-foreground hover:bg-surface"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: "/", icon: BarChart2, label: "Dashboard" },
  { to: "/add", icon: PlusCircle, label: "Add Listing" },
  { to: "/import", icon: Upload, label: "Import" },
  { to: "/compare", icon: Car, label: "Compare" },
  { to: "/market", icon: TrendingDown, label: "Market" },
  { to: "/cross-search", icon: Search, label: "Cross-Search" },
  { to: "/depreciation", icon: TrendingDown, label: "Depreciation" },
  { to: "/duplicates", icon: GitMerge, label: "Duplicates" },
  { to: "/watchlist", icon: Heart, label: "Watchlist" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/saved-searches", icon: BookmarkCheck, label: "Saved" },
  { to: "/activity", icon: Activity, label: "Activity" },
  { to: "/ownership-cost", icon: Calculator, label: "Cost Calc" },
  { to: "/regional", icon: MapPin, label: "Regions" },
];

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // For the shared comparison route, render without nav/header/footer
  const isSharedRoute = window.location.pathname === "/shared-comparison";

  useEffect(() => {
    if (!identity || !actor || profileChecked) return;
    (async () => {
      try {
        const profile = await actor.getCallerUserProfile();
        if (!profile) setShowProfileSetup(true);
      } catch {
        // ignore
      } finally {
        setProfileChecked(true);
      }
    })();
  }, [identity, actor, profileChecked]);

  useEffect(() => {
    if (!identity) {
      setProfileChecked(false);
      setShowProfileSetup(false);
    }
  }, [identity]);

  // Shared comparison page gets a bare layout (no nav/auth/footer)
  if (isSharedRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-steel-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Auto Track Pro logo"
              >
                <title>Auto Track Pro logo</title>
                <polygon
                  points="18,2 33,10 33,26 18,34 3,26 3,10"
                  fill="#1C1C2E"
                  stroke="#F59E0B"
                  strokeWidth="2"
                />
                <text
                  x="18"
                  y="23"
                  textAnchor="middle"
                  fontFamily="Rajdhani, sans-serif"
                  fontWeight="700"
                  fontSize="13"
                  fill="#F59E0B"
                >
                  ATP
                </text>
              </svg>
              <span className="font-bold text-sm text-foreground hidden sm:block">
                Auto Track <span className="text-amber">Pro</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden xl:flex items-center gap-0.5 flex-1 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} {...item} />
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <AuthButton />
              {/* Mobile menu toggle */}
              <button
                type="button"
                className="xl:hidden w-8 h-8 rounded-lg border border-steel-border bg-surface flex items-center justify-center"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-steel-border bg-background px-4 py-3">
            <div className="grid grid-cols-3 gap-1.5">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  {...item}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Alert banner */}
      <PriceAlertBanner />

      {/* Profile setup */}
      {showProfileSetup && (
        <ProfileSetupModal
          onComplete={() => {
            setShowProfileSetup(false);
          }}
        />
      )}

      {/* Page content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="border-t border-steel-border bg-surface mt-auto">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-text">
          <div className="flex items-center gap-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Auto Track Pro logo"
            >
              <title>Auto Track Pro logo</title>
              <polygon
                points="18,2 33,10 33,26 18,34 3,26 3,10"
                fill="#1C1C2E"
                stroke="#F59E0B"
                strokeWidth="2"
              />
              <text
                x="18"
                y="23"
                textAnchor="middle"
                fontFamily="Rajdhani, sans-serif"
                fontWeight="700"
                fontSize="13"
                fill="#F59E0B"
              >
                ATP
              </text>
            </svg>
            <span>
              © {new Date().getFullYear()} Auto Track Pro — Used Car
              Intelligence
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});
const addRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add",
  component: AddListingPage,
});
const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compare",
  component: ComparisonPage,
});
const importRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/import",
  component: CSVImportPage,
});
const watchlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watchlist",
  component: WatchlistPage,
});
const alertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/alerts",
  component: PriceAlertsPage,
});
const savedSearchesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved-searches",
  component: SavedSearchesPage,
});
const marketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/market",
  component: MarketOverviewPage,
});
const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activity",
  component: ActivityLogPage,
});
const sharedWatchlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shared-watchlist/$token",
  component: SharedWatchlistPage,
});
const depreciationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/depreciation",
  component: DepreciationCurvePage,
});
const crossSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cross-search",
  component: CrossModelSearchPage,
});
const duplicatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/duplicates",
  component: DuplicateMergePage,
});
const ownershipCostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ownership-cost",
  component: OwnershipCostPage,
});
const sharedComparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shared-comparison",
  component: SharedComparisonPage,
});
const regionalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/regional",
  component: RegionalBreakdownPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  addRoute,
  compareRoute,
  importRoute,
  watchlistRoute,
  alertsRoute,
  savedSearchesRoute,
  marketRoute,
  activityRoute,
  sharedWatchlistRoute,
  depreciationRoute,
  crossSearchRoute,
  duplicatesRoute,
  ownershipCostRoute,
  sharedComparisonRoute,
  regionalRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

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
