import { useNavigate } from "@tanstack/react-router";
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
  DollarSign,
  Flame,
  GitMerge,
  Globe,
  Heart,
  LayoutGrid,
  LineChart,
  MapPin,
  MessageSquare,
  PlusCircle,
  Radar,
  RefreshCw,
  Search,
  Signal,
  Star,
  Target,
  Timer,
  TrendingDown,
  Upload,
  Zap,
} from "lucide-react";
import type React from "react";
import { useAppRoleContext } from "../hooks/useAppRoleContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  description?: string;
}

// ─── Feature Sections ─────────────────────────────────────────────────────────

const CORE_ITEMS: NavItem[] = [
  {
    to: "/add",
    icon: PlusCircle,
    label: "Add Listing",
    description: "Add a new car listing",
  },
  {
    to: "/import",
    icon: Upload,
    label: "Import",
    description: "Bulk CSV import",
  },
  {
    to: "/compare",
    icon: Car,
    label: "Compare",
    description: "Price history & comparison",
  },
  {
    to: "/market",
    icon: TrendingDown,
    label: "Market Overview",
    description: "Top deals & trends",
  },
  {
    to: "/watchlist",
    icon: Heart,
    label: "Watchlist",
    description: "Track models you love",
  },
  {
    to: "/alerts",
    icon: Bell,
    label: "Alerts",
    description: "Price drop notifications",
  },
  {
    to: "/activity",
    icon: Activity,
    label: "Activity",
    description: "Listing change history",
  },
  {
    to: "/dealer-ratings",
    icon: Star,
    label: "Ratings",
    description: "Community dealer ratings",
  },
];

const MORE_ITEMS: NavItem[] = [
  {
    to: "/cross-search",
    icon: Search,
    label: "Cross-Search",
    description: "Search across all models",
  },
  {
    to: "/depreciation",
    icon: TrendingDown,
    label: "Depreciation",
    description: "Value loss over time",
  },
  {
    to: "/duplicates",
    icon: GitMerge,
    label: "Duplicates",
    description: "Merge duplicate listings",
  },
  {
    to: "/ownership-cost",
    icon: Calculator,
    label: "Cost Calc",
    description: "Annual ownership cost",
  },
  {
    to: "/regional",
    icon: MapPin,
    label: "Regions",
    description: "Geographic sourcing data",
  },
  {
    to: "/saved-searches",
    icon: BookmarkCheck,
    label: "Saved Searches",
    description: "Your saved filters",
  },
  {
    to: "/custom-alerts",
    icon: Zap,
    label: "Alert Rules",
    description: "Custom alert formulas",
  },
];

const MARKET_INTEL_ITEMS: NavItem[] = [
  {
    to: "/market-saturation",
    icon: Signal,
    label: "Market Saturation",
    description: "Listing volume & leverage",
  },
  {
    to: "/cross-market",
    icon: Globe,
    label: "Cross-Market",
    description: "Price by source comparison",
  },
  {
    to: "/seasonal-pricing",
    icon: CalendarDays,
    label: "Seasonal Pricing",
    description: "Best months to buy",
  },
  {
    to: "/market-intel/price-velocity",
    icon: TrendingDown,
    label: "Price Velocity",
    description: "How fast prices are moving",
  },
  {
    to: "/market-intel/supply-shock",
    icon: Zap,
    label: "Supply Shock",
    description: "Inventory spike & drop alerts",
  },
  {
    to: "/market-intel/regional-arbitrage",
    icon: MapPin,
    label: "Regional Arbitrage",
    description: "Same car, cheaper elsewhere",
  },
];

const BUYER_TOOLS_ITEMS: NavItem[] = [
  {
    to: "/negotiation-coach",
    icon: MessageSquare,
    label: "Negotiation Coach",
    description: "Step-by-step dealer scripts",
  },
  {
    to: "/should-i-wait",
    icon: Clock,
    label: "Should I Wait?",
    description: "Seasonal price signal",
  },
  {
    to: "/tco-timeline",
    icon: LineChart,
    label: "TCO Timeline",
    description: "5-year ownership cost",
  },
  {
    to: "/trim-analyzer",
    icon: BarChart2,
    label: "Trim Analyzer",
    description: "Is the upgrade worth it?",
  },
  {
    to: "/deal-expiry",
    icon: Timer,
    label: "Deal Expiry",
    description: "How long before it's gone",
  },
  {
    to: "/buyer/dealer-motivation",
    icon: Target,
    label: "Dealer Motivation",
    description: "How motivated is the dealer?",
  },
  {
    to: "/buyer/walk-away-price",
    icon: DollarSign,
    label: "Walk-Away Price",
    description: "Know exactly when to walk",
  },
  {
    to: "/buyer/seller-urgency",
    icon: Flame,
    label: "Seller Urgency",
    description: "Detect motivated sellers",
  },
];

const DEALER_TOOLS_ITEMS: NavItem[] = [
  {
    to: "/dealer/pricing-radar",
    icon: Radar,
    label: "Pricing Radar",
    description: "Real-time price comparison",
  },
  {
    to: "/dealer/lot-tracker",
    icon: Clock,
    label: "Lot Tracker",
    description: "Days-on-lot insights",
  },
  {
    to: "/dealer/demand-heatmap",
    icon: Flame,
    label: "Demand Heatmap",
    description: "Search demand by region",
  },
  {
    to: "/dealer/turnover",
    icon: RefreshCw,
    label: "Turnover Report",
    description: "Inventory sales speed",
  },
  {
    to: "/dealer/price-elasticity",
    icon: TrendingDown,
    label: "Price Elasticity",
    description: "Value retention by trim",
  },
  {
    to: "/dealer/marketplace",
    icon: Building2,
    label: "My Listings",
    description: "Manage marketplace listings",
  },
  {
    to: "/dealer/profile",
    icon: Building2,
    label: "My Profile",
    description: "Your dealer storefront",
  },
  {
    to: "/dealer/inventory-import",
    icon: Upload,
    label: "Bulk Import",
    description: "Import inventory via CSV",
  },
];

const MARKETPLACE_ITEMS = [
  {
    to: "/marketplace",
    icon: Building2,
    label: "Browse Marketplace",
    description: "Search all dealer listings",
  },
];

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
  item,
  ocid,
  accent = false,
}: {
  item: NavItem;
  ocid: string;
  accent?: boolean;
}) {
  const navigate = useNavigate();
  const Icon = item.icon;

  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={() => navigate({ to: item.to })}
      className={`group w-full text-left flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 ${
        accent
          ? "border-amber/20 bg-amber/3 hover:bg-amber/10 hover:border-amber/40 dark:bg-amber/5"
          : "border-steel-border bg-background hover:bg-surface hover:border-amber/30 dark:hover:border-amber/30"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          accent
            ? "bg-amber/15 group-hover:bg-amber/25"
            : "bg-surface border border-steel-border/60 group-hover:bg-amber/10 group-hover:border-amber/20 dark:bg-background"
        }`}
      >
        <Icon
          className={`w-4 h-4 transition-colors ${
            accent ? "text-amber" : "text-muted-text group-hover:text-amber"
          }`}
        />
      </div>
      <div className="min-w-0">
        <div
          className={`text-xs font-semibold leading-tight transition-colors ${
            accent ? "text-amber" : "text-foreground group-hover:text-amber"
          }`}
        >
          {item.label}
        </div>
        {item.description && (
          <div className="text-[10px] text-muted-text mt-0.5 leading-tight line-clamp-2">
            {item.description}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  amber = false,
}: {
  icon?: React.ElementType;
  label: string;
  amber?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 mb-2 ${amber ? "text-amber" : "text-muted-text"}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

// ─── Quick Access Grid ────────────────────────────────────────────────────────

export default function QuickAccessGrid() {
  const role = useAppRoleContext();

  const showBuyerTools = role === "buyer" || role === "admin";
  const showDealerTools = role === "dealer" || role === "admin";

  return (
    <section
      className="mt-8 mb-2"
      aria-label="All Features"
      data-ocid="quick_access.section"
    >
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="w-4 h-4 text-amber shrink-0" />
        <h2 className="text-sm font-bold text-foreground tracking-tight">
          All Features
        </h2>
        <div className="flex-1 h-px bg-steel-border ml-1" />
      </div>

      <div className="space-y-5">
        {/* Core */}
        <div>
          <SectionHeader label="Core" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2">
            {CORE_ITEMS.map((item, i) => (
              <FeatureCard
                key={item.to}
                item={item}
                ocid={`quick_access.core.card.${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* More Tools */}
        <div>
          <SectionHeader label="More Tools" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-2">
            {MORE_ITEMS.map((item, i) => (
              <FeatureCard
                key={item.to}
                item={item}
                ocid={`quick_access.more.card.${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Market Intel */}
        <div>
          <SectionHeader icon={Signal} label="Market Intel" amber />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {MARKET_INTEL_ITEMS.map((item, i) => (
              <FeatureCard
                key={item.to}
                item={item}
                accent
                ocid={`quick_access.market_intel.card.${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Buyer Tools (role-gated) */}
        {showBuyerTools && (
          <div>
            <SectionHeader icon={Zap} label="Buyer Tools" amber />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {BUYER_TOOLS_ITEMS.map((item, i) => (
                <FeatureCard
                  key={item.to}
                  item={item}
                  accent
                  ocid={`quick_access.buyer_tools.card.${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Marketplace */}
        <div>
          <SectionHeader icon={Building2} label="Marketplace" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {MARKETPLACE_ITEMS.map((item, i) => (
              <FeatureCard
                key={item.to}
                item={item}
                ocid={`quick_access.marketplace.card.${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Dealer Tools (role-gated) */}
        {showDealerTools && (
          <div>
            <SectionHeader icon={Building2} label="Dealer Tools" amber />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {DEALER_TOOLS_ITEMS.map((item, i) => (
                <FeatureCard
                  key={item.to}
                  item={item}
                  accent
                  ocid={`quick_access.dealer_tools.card.${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
