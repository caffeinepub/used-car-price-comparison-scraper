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
  BarChart3,
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
  Layers,
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
import DealerDemandHeatmapPage from "./pages/DealerDemandHeatmapPage";
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
import RegionalBreakdownPage from "./pages/RegionalBreakdownPage";
import SavedSearchesPage from "./pages/SavedSearchesPage";
import SeasonalPricingPage from "./pages/SeasonalPricingPage";
import SharedComparisonPage from "./pages/SharedComparisonPage";
import SharedWatchlistPage from "./pages/SharedWatchlistPage";
import ShouldIWaitPage from "./pages/ShouldIWaitPage";
import TCOTimelinePage from "./pages/TCOTimelinePage";
import TrimAnalyzerPage from "./pages/TrimAnalyzerPage";
import WatchlistPage from "./pages/WatchlistPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

// App icons – referenced here so the build pipeline preserves these files
const _APP_ICON = "/assets/generated/atp-touch-icon.dim_180x180.png";
const _APP_ICON_LG = "/assets/generated/atp-app-icon.dim_512x512.png";

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
  { to: "/trim-analyzer", icon: Layers, label: "Trim Analyzer" },
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
];

const MARKET_INTEL_TOOLS = [
  { to: "/market-saturation", icon: Signal, label: "Market Saturation" },
  { to: "/cross-market", icon: Globe, label: "Cross-Market Comparison" },
  { to: "/seasonal-pricing", icon: CalendarDays, label: "Seasonal Pricing" },
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

// ─── Mobile Nav Link ──────────────────────────────────────────────────────────

function NavLink({
  to,
  icon: Icon,
  label,
  onClick,
  ocid,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  ocid?: string;
}) {
  const isActive =
    window.location.pathname === to || window.location.hash === `#${to}`;
  return (
    <Link
      to={to}
      onClick={onClick}
      data-ocid={ocid}
      className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
        isActive
          ? "bg-amber/10 text-amber border border-amber/20"
          : "text-muted-text hover:text-foreground hover:bg-surface"
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </Link>
  );
}

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
        <span className="font-bold text-sm text-foreground whitespace-nowrap hidden sm:inline">
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

// ─── Nav Card Grid ────────────────────────────────────────────────────────────

interface NavCardDef {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  ocid: string;
  accent?: boolean;
}

interface NavSectionDef {
  title: string;
  accent?: boolean;
  cards: NavCardDef[];
}

function NavCardGrid({
  role,
  navigate,
}: {
  role: AppRole;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const showBuyerTools = role === "buyer" || role === "admin";
  const showDealerTools = role === "dealer" || role === "admin";

  const sections: NavSectionDef[] = [
    {
      title: "Core",
      cards: [
        {
          to: "/",
          icon: BarChart2,
          label: "Dashboard",
          description: "Track & manage listings",
          ocid: "nav_card.core.dashboard.button",
        },
        {
          to: "/add",
          icon: PlusCircle,
          label: "Add Listing",
          description: "Add a new vehicle listing",
          ocid: "nav_card.core.add.button",
        },
        {
          to: "/import",
          icon: Upload,
          label: "Import",
          description: "Bulk import via CSV",
          ocid: "nav_card.core.import.button",
        },
        {
          to: "/compare",
          icon: Car,
          label: "Compare",
          description: "Compare prices by model",
          ocid: "nav_card.core.compare.button",
        },
        {
          to: "/market",
          icon: TrendingDown,
          label: "Market",
          description: "Market overview & trends",
          ocid: "nav_card.core.market.button",
        },
      ],
    },
    {
      title: "Tracking",
      cards: [
        {
          to: "/watchlist",
          icon: Heart,
          label: "Watchlist",
          description: "Monitor saved makes & models",
          ocid: "nav_card.tracking.watchlist.button",
        },
        {
          to: "/custom-alerts",
          icon: Zap,
          label: "Alert Rules",
          description: "Custom price alert formulas",
          ocid: "nav_card.tracking.alert_rules.button",
        },
        {
          to: "/saved-searches",
          icon: BookmarkCheck,
          label: "Saved Searches",
          description: "Saved filter configurations",
          ocid: "nav_card.tracking.saved_searches.button",
        },
        {
          to: "/activity",
          icon: Activity,
          label: "Activity",
          description: "Timeline of all changes",
          ocid: "nav_card.tracking.activity.button",
        },
      ],
    },
    {
      title: "Analysis",
      cards: [
        {
          to: "/cross-search",
          icon: Search,
          label: "Cross Search",
          description: "Search across all models",
          ocid: "nav_card.analysis.cross_search.button",
        },
        {
          to: "/depreciation",
          icon: TrendingDown,
          label: "Depreciation",
          description: "Value loss over time",
          ocid: "nav_card.analysis.depreciation.button",
        },
        {
          to: "/duplicates",
          icon: GitMerge,
          label: "Duplicates",
          description: "Detect & merge duplicates",
          ocid: "nav_card.analysis.duplicates.button",
        },
        {
          to: "/ownership-cost",
          icon: Calculator,
          label: "Cost Calculator",
          description: "Annual ownership costs",
          ocid: "nav_card.analysis.cost_calculator.button",
        },
        {
          to: "/regional",
          icon: MapPin,
          label: "Regions",
          description: "Regional sourcing breakdown",
          ocid: "nav_card.analysis.regions.button",
        },
        {
          to: "/dealer-ratings",
          icon: Star,
          label: "Dealer Ratings",
          description: "Community dealer reviews",
          ocid: "nav_card.analysis.dealer_ratings.button",
        },
      ],
    },
    {
      title: "Market Intel",
      accent: true,
      cards: [
        {
          to: "/market-saturation",
          icon: Signal,
          label: "Market Saturation",
          description: "Listing volume & leverage",
          ocid: "nav_card.market_intel.saturation.button",
          accent: true,
        },
        {
          to: "/cross-market",
          icon: Globe,
          label: "Cross-Market",
          description: "Compare prices by source",
          ocid: "nav_card.market_intel.cross_market.button",
          accent: true,
        },
        {
          to: "/seasonal-pricing",
          icon: CalendarDays,
          label: "Seasonal Pricing",
          description: "Best months to buy",
          ocid: "nav_card.market_intel.seasonal_pricing.button",
          accent: true,
        },
      ],
    },
    ...(showBuyerTools
      ? [
          {
            title: "Buyer Tools",
            accent: true,
            cards: [
              {
                to: "/negotiation-coach",
                icon: MessageSquare,
                label: "Negotiation Coach",
                description: "Step-by-step dealer scripts",
                ocid: "nav_card.buyer_tools.negotiation_coach.button",
                accent: true,
              },
              {
                to: "/should-i-wait",
                icon: Clock,
                label: "Should I Wait?",
                description: "Seasonal buy/wait signal",
                ocid: "nav_card.buyer_tools.should_i_wait.button",
                accent: true,
              },
              {
                to: "/tco-timeline",
                icon: LineChart,
                label: "TCO Timeline",
                description: "5-year cost projection",
                ocid: "nav_card.buyer_tools.tco_timeline.button",
                accent: true,
              },
              {
                to: "/trim-analyzer",
                icon: Layers,
                label: "Trim Analyzer",
                description: "Is the trim upgrade worth it?",
                ocid: "nav_card.buyer_tools.trim_analyzer.button",
                accent: true,
              },
              {
                to: "/deal-expiry",
                icon: Timer,
                label: "Deal Expiry",
                description: "How long before deal expires",
                ocid: "nav_card.buyer_tools.deal_expiry.button",
                accent: true,
              },
            ] as NavCardDef[],
          } as NavSectionDef,
        ]
      : []),
    ...(showDealerTools
      ? [
          {
            title: "Dealer Tools",
            accent: true,
            cards: [
              {
                to: "/dealer/pricing-radar",
                icon: Radar,
                label: "Pricing Radar",
                description: "vs market average",
                ocid: "nav_card.dealer_tools.pricing_radar.button",
                accent: true,
              },
              {
                to: "/dealer/lot-tracker",
                icon: Clock,
                label: "Lot Tracker",
                description: "Aging inventory alerts",
                ocid: "nav_card.dealer_tools.lot_tracker.button",
                accent: true,
              },
              {
                to: "/dealer/demand-heatmap",
                icon: Flame,
                label: "Demand Heatmap",
                description: "Most searched models",
                ocid: "nav_card.dealer_tools.demand_heatmap.button",
                accent: true,
              },
              {
                to: "/dealer/turnover",
                icon: RefreshCw,
                label: "Turnover Report",
                description: "Inventory velocity",
                ocid: "nav_card.dealer_tools.turnover_report.button",
                accent: true,
              },
              {
                to: "/dealer/price-elasticity",
                icon: TrendingDown,
                label: "Price Elasticity",
                description: "Value by trim",
                ocid: "nav_card.dealer_tools.price_elasticity.button",
                accent: true,
              },
            ] as NavCardDef[],
          } as NavSectionDef,
        ]
      : []),
  ];

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      {/* Compact status bar — replaces the redundant logo block */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {greeting} —{" "}
            <span className="text-muted-text font-normal">{dateLabel}</span>
          </h1>
          <p className="text-xs text-muted-text mt-0.5">
            Select a tool below or scroll down to your listings
          </p>
        </div>
        {role && role !== "admin" && (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber/10 text-amber border border-amber/20">
            {role === "buyer" ? "Buyer" : "Dealer"} view
          </span>
        )}
      </div>

      <div className="space-y-8">
        {sections.map((section) => {
          const isAccent = section.accent;
          const inner = (
            <>
              {/* Section label */}
              <div className="flex items-center gap-2 mb-3">
                {isAccent && (
                  <BarChart3 className="w-3.5 h-3.5 text-amber shrink-0" />
                )}
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${
                    isAccent ? "text-amber" : "text-muted-text/70"
                  }`}
                >
                  {section.title}
                </span>
                {!isAccent && (
                  <div className="flex-1 h-px bg-steel-border/50" />
                )}
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {section.cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.to}
                      type="button"
                      onClick={() => navigate({ to: card.to })}
                      data-ocid={card.ocid}
                      className={`rounded-xl border bg-surface p-4 flex flex-col items-start gap-3 cursor-pointer text-left shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber group hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm ${
                        card.accent
                          ? "border-amber/20 hover:border-amber/50 hover:bg-amber/5"
                          : "border-steel-border hover:border-amber/40 hover:bg-surface"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          card.accent
                            ? "bg-amber/10 border border-amber/20 group-hover:bg-amber/20"
                            : "bg-background border border-steel-border group-hover:border-amber/30 group-hover:bg-amber/5"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 transition-colors ${
                            card.accent
                              ? "text-amber"
                              : "text-muted-text group-hover:text-amber"
                          }`}
                        />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 w-full">
                        <p className="text-sm font-semibold text-foreground leading-tight mb-0.5">
                          {card.label}
                        </p>
                        <p className="text-xs text-muted-text leading-snug line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          );

          return isAccent ? (
            <div
              key={section.title}
              className="rounded-2xl border border-amber/10 bg-amber/[0.03] px-4 py-5"
            >
              {inner}
            </div>
          ) : (
            <div key={section.title}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Home Screen wrapper (NavCardGrid + Dashboard) ────────────────────────────

function HomeScreen() {
  const { role } = useAppRole();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <NavCardGrid role={role} navigate={navigate} />
      {/* Dashboard section divider */}
      <div className="max-w-screen-2xl mx-auto px-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-steel-border/60" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-text/50 shrink-0 flex items-center gap-1.5">
            <BarChart2 className="w-3 h-3" />
            Your Listings
          </span>
          <div className="flex-1 h-px bg-steel-border/60" />
        </div>
      </div>
      <DashboardPage />
    </div>
  );
}

// ─── Mobile-only Theme Toggle ─────────────────────────────────────────────────

function MobileThemeToggle() {
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

// ─── Mobile-only Auth Button ──────────────────────────────────────────────────

function MobileAuthButton({ onSignInClick }: { onSignInClick: () => void }) {
  const { clear, loginStatus, identity } = useInternetIdentity();
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

// ─── Mobile FAB Nav ───────────────────────────────────────────────────────────

function MobileNav({
  role,
  clearRole,
  identity,
  showBuyerTools,
  showDealerTools,
  onSignInClick,
}: {
  role: AppRole;
  clearRole: () => void;
  identity: any;
  showBuyerTools: boolean;
  showDealerTools: boolean;
  onSignInClick: () => void;
}) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={close}
          onKeyDown={(e) => e.key === "Escape" && close()}
          aria-hidden="true"
        />
      )}

      {/* Slide-up drawer panel */}
      <div
        className={`fixed bottom-16 right-2 z-50 md:hidden w-[min(340px,calc(100vw-16px))] bg-surface border border-steel-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right ${
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-steel-border">
          <div className="flex items-center gap-2">
            <ATPLogo size={22} />
            <span className="font-bold text-sm text-foreground">
              Auto Track <span className="text-amber">Pro</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MobileThemeToggle />
            <MobileAuthButton onSignInClick={onSignInClick} />
          </div>
        </div>

        {/* Scrollable nav content */}
        <div className="overflow-y-auto max-h-[70vh] px-3 py-3 space-y-3">
          {/* Primary nav items */}
          <div className="grid grid-cols-2 gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} {...item} onClick={close} />
            ))}
          </div>

          {/* More / secondary items */}
          <div className="border-t border-steel-border pt-2.5">
            <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest px-1 mb-1.5">
              More
            </p>
            <div className="grid grid-cols-2 gap-1">
              {MORE_ITEMS.map((item) => (
                <NavLink key={item.to} {...item} onClick={close} />
              ))}
            </div>
          </div>

          {/* Market Intel */}
          <div className="border-t border-steel-border pt-2.5">
            <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest px-1 mb-1.5 flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-amber" />
              Market Intel
            </p>
            <div className="flex flex-col gap-1">
              {MARKET_INTEL_TOOLS.map((item) => (
                <NavLink key={item.to} {...item} onClick={close} />
              ))}
            </div>
          </div>

          {/* Buyer Tools */}
          {showBuyerTools && (
            <div className="border-t border-steel-border pt-2.5">
              <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest px-1 mb-1.5 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber" />
                Buyer Tools
              </p>
              <div className="flex flex-col gap-1">
                {BUYER_TOOLS.map((item) => (
                  <NavLink key={item.to} {...item} onClick={close} />
                ))}
              </div>
            </div>
          )}

          {/* Dealer Tools */}
          {showDealerTools && (
            <div className="border-t border-steel-border pt-2.5">
              <p className="text-[10px] text-muted-text font-bold uppercase tracking-widest px-1 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-amber" />
                Dealer Tools
              </p>
              <div className="flex flex-col gap-1">
                {DEALER_TOOLS.map((item) => (
                  <NavLink key={item.to} {...item} onClick={close} />
                ))}
              </div>
            </div>
          )}

          {/* Switch Role */}
          {identity && role && role !== "admin" && (
            <div className="border-t border-steel-border pt-2.5">
              <button
                type="button"
                onClick={() => {
                  close();
                  clearRole();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-amber/30 text-amber bg-amber/10 hover:bg-amber/20 transition-colors text-xs font-semibold"
                data-ocid="nav.mobile_switch_role.button"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Switch Role (currently {role === "buyer" ? "Buyer" : "Dealer"})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        data-ocid="nav.mobile_fab.button"
        className="fixed bottom-4 right-4 z-50 md:hidden w-12 h-12 rounded-full bg-amber text-charcoal shadow-lg hover:bg-amber/90 active:scale-95 flex items-center justify-center transition-all duration-200"
      >
        <div
          className={`transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"}`}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </div>
      </button>
    </>
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

      {/* ── Main content area (offset for header height) ── */}
      <div className="flex-1 flex flex-col min-w-0 pt-14">
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

        {/* Page content */}
        <main className="flex-1">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="border-t border-steel-border bg-surface mt-auto">
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

      {/* ── Mobile FAB Nav (fixed, visible only on mobile) ── */}
      <MobileNav
        role={role}
        clearRole={clearRole}
        identity={identity}
        showBuyerTools={showBuyerTools}
        showDealerTools={showDealerTools}
        onSignInClick={handleSignInClick}
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
  component: HomeScreen,
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
  dealerRatingsRoute,
  marketSaturationRoute,
  crossMarketRoute,
  seasonalPricingRoute,
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
