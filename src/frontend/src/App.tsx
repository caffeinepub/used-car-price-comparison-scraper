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
  useRouterState,
} from "@tanstack/react-router";
import {
  Activity,
  BarChart2,
  Bell,
  BookmarkCheck,
  Building2,
  Calculator,
  CalendarDays,
  Car,
  Clock,
  Flame,
  GitMerge,
  Globe,
  Heart,
  LayoutGrid,
  LineChart,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  PlusCircle,
  Radar,
  RefreshCw,
  Search,
  Shield,
  Signal,
  Star,
  Sun,
  Timer,
  TrendingDown,
  Upload,
  X,
  Zap,
} from "lucide-react";

import type React from "react";
import { Component, useEffect, useRef, useState } from "react";
import PriceAlertBanner from "./components/PriceAlertBanner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { ThemeContext, useTheme, useThemeState } from "./hooks/useTheme";

import ActivityLogPage from "./pages/ActivityLogPage";
import AddListingPage from "./pages/AddListingPage";
import CSVImportPage from "./pages/CSVImportPage";
import ComparisonPage from "./pages/ComparisonPage";
import CrossMarketPage from "./pages/CrossMarketPage";
import CrossModelSearchPage from "./pages/CrossModelSearchPage";
import CustomAlertFormulasPage from "./pages/CustomAlertFormulasPage";
// Pages
import DashboardPage from "./pages/DashboardPage";
import DealExpiryPage from "./pages/DealExpiryPage";
import DealerBuyerReadinessPage from "./pages/DealerBuyerReadinessPage";
import DealerDemandHeatmapPage from "./pages/DealerDemandHeatmapPage";
import DealerFloorPlanPage from "./pages/DealerFloorPlanPage";
import DealerLotOptimizerPage from "./pages/DealerLotOptimizerPage";
import DealerLotTrackerPage from "./pages/DealerLotTrackerPage";
import DealerPriceElasticityPage from "./pages/DealerPriceElasticityPage";
import DealerPricingRadarPage from "./pages/DealerPricingRadarPage";
import DealerRatingsPage from "./pages/DealerRatingsPage";
import DealerTurnoverReportPage from "./pages/DealerTurnoverReportPage";
import DepreciationCurvePage from "./pages/DepreciationCurvePage";
import DuplicateMergePage from "./pages/DuplicateMergePage";
import MarketOverviewPage from "./pages/MarketOverviewPage";
import MarketSaturationPage from "./pages/MarketSaturationPage";
import NegotiationCoachPage from "./pages/NegotiationCoachPage";
import OwnershipCostPage from "./pages/OwnershipCostPage";
import PriceAlertsPage from "./pages/PriceAlertsPage";
import PriceVelocityPage from "./pages/PriceVelocityPage";
import RegionalArbitragePage from "./pages/RegionalArbitragePage";
import RegionalBreakdownPage from "./pages/RegionalBreakdownPage";
import SavedSearchesPage from "./pages/SavedSearchesPage";
import SeasonalPricingPage from "./pages/SeasonalPricingPage";
import SharedComparisonPage from "./pages/SharedComparisonPage";
import SharedWatchlistPage from "./pages/SharedWatchlistPage";
import ShouldIWaitPage from "./pages/ShouldIWaitPage";
import SupplyShockPage from "./pages/SupplyShockPage";
import TCOTimelinePage from "./pages/TCOTimelinePage";
import TrimAnalyzerPage from "./pages/TrimAnalyzerPage";
import WatchlistPage from "./pages/WatchlistPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

import atpAppIcon from "/assets/generated/atp-app-icon.dim_512x512.png";
// App icons – imported as real ES module assets so the build pipeline preserves these files
import atpTouchIcon from "/assets/generated/atp-touch-icon.dim_180x180.png";
// Keep references used so tree-shaking doesn't remove them
const _ATP_TOUCH_ICON = atpTouchIcon;
const _ATP_APP_ICON = atpAppIcon;

// ─── ATP Logo SVG (theme-aware) ───────────────────────────────────────────────

function ATPLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Auto Track Pro logo"
    >
      <title>Auto Track Pro logo</title>
      <polygon
        points="18,2 33,10 33,26 18,34 3,26 3,10"
        className="fill-foreground"
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
  );
}

// ─── App Role (localStorage-backed, per principal) ───────────────────────────

type AppRole = "buyer" | "dealer" | "admin" | null;

function getStoredRole(principalId: string): "buyer" | "dealer" | null {
  const stored = localStorage.getItem(`atp_role_${principalId}`);
  if (stored === "buyer" || stored === "dealer") return stored;
  return null;
}

function setStoredRole(principalId: string, role: "buyer" | "dealer") {
  localStorage.setItem(`atp_role_${principalId}`, role);
}

function useAppRole(): {
  role: AppRole;
  isLoading: boolean;
  setRole: (role: "buyer" | "dealer") => void;
  clearRole: () => void;
} {
  const { identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [role, setRoleState] = useState<AppRole>(null);
  const [isLoading, setIsLoading] = useState(false);
  const checkedRef = useRef(false);

  const principalId = identity?.getPrincipal().toString() ?? null;

  useEffect(() => {
    if (!identity || !actor || isFetching) return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      setIsLoading(true);
      try {
        const isAdmin = await actor.isCallerAdmin();
        if (isAdmin) {
          setRoleState("admin");
          return;
        }
        const stored = principalId ? getStoredRole(principalId) : null;
        setRoleState(stored);
      } catch {
        const stored = principalId ? getStoredRole(principalId) : null;
        setRoleState(stored);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [identity, actor, isFetching, principalId]);

  useEffect(() => {
    if (!identity) {
      setRoleState(null);
      checkedRef.current = false;
    }
  }, [identity]);

  const setRole = (newRole: "buyer" | "dealer") => {
    if (principalId) setStoredRole(principalId, newRole);
    setRoleState(newRole);
  };

  const clearRole = () => {
    if (principalId) localStorage.removeItem(`atp_role_${principalId}`);
    setRoleState(null);
    checkedRef.current = false;
  };

  return { role, isLoading, setRole, clearRole };
}

// ─── Pre-Login Role Picker Modal ──────────────────────────────────────────────

function PreLoginRoleModal({
  onSelect,
  onClose,
}: {
  onSelect: (role: "buyer" | "dealer") => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      data-ocid="pre_login_modal.modal"
    >
      <div className="bg-surface border border-steel-border rounded-2xl p-8 w-full max-w-lg shadow-2xl mx-4 relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          data-ocid="pre_login_modal.close_button"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-text hover:text-foreground hover:bg-surface border border-transparent hover:border-steel-border transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ATPLogo size={48} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            How would you like to <span className="text-amber">sign in</span>?
          </h2>
          <p className="text-sm text-muted-text">
            Choose your role to personalize your experience
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Buyer card */}
          <button
            type="button"
            onClick={() => onSelect("buyer")}
            data-ocid="pre_login_modal.buyer_button"
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-steel-border bg-background hover:border-amber/50 hover:bg-amber/5 transition-all duration-200 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center group-hover:bg-amber/20 transition-colors">
              <Car className="w-7 h-7 text-amber" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground mb-1">
                I'm a Buyer
              </p>
              <p className="text-xs text-muted-text leading-relaxed">
                Find the best deals, track prices &amp; negotiate smarter
              </p>
            </div>
            <div className="mt-1 px-4 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-xs font-semibold text-amber group-hover:bg-amber group-hover:text-charcoal transition-colors">
              Sign in as Buyer
            </div>
          </button>

          {/* Dealer card */}
          <button
            type="button"
            onClick={() => onSelect("dealer")}
            data-ocid="pre_login_modal.dealer_button"
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-steel-border bg-background hover:border-amber/50 hover:bg-amber/5 transition-all duration-200 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center group-hover:bg-amber/20 transition-colors">
              <Building2 className="w-7 h-7 text-amber" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground mb-1">
                I'm a Dealer
              </p>
              <p className="text-xs text-muted-text leading-relaxed">
                Manage inventory, analyze markets &amp; track demand
              </p>
            </div>
            <div className="mt-1 px-4 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-xs font-semibold text-amber group-hover:bg-amber group-hover:text-charcoal transition-colors">
              Sign in as Dealer
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role Selection Modal ─────────────────────────────────────────────────────

function RoleSelectionModal({
  onSelect,
}: {
  onSelect: (role: "buyer" | "dealer") => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      data-ocid="role_selection.modal"
    >
      <div className="bg-surface border border-steel-border rounded-2xl p-8 w-full max-w-lg shadow-2xl mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ATPLogo size={48} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            How will you use <span className="text-amber">Auto Track Pro</span>?
          </h2>
          <p className="text-sm text-muted-text">
            Choose your role to personalize your experience. You can switch
            roles anytime using the badge in the header.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Buyer card */}
          <button
            type="button"
            onClick={() => onSelect("buyer")}
            data-ocid="role_selection.buyer_button"
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-steel-border bg-background hover:border-amber/50 hover:bg-amber/5 transition-all duration-200 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center group-hover:bg-amber/20 transition-colors">
              <Car className="w-7 h-7 text-amber" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground mb-1">
                I'm a Buyer
              </p>
              <p className="text-xs text-muted-text leading-relaxed">
                Find the best deals and track prices
              </p>
            </div>
            <div className="mt-1 px-4 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-xs font-semibold text-amber group-hover:bg-amber group-hover:text-charcoal transition-colors">
              Select Buyer
            </div>
          </button>

          {/* Dealer card */}
          <button
            type="button"
            onClick={() => onSelect("dealer")}
            data-ocid="role_selection.dealer_button"
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-steel-border bg-background hover:border-amber/50 hover:bg-amber/5 transition-all duration-200 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center group-hover:bg-amber/20 transition-colors">
              <Building2 className="w-7 h-7 text-amber" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground mb-1">
                I'm a Dealer
              </p>
              <p className="text-xs text-muted-text leading-relaxed">
                Manage inventory and analyze the market
              </p>
            </div>
            <div className="mt-1 px-4 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-xs font-semibold text-amber group-hover:bg-amber group-hover:text-charcoal transition-colors">
              Select Dealer
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Setup Modal ──────────────────────────────────────────────────────

function ProfileSetupModal({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { actor } = useActor();

  const handleSave = async () => {
    if (!name.trim() || !actor) return;
    setSaving(true);
    try {
      await (actor as any).saveCallerUserProfile({ name: name.trim() });
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

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="text-amber-500 text-lg font-bold mb-2">
            Something went wrong
          </div>
          <div className="text-muted-text text-sm max-w-md mb-1">
            {this.state.error.message}
          </div>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm hover:bg-amber-500/20 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Nav item data arrays ─────────────────────────────────────────────────────

const BUYER_TOOLS = [
  { to: "/negotiation-coach", icon: MessageSquare, label: "Negotiation Coach" },
  { to: "/should-i-wait", icon: Clock, label: "Should I Wait?" },
  { to: "/tco-timeline", icon: LineChart, label: "TCO Timeline" },
  { to: "/trim-analyzer", icon: BarChart2, label: "Trim Analyzer" },
  { to: "/deal-expiry", icon: Timer, label: "Deal Expiry" },
];

const DEALER_TOOLS = [
  { to: "/dealer/pricing-radar", icon: Radar, label: "Pricing Radar" },
  { to: "/dealer/lot-tracker", icon: Clock, label: "Lot Tracker" },
  { to: "/dealer/demand-heatmap", icon: Flame, label: "Demand Heatmap" },
  { to: "/dealer/turnover", icon: RefreshCw, label: "Turnover Report" },
  {
    to: "/dealer/price-elasticity",
    icon: TrendingDown,
    label: "Price Elasticity",
  },
  { to: "/dealer/floor-plan", icon: Calculator, label: "Floor Plan Calc" },
  { to: "/dealer/lot-optimizer", icon: LayoutGrid, label: "Lot Optimizer" },
  { to: "/dealer/buyer-readiness", icon: Zap, label: "Buyer Readiness" },
];

const MARKET_INTEL_TOOLS = [
  { to: "/market-saturation", icon: Signal, label: "Market Saturation" },
  { to: "/cross-market", icon: Globe, label: "Cross-Market Comparison" },
  { to: "/seasonal-pricing", icon: CalendarDays, label: "Seasonal Pricing" },
  {
    to: "/market-intel/price-velocity",
    icon: TrendingDown,
    label: "Price Velocity",
  },
  { to: "/market-intel/supply-shock", icon: Zap, label: "Supply Shock" },
  {
    to: "/market-intel/regional-arbitrage",
    icon: MapPin,
    label: "Regional Arbitrage",
  },
];

// Mobile nav items
const NAV_ITEMS = [
  { to: "/", icon: BarChart2, label: "Dashboard" },
  { to: "/add", icon: PlusCircle, label: "Add" },
  { to: "/import", icon: Upload, label: "Import" },
  { to: "/compare", icon: Car, label: "Compare" },
  { to: "/market", icon: TrendingDown, label: "Market" },
  { to: "/watchlist", icon: Heart, label: "Watchlist" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/activity", icon: Activity, label: "Activity" },
  { to: "/dealer-ratings", icon: Star, label: "Ratings" },
];

const MORE_ITEMS = [
  { to: "/cross-search", icon: Search, label: "Cross-Search" },
  { to: "/depreciation", icon: TrendingDown, label: "Depreciation" },
  { to: "/duplicates", icon: GitMerge, label: "Duplicates" },
  { to: "/ownership-cost", icon: Calculator, label: "Cost Calc" },
  { to: "/regional", icon: MapPin, label: "Regions" },
  { to: "/saved-searches", icon: BookmarkCheck, label: "Saved Searches" },
  { to: "/custom-alerts", icon: Zap, label: "Alert Rules" },
];

// ─── App Header ───────────────────────────────────────────────────────────────

function AppHeader({
  role,
  clearRole,
  identity,
  onSignInClick,
}: {
  role: AppRole;
  clearRole: () => void;
  identity: any;
  onSignInClick: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { clear, loginStatus } = useInternetIdentity();
  const qc = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      qc.clear();
    } else {
      onSignInClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-surface/95 backdrop-blur-md border-b border-steel-border flex items-center px-4 gap-3 shadow-sm">
      {/* Logo + App name */}
      <Link
        to="/"
        className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
        data-ocid="header.logo.link"
      >
        <ATPLogo size={28} />
        <span className="font-bold text-sm text-foreground whitespace-nowrap">
          Auto Track <span className="text-amber">Pro</span>
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Role badge */}
        {identity && role && role !== "admin" && (
          <button
            type="button"
            onClick={clearRole}
            title="Click to switch role"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber/30 text-amber bg-amber/10 hover:bg-amber/20 transition-colors text-xs font-semibold"
            data-ocid="header.role_badge.toggle"
          >
            {role === "buyer" ? (
              <Car className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Building2 className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {role === "buyer" ? "Buyer" : "Dealer"}
            </span>
            <RefreshCw className="w-3 h-3 opacity-60" />
          </button>
        )}

        {/* Admin badge */}
        {identity && role === "admin" && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-500/30 text-slate-400 bg-slate-500/10 text-xs font-semibold"
            title="Admin — sees all tools"
            data-ocid="nav.admin_badge.panel"
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Admin</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg border border-steel-border bg-background hover:border-amber/40 flex items-center justify-center transition-colors"
          aria-label="Toggle theme"
          title="Toggle theme"
          data-ocid="header.theme.toggle"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-muted-text" />
          ) : (
            <Moon className="w-4 h-4 text-muted-text" />
          )}
        </button>

        {/* Auth button */}
        <button
          type="button"
          onClick={handleAuth}
          disabled={isLoggingIn}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
            isAuthenticated
              ? "border-steel-border text-muted-text hover:border-amber/40 hover:text-foreground bg-surface"
              : "border-amber/40 text-amber hover:bg-amber/10 bg-transparent"
          } disabled:opacity-50`}
          data-ocid="header.auth.button"
        >
          {isLoggingIn
            ? "Signing in…"
            : isAuthenticated
              ? "Sign out"
              : "Sign in"}
        </button>

        {/* Auth button (mobile) */}
        <button
          type="button"
          onClick={handleAuth}
          disabled={isLoggingIn}
          className={`sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
            isAuthenticated
              ? "border-steel-border text-muted-text hover:border-amber/40 hover:text-foreground bg-surface"
              : "border-amber/40 text-amber hover:bg-amber/10 bg-transparent"
          } disabled:opacity-50`}
          data-ocid="header.auth.button"
        >
          {isLoggingIn
            ? "Signing in…"
            : isAuthenticated
              ? "Sign out"
              : "Sign in"}
        </button>
      </div>
    </header>
  );
}

// ─── NavDrawer — full feature list, mobile fullscreen / desktop right-panel ──

function NavDrawer({
  open,
  onClose,
  showBuyerTools,
  showDealerTools,
}: {
  open: boolean;
  onClose: () => void;
  showBuyerTools: boolean;
  showDealerTools: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNav = (to: string) => {
    navigate({ to });
    onClose();
  };

  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const DrawerItem = ({
    item,
    ocid,
    exact = false,
  }: {
    item: { to: string; icon: React.ElementType; label: string };
    ocid?: string;
    exact?: boolean;
  }) => {
    const Icon = item.icon;
    const active = isActive(item.to, exact);
    return (
      <button
        type="button"
        onClick={() => handleNav(item.to)}
        data-ocid={ocid}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
          active
            ? "bg-amber/15 text-amber border border-amber/25"
            : "text-foreground hover:bg-surface hover:text-foreground border border-transparent"
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${active ? "text-amber" : "text-muted-text"}`}
        />
        {item.label}
      </button>
    );
  };

  const SectionLabel = ({
    icon: Icon,
    label,
    amber = false,
  }: {
    icon?: React.ElementType;
    label: string;
    amber?: boolean;
  }) => (
    <div
      className={`flex items-center gap-1.5 px-4 pt-4 pb-1 ${amber ? "text-amber" : "text-muted-text"}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 w-full cursor-default ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
      />

      {/* Drawer panel — slides up from bottom on mobile, slides in from right on desktop */}
      <dialog
        aria-label="All features navigation"
        data-ocid="nav_drawer.panel"
        open={open}
        className={`fixed z-50 bg-background border-steel-border shadow-2xl transition-transform duration-300 ease-out p-0 m-0
          bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[88vh] overflow-y-auto w-full max-w-full
          md:top-0 md:right-0 md:left-auto md:bottom-0 md:rounded-none md:rounded-l-2xl md:border-t-0 md:border-l md:w-80 md:max-h-full md:h-full
          ${
            open
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-x-full"
          }`}
      >
        {/* Drawer header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3.5 bg-background border-b border-steel-border">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-amber" />
            <span className="text-sm font-bold text-foreground">
              All Features
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-ocid="nav_drawer.close_button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-text hover:text-foreground hover:bg-surface border border-transparent hover:border-steel-border transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile drag handle indicator */}
        <div className="md:hidden flex justify-center pt-2 -mt-1 absolute top-0 left-0 right-0 pointer-events-none">
          <div className="w-10 h-1 rounded-full bg-steel-border/60" />
        </div>

        {/* Drawer content */}
        <div className="px-3 pb-6 pt-2">
          {/* Core section */}
          <SectionLabel label="Core" />
          <div className="space-y-0.5">
            <DrawerItem
              item={NAV_ITEMS[0]}
              ocid="nav_drawer.dashboard.link"
              exact
            />
            {NAV_ITEMS.slice(1).map((item, i) => (
              <DrawerItem
                key={item.to}
                item={item}
                ocid={`nav_drawer.core.link.${i + 2}`}
              />
            ))}
          </div>

          {/* More section */}
          <SectionLabel label="More Tools" />
          <div className="space-y-0.5">
            {MORE_ITEMS.map((item, i) => (
              <DrawerItem
                key={item.to}
                item={item}
                ocid={`nav_drawer.more.link.${i + 1}`}
              />
            ))}
          </div>

          {/* Market Intel section */}
          <SectionLabel icon={Signal} label="Market Intel" amber />
          <div className="space-y-0.5 rounded-xl overflow-hidden border border-amber/10 bg-amber/3 p-1">
            {MARKET_INTEL_TOOLS.map((item, i) => (
              <DrawerItem
                key={item.to}
                item={item}
                ocid={`nav_drawer.market_intel.link.${i + 1}`}
              />
            ))}
          </div>

          {/* Buyer Tools (conditional) */}
          {showBuyerTools && (
            <>
              <SectionLabel icon={Zap} label="Buyer Tools" amber />
              <div className="space-y-0.5 rounded-xl overflow-hidden border border-amber/10 bg-amber/3 p-1">
                {BUYER_TOOLS.map((item, i) => (
                  <DrawerItem
                    key={item.to}
                    item={item}
                    ocid={`nav_drawer.buyer_tools.link.${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Dealer Tools (conditional) */}
          {showDealerTools && (
            <>
              <SectionLabel icon={Building2} label="Dealer Tools" amber />
              <div className="space-y-0.5 rounded-xl overflow-hidden border border-amber/10 bg-amber/3 p-1">
                {DEALER_TOOLS.map((item, i) => (
                  <DrawerItem
                    key={item.to}
                    item={item}
                    ocid={`nav_drawer.dealer_tools.link.${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}

// ─── BottomTabBar — fixed bottom bar for mobile ───────────────────────────────

const BOTTOM_TABS = [
  { to: "/", icon: BarChart2, label: "Dashboard", exact: true },
  { to: "/add", icon: PlusCircle, label: "Add", exact: false },
  { to: "/compare", icon: Car, label: "Compare", exact: false },
  { to: "/market", icon: TrendingDown, label: "Market", exact: false },
];

function BottomTabBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface/95 backdrop-blur-md border-t border-steel-border"
      aria-label="Bottom navigation"
      data-ocid="bottom_tab_bar.panel"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-16">
        {BOTTOM_TABS.map((tab, i) => {
          const Icon = tab.icon;
          const active = isActive(tab.to, tab.exact);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              data-ocid={`bottom_tab_bar.tab.${i + 1}`}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                active ? "text-amber" : "text-muted-text hover:text-foreground"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        {/* Menu button */}
        <button
          type="button"
          onClick={onMenuOpen}
          data-ocid="bottom_tab_bar.menu_button"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-text hover:text-foreground transition-colors"
          aria-label="Open all features menu"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}

// ─── Desktop NavBar — single compact row with "All Features" button ───────────

const NAV_PILL_BASE =
  "shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap text-muted-text hover:text-foreground hover:bg-surface border border-transparent";
const NAV_PILL_ACTIVE = "bg-amber/15 text-amber border border-amber/30";

function NavBar({
  showBuyerTools: _showBuyerTools,
  showDealerTools: _showDealerTools,
  onOpenDrawer,
}: {
  showBuyerTools: boolean;
  showDealerTools: boolean;
  onOpenDrawer: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navPill = (
    item: { to: string; icon: React.ElementType; label: string },
    ocid?: string,
    exact = false,
  ) => {
    const Icon = item.icon;
    const isActive = exact
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(`${item.to}/`);
    return (
      <Link
        key={item.to}
        to={item.to}
        data-ocid={ocid}
        className={`${NAV_PILL_BASE}${isActive ? ` ${NAV_PILL_ACTIVE}` : ""}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      className="hidden md:flex bg-surface/95 backdrop-blur-md border-b border-steel-border items-center gap-1.5 px-4 py-1.5 overflow-x-auto scrollbar-none"
      aria-label="Main navigation"
      data-ocid="navbar.panel"
    >
      {/* Primary nav pills */}
      {navPill(NAV_ITEMS[0], "navbar.primary.link.1", true)}
      {NAV_ITEMS.slice(1).map((item, i) =>
        navPill(item, `navbar.primary.link.${i + 2}`),
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-2" />

      {/* All Features button */}
      <button
        type="button"
        onClick={onOpenDrawer}
        data-ocid="navbar.all_features.button"
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-amber/10 text-amber border border-amber/30 hover:bg-amber/20 transition-colors whitespace-nowrap"
        aria-label="Open all features"
      >
        <Menu className="w-3.5 h-3.5" />
        All Features
      </button>
    </nav>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function Layout() {
  const { identity, login } = useInternetIdentity();
  const { actor } = useActor();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const { role, isLoading: roleLoading, setRole, clearRole } = useAppRole();

  // Pre-login role picker state
  const [showPreLoginModal, setShowPreLoginModal] = useState(false);
  const pendingRole = useRef<"buyer" | "dealer" | null>(null);

  // Nav drawer state — shared between NavBar, BottomTabBar, and NavDrawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Show role selection only after profile is set up (or profile exists) and role is not yet chosen
  const showRoleSelection =
    !!identity &&
    profileChecked &&
    !showProfileSetup &&
    !roleLoading &&
    role === null;

  // For the shared comparison route, render without nav/header/footer
  const isSharedRoute = window.location.pathname === "/shared-comparison";

  // When identity becomes available and we have a pending role, auto-apply it
  useEffect(() => {
    if (identity && pendingRole.current) {
      setRole(pendingRole.current);
      pendingRole.current = null;
      setShowPreLoginModal(false);
    }
  }, [identity, setRole]);

  useEffect(() => {
    if (!identity || !actor || profileChecked) return;
    (async () => {
      try {
        const profile = await (actor as any).getCallerUserProfile();
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

  const handleSignInClick = () => {
    setShowPreLoginModal(true);
  };

  // Shared comparison page gets a bare layout (no nav/auth/footer)
  if (isSharedRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  const showBuyerTools = role === "buyer" || role === "admin";
  const showDealerTools = role === "dealer" || role === "admin";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Fixed top header ── */}
      <AppHeader
        role={role}
        clearRole={clearRole}
        identity={identity}
        onSignInClick={handleSignInClick}
      />

      {/* ── Main content area (offset for fixed header height = 56px / pt-14) ── */}
      <div className="flex-1 flex flex-col min-w-0 pt-14">
        {/* ── Sticky NavBar — desktop only (sits right below the header in the flow) ── */}
        <div className="sticky top-14 z-20 hidden md:block">
          <NavBar
            showBuyerTools={showBuyerTools}
            showDealerTools={showDealerTools}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
        </div>

        {/* Alert banner */}
        <PriceAlertBanner />

        {/* Pre-login role picker (shown before Internet Identity flow) */}
        {showPreLoginModal && (
          <PreLoginRoleModal
            onSelect={async (role) => {
              pendingRole.current = role;
              setShowPreLoginModal(false);
              try {
                await login();
              } catch {
                pendingRole.current = null;
              }
            }}
            onClose={() => setShowPreLoginModal(false)}
          />
        )}

        {/* Profile setup modal (shows first, before role selection) */}
        {showProfileSetup && (
          <ProfileSetupModal
            onComplete={() => {
              setShowProfileSetup(false);
            }}
          />
        )}

        {/* Role selection modal (shows after profile setup is complete, for users who didn't use pre-login picker) */}
        {showRoleSelection && (
          <RoleSelectionModal
            onSelect={(selectedRole) => {
              setRole(selectedRole);
            }}
          />
        )}

        {/* Page content — add pb-16 on mobile for bottom tab bar */}
        <main className="flex-1 pb-16 md:pb-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="border-t border-steel-border bg-surface mt-auto mb-16 md:mb-0">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-text">
            <div className="flex items-center gap-2">
              <ATPLogo size={28} />
              <span>
                © {new Date().getFullYear()} Auto Track Pro — Used Car
                Intelligence
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <BottomTabBar onMenuOpen={() => setDrawerOpen(true)} />

      {/* ── Nav Drawer — shared between mobile (full-screen slide-up) and desktop (right panel) ── */}
      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        showBuyerTools={showBuyerTools}
        showDealerTools={showDealerTools}
      />
    </div>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: Layout,
  errorComponent: ({ error }: { error: unknown }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center">
      <div className="text-amber-500 text-lg font-bold mb-2">Page Error</div>
      <div className="text-muted-foreground text-sm max-w-md">
        {String(error)}
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm hover:bg-amber-500/20 transition-colors"
      >
        Reload
      </button>
    </div>
  ),
});

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
const customAlertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/custom-alerts",
  component: CustomAlertFormulasPage,
});
const negotiationCoachRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/negotiation-coach",
  component: NegotiationCoachPage,
});
const shouldIWaitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/should-i-wait",
  component: ShouldIWaitPage,
});
const tcoTimelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tco-timeline",
  component: TCOTimelinePage,
});
const trimAnalyzerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trim-analyzer",
  component: TrimAnalyzerPage,
});
const dealExpiryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deal-expiry",
  component: DealExpiryPage,
});
const dealerPricingRadarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer/pricing-radar",
  component: DealerPricingRadarPage,
});
const dealerLotTrackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer/lot-tracker",
  component: DealerLotTrackerPage,
});
const dealerDemandHeatmapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer/demand-heatmap",
  component: DealerDemandHeatmapPage,
});
const dealerTurnoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer/turnover",
  component: DealerTurnoverReportPage,
});
const dealerPriceElasticityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer/price-elasticity",
  component: DealerPriceElasticityPage,
});
const dealerFloorPlanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer/floor-plan",
  component: DealerFloorPlanPage,
});
const dealerLotOptimizerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer/lot-optimizer",
  component: DealerLotOptimizerPage,
});
const dealerBuyerReadinessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer/buyer-readiness",
  component: DealerBuyerReadinessPage,
});
const dealerRatingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dealer-ratings",
  component: DealerRatingsPage,
});
const marketSaturationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/market-saturation",
  component: MarketSaturationPage,
});
const crossMarketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cross-market",
  component: CrossMarketPage,
});
const seasonalPricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/seasonal-pricing",
  component: SeasonalPricingPage,
});
const priceVelocityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/market-intel/price-velocity",
  component: PriceVelocityPage,
});
const supplyShockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/market-intel/supply-shock",
  component: SupplyShockPage,
});
const regionalArbitrageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/market-intel/regional-arbitrage",
  component: RegionalArbitragePage,
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
  customAlertsRoute,
  negotiationCoachRoute,
  shouldIWaitRoute,
  tcoTimelineRoute,
  trimAnalyzerRoute,
  dealExpiryRoute,
  dealerPricingRadarRoute,
  dealerLotTrackerRoute,
  dealerDemandHeatmapRoute,
  dealerTurnoverRoute,
  dealerPriceElasticityRoute,
  dealerFloorPlanRoute,
  dealerLotOptimizerRoute,
  dealerBuyerReadinessRoute,
  dealerRatingsRoute,
  marketSaturationRoute,
  crossMarketRoute,
  seasonalPricingRoute,
  priceVelocityRoute,
  supplyShockRoute,
  regionalArbitrageRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

function ThemeBootstrapper({ children }: { children: React.ReactNode }) {
  const themeState = useThemeState();
  return (
    <ThemeContext.Provider value={themeState}>{children}</ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeBootstrapper>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeBootstrapper>
    </QueryClientProvider>
  );
}
