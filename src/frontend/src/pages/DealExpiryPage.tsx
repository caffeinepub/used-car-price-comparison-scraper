import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Info,
  Loader2,
  MessageSquare,
  Search,
  Timer,
  Zap,
} from "lucide-react";
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { useGetDealExpiryPrediction } from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urgencyConfig(urgency: string, days: number) {
  if (days < 3 || urgency === "Critical" || urgency === "High") {
    return {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10 border-red-500/30",
      bannerBg: "bg-red-500/10 border-red-500/40",
      dot: "bg-red-500",
      label: "Act Immediately",
      icon: AlertTriangle,
    };
  }
  if (days <= 7 || urgency === "Medium") {
    return {
      color: "text-amber",
      bg: "bg-amber/10 border-amber/30",
      bannerBg: "bg-amber/10 border-amber/40",
      dot: "bg-amber",
      label: "Act Soon",
      icon: Zap,
    };
  }
  return {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    bannerBg: "bg-emerald-500/10 border-emerald-500/40",
    dot: "bg-emerald-500",
    label: "Good Window",
    icon: CheckCircle,
  };
}

function getFactors(urgency: string, days: number): string[] {
  if (days < 3 || urgency === "Critical" || urgency === "High") {
    return [
      "This listing is priced well below market average — high buyer interest expected",
      "Similar deals in this segment typically sell within 2–4 days",
      "Price drop history suggests seller is motivated to close quickly",
      "High-demand model in current market conditions",
    ];
  }
  if (days <= 7 || urgency === "Medium") {
    return [
      "Listing has been active for a moderate period — interest is building",
      "Good deal score is attracting multiple potential buyers",
      "Weekend showings could accelerate the timeline",
    ];
  }
  return [
    "Listing has been available for a while — limited competing interest",
    "You have time to do proper due diligence before making an offer",
    "Consider using this window to compare similar listings",
  ];
}

// ─── Urgency Banner ───────────────────────────────────────────────────────────

function UrgencyBanner({ days, urgency }: { days: number; urgency: string }) {
  const cfg = urgencyConfig(urgency, days);
  const Icon = cfg.icon;

  return (
    <Card className={`border-2 ${cfg.bannerBg}`} data-ocid="expiry.card">
      <CardContent className="p-8 text-center">
        <Icon className={`w-10 h-10 mx-auto mb-4 ${cfg.color}`} />
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          {cfg.label}
        </div>
        <div className={`text-7xl font-bold font-display ${cfg.color} mb-2`}>
          {days}
        </div>
        <div className="text-lg font-semibold text-foreground">
          Day{days !== 1 ? "s" : ""} Remaining
        </div>
        <div
          className={`inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
          {urgency} Urgency
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealExpiryPage() {
  const [listingId, setListingId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: prediction, isLoading } = useGetDealExpiryPrediction(
    submittedId,
    !!submittedId,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = listingId.trim();
    if (!id) return;
    setSubmittedId(id);
    setSearched(true);
  };

  const days = prediction ? Number(prediction.estimatedDaysRemaining) : null;
  const urgency = prediction?.urgency ?? "";
  const factors = days !== null ? getFactors(urgency, days) : [];

  return (
    <div className="max-w-screen-md mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Deal Expiry Prediction"
        description="Estimate how many days before a good deal gets snatched up — so you know when to act."
        icon={<Timer className="w-6 h-6" />}
      />

      {/* Search Form */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Enter Listing ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                placeholder="e.g. listing-001"
                data-ocid="expiry.input"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={!listingId.trim() || isLoading}
              data-ocid="expiry.primary_button"
              className="bg-amber hover:bg-amber/90 text-zinc-900 font-bold px-5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-1.5" />
                  Predict
                </>
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1.5">
            <Info className="w-3 h-3 shrink-0" />
            Find listing IDs on your Dashboard. Example:{" "}
            <code className="bg-background border border-steel-border px-1 rounded text-xs">
              listing-001
            </code>
          </p>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4" data-ocid="expiry.loading_state">
          <Skeleton className="h-52 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* Not Found State */}
      {!isLoading && searched && submittedId && prediction === null && (
        <Card
          className="bg-surface border-steel-border border-dashed"
          data-ocid="expiry.empty_state"
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className="p-4 rounded-full bg-amber/10 border border-amber/20 w-fit mx-auto">
              <Search className="w-8 h-8 text-amber/60" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground font-display uppercase">
                No Prediction Available
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
                No deal expiry data found for listing ID{" "}
                <strong className="text-foreground">"{submittedId}"</strong>.
                Make sure the listing exists in your dashboard.
              </p>
            </div>
            <div className="bg-background border border-steel-border rounded-lg p-3 text-left max-w-xs mx-auto">
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                Try a valid listing ID:
              </p>
              <div className="flex gap-2 flex-wrap">
                {["listing-001", "listing-002", "listing-003"].map((id) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => {
                      setListingId(id);
                      setSubmittedId(id);
                    }}
                    className="px-2.5 py-1 rounded-md border border-steel-border text-xs text-muted-foreground hover:text-foreground hover:border-amber/30 transition-colors"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Results */}
      {!isLoading && prediction && days !== null && (
        <>
          <UrgencyBanner days={days} urgency={urgency} />

          {/* Why this deal may expire */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold font-display uppercase tracking-wider text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber" />
                Why This Deal May Expire Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {factors.map((factor, i) => (
                <div
                  key={factor}
                  data-ocid={`expiry.item.${i + 1}`}
                  className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-background border border-steel-border"
                >
                  <div className="w-5 h-5 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-amber text-xs font-bold font-display">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {factor}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Historical Context */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
                Historical Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Good Deals",
                    time: "4–8 days",
                    note: "Avg. time to sell",
                  },
                  {
                    label: "Fair Priced",
                    time: "14–21 days",
                    note: "Avg. time to sell",
                  },
                  {
                    label: "Overpriced",
                    time: "45–90 days",
                    note: "Avg. time to sell or reduce",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-background border border-steel-border rounded-lg p-3 text-center"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {stat.label}
                    </div>
                    <div className="text-lg font-bold text-foreground font-display">
                      {stat.time}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.note}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Based on typical used car market patterns. Actual times vary by
                make, model, region, and seasonal demand.
              </p>
            </CardContent>
          </Card>

          {/* Action CTAs */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-ocid="expiry.section"
          >
            <Button
              asChild
              className="bg-amber hover:bg-amber/90 text-zinc-900 font-bold h-12"
              data-ocid="expiry.primary_button"
            >
              <Link to="/negotiation-coach">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Negotiating
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-steel-border hover:border-amber/40 text-foreground h-12"
              data-ocid="expiry.secondary_button"
              onClick={() => {
                if (prediction?.listingId) {
                  window.open(`#listing-${prediction.listingId}`, "_blank");
                }
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              View on Dashboard
            </Button>
          </div>
        </>
      )}

      {/* Pre-search state */}
      {!searched && !isLoading && (
        <div
          className="flex flex-col items-center justify-center py-16 gap-4 text-center"
          data-ocid="expiry.empty_state"
        >
          <div className="p-4 rounded-full bg-amber/10 border border-amber/20">
            <Timer className="w-8 h-8 text-amber/70" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground font-display uppercase">
              Enter a Listing ID to Predict Expiry
            </p>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              We'll estimate how many days before this listing is likely to
              sell, so you know when to pull the trigger.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              &lt;3 days: Act immediately
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber" />
              3–7 days: Act soon
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              7+ days: Good window
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
