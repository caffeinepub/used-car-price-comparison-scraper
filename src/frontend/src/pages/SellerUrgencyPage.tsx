import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Plus, TrendingDown, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SellerListing {
  id: string;
  make: string;
  model: string;
  year: number;
  originalPrice: number;
  currentPrice: number;
  dateFirstListed: string; // ISO date string
  dropCount: number;
}

interface ScoredListing extends SellerListing {
  daysOnMarket: number;
  totalDropPct: number;
  urgencyScore: number;
  tier: UrgencyTier;
  recommendedOffer: number;
}

type UrgencyTier = "Cold" | "Warm" | "Hot" | "Burning";

// ─── Scoring Logic ─────────────────────────────────────────────────────────────

function computeUrgencyScore(
  daysOnMarket: number,
  totalDropPct: number,
  dropCount: number,
): number {
  // Days Factor (0–30)
  let daysFactor = 0;
  if (daysOnMarket >= 60) daysFactor = 30;
  else if (daysOnMarket >= 30) daysFactor = 22;
  else if (daysOnMarket >= 14) daysFactor = 15;
  else if (daysOnMarket >= 7) daysFactor = 8;
  else daysFactor = 3;

  // Drop % Factor (0–40)
  let dropPctFactor = 0;
  if (totalDropPct >= 11) dropPctFactor = 40;
  else if (totalDropPct >= 6) dropPctFactor = 28;
  else if (totalDropPct >= 3) dropPctFactor = 16;
  else if (totalDropPct >= 1) dropPctFactor = 8;
  else dropPctFactor = 0;

  // Drop Count Factor (0–30)
  let dropCountFactor = 0;
  if (dropCount >= 3) dropCountFactor = 30;
  else if (dropCount === 2) dropCountFactor = 18;
  else if (dropCount === 1) dropCountFactor = 10;
  else dropCountFactor = 0;

  return Math.min(daysFactor + dropPctFactor + dropCountFactor, 100);
}

function getTier(score: number): UrgencyTier {
  if (score >= 75) return "Burning";
  if (score >= 50) return "Hot";
  if (score >= 25) return "Warm";
  return "Cold";
}

function getTierConfig(tier: UrgencyTier): {
  color: string;
  bg: string;
  border: string;
  dot: string;
  animate: boolean;
} {
  switch (tier) {
    case "Burning":
      return {
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/40",
        dot: "bg-red-400",
        animate: true,
      };
    case "Hot":
      return {
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        dot: "bg-orange-400",
        animate: false,
      };
    case "Warm":
      return {
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        dot: "bg-amber-400",
        animate: false,
      };
    default:
      return {
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        dot: "bg-blue-400",
        animate: false,
      };
  }
}

function computeRecommendedOffer(
  currentPrice: number,
  totalDropPct: number,
): number {
  const additionalDiscount = Math.min(totalDropPct, 15) / 100;
  return Math.round((currentPrice * (1 - additionalDiscount)) / 100) * 100;
}

function scoreListings(listings: SellerListing[]): ScoredListing[] {
  const today = new Date();
  return listings.map((l) => {
    const firstListed = new Date(l.dateFirstListed);
    const daysOnMarket = Math.max(
      0,
      Math.floor(
        (today.getTime() - firstListed.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const totalDropPct =
      l.originalPrice > 0
        ? ((l.originalPrice - l.currentPrice) / l.originalPrice) * 100
        : 0;
    const urgencyScore = computeUrgencyScore(
      daysOnMarket,
      totalDropPct,
      l.dropCount,
    );
    const tier = getTier(urgencyScore);
    const recommendedOffer = computeRecommendedOffer(
      l.currentPrice,
      totalDropPct,
    );
    return {
      ...l,
      daysOnMarket,
      totalDropPct,
      urgencyScore,
      tier,
      recommendedOffer,
    };
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

let idCounter = 0;
function genId() {
  return `listing-${++idCounter}-${Date.now()}`;
}

// ─── Listing Row Card ─────────────────────────────────────────────────────────

function ListingCard({
  listing,
  index,
  onRemove,
}: {
  listing: ScoredListing;
  index: number;
  onRemove: () => void;
}) {
  const cfg = getTierConfig(listing.tier);

  return (
    <Card
      className={`border ${cfg.border} ${cfg.bg} relative overflow-hidden`}
      data-ocid={`seller_urgency.item.${index + 1}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          {/* Vehicle Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-foreground text-sm">
                {listing.year} {listing.make} {listing.model}
              </span>
              <Badge
                className={`${cfg.bg} ${cfg.border} ${cfg.color} border text-xs font-bold flex items-center gap-1`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.animate ? "animate-pulse" : ""}`}
                />
                {listing.tier}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                <span className="text-foreground font-medium">
                  {listing.daysOnMarket}
                </span>{" "}
                days on market
              </span>
              <span>
                <span
                  className={`font-medium ${listing.totalDropPct > 5 ? "text-red-400" : listing.totalDropPct > 0 ? "text-amber-400" : "text-muted-foreground"}`}
                >
                  {listing.totalDropPct.toFixed(1)}%
                </span>{" "}
                total drop
              </span>
              <span>
                <span className="text-foreground font-medium">
                  {listing.dropCount}
                </span>{" "}
                price reduction{listing.dropCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Score + Remove */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Score circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full border-2 ${cfg.border} ${cfg.bg} flex items-center justify-center`}
              >
                <span className={`text-sm font-bold font-display ${cfg.color}`}>
                  {listing.urgencyScore}
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">
                score
              </span>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={onRemove}
              data-ocid={`seller_urgency.delete_button.${index + 1}`}
              className="w-7 h-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0"
              aria-label={`Remove ${listing.year} ${listing.make} ${listing.model}`}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Price Row */}
        <div className="mt-3 pt-3 border-t border-current border-opacity-10 grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground mb-0.5">Current Ask</div>
            <div className="font-bold text-foreground">
              {fmtCurrency(listing.currentPrice)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">Was</div>
            <div className="font-bold text-zinc-400 line-through">
              {fmtCurrency(listing.originalPrice)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">Offer</div>
            <div className={`font-bold ${cfg.color}`}>
              {fmtCurrency(listing.recommendedOffer)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Add Listing Form ─────────────────────────────────────────────────────────

interface FormState {
  make: string;
  model: string;
  year: string;
  originalPrice: string;
  currentPrice: string;
  dateFirstListed: string;
  dropCount: string;
}

const defaultForm: FormState = {
  make: "",
  model: "",
  year: "",
  originalPrice: "",
  currentPrice: "",
  dateFirstListed: "",
  dropCount: "0",
};

function AddListingForm({ onAdd }: { onAdd: (l: SellerListing) => void }) {
  const [form, setForm] = useState<FormState>(defaultForm);

  const set =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const isValid =
    form.make.trim() &&
    form.model.trim() &&
    Number(form.year) >= 1900 &&
    Number(form.originalPrice) > 0 &&
    Number(form.currentPrice) > 0 &&
    form.dateFirstListed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onAdd({
      id: genId(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      originalPrice: Number(form.originalPrice),
      currentPrice: Number(form.currentPrice),
      dateFirstListed: form.dateFirstListed,
      dropCount: Math.max(0, Number(form.dropCount)),
    });

    toast.success(`${form.year} ${form.make} ${form.model} added!`);
    setForm(defaultForm);
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors";
  const priceInputClass =
    "w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors";

  return (
    <Card className="bg-surface border-steel-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Add a Listing to Analyze
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Make / Model / Year */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="su-make"
                className="text-xs text-muted-foreground"
              >
                Make
              </label>
              <input
                id="su-make"
                type="text"
                value={form.make}
                onChange={set("make")}
                placeholder="Toyota"
                data-ocid="seller_urgency.make.input"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="su-model"
                className="text-xs text-muted-foreground"
              >
                Model
              </label>
              <input
                id="su-model"
                type="text"
                value={form.model}
                onChange={set("model")}
                placeholder="Camry"
                data-ocid="seller_urgency.model.input"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="su-year"
                className="text-xs text-muted-foreground"
              >
                Year
              </label>
              <input
                id="su-year"
                type="number"
                value={form.year}
                onChange={set("year")}
                placeholder="2020"
                min={1900}
                max={new Date().getFullYear() + 1}
                data-ocid="seller_urgency.year.input"
                className={inputClass}
              />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="su-orig"
                className="text-xs text-muted-foreground"
              >
                Original Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                  $
                </span>
                <input
                  id="su-orig"
                  type="number"
                  value={form.originalPrice}
                  onChange={set("originalPrice")}
                  placeholder="30000"
                  min={0}
                  data-ocid="seller_urgency.original_price.input"
                  className={priceInputClass}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="su-curr"
                className="text-xs text-muted-foreground"
              >
                Current Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                  $
                </span>
                <input
                  id="su-curr"
                  type="number"
                  value={form.currentPrice}
                  onChange={set("currentPrice")}
                  placeholder="27500"
                  min={0}
                  data-ocid="seller_urgency.current_price.input"
                  className={priceInputClass}
                />
              </div>
            </div>
          </div>

          {/* Date + Drop Count */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="su-date"
                className="text-xs text-muted-foreground"
              >
                Date First Listed
              </label>
              <input
                id="su-date"
                type="date"
                value={form.dateFirstListed}
                onChange={set("dateFirstListed")}
                max={new Date().toISOString().split("T")[0]}
                data-ocid="seller_urgency.date.input"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="su-drops"
                className="text-xs text-muted-foreground"
              >
                # Price Drops
              </label>
              <input
                id="su-drops"
                type="number"
                value={form.dropCount}
                onChange={set("dropCount")}
                min={0}
                max={10}
                data-ocid="seller_urgency.drop_count.input"
                className={inputClass}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isValid}
            data-ocid="seller_urgency.add_button"
            className="w-full bg-amber hover:bg-amber/90 text-zinc-900 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Analyze Listing
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SellerUrgencyPage() {
  const [listings, setListings] = useState<SellerListing[]>([]);

  const scored = scoreListings(listings);

  // Sort by urgency score descending
  const sorted = [...scored].sort((a, b) => b.urgencyScore - a.urgencyScore);

  const handleAdd = (listing: SellerListing) => {
    setListings((prev) => [...prev, listing]);
  };

  const handleRemove = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    toast.success("Listing removed");
  };

  const burningCount = sorted.filter((l) => l.tier === "Burning").length;
  const hotCount = sorted.filter((l) => l.tier === "Hot").length;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="Seller Urgency Detector"
        description="Add listings to detect how motivated each seller is — sorted by urgency from Burning to Cold."
        icon={<Flame className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Add Form + Tier Guide ── */}
        <div className="lg:col-span-1 space-y-5">
          <AddListingForm onAdd={handleAdd} />

          {/* Tier guide */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Urgency Tiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(
                [
                  {
                    tier: "Cold",
                    range: "0–24",
                    color: "text-blue-400",
                    bg: "bg-blue-500/10 border-blue-500/20",
                    desc: "No rush. Research more.",
                  },
                  {
                    tier: "Warm",
                    range: "25–49",
                    color: "text-amber-400",
                    bg: "bg-amber-500/10 border-amber-500/20",
                    desc: "Some motivation. Negotiate.",
                  },
                  {
                    tier: "Hot",
                    range: "50–74",
                    color: "text-orange-400",
                    bg: "bg-orange-500/10 border-orange-500/20",
                    desc: "Motivated seller. Push hard.",
                  },
                  {
                    tier: "Burning",
                    range: "75–100",
                    color: "text-red-400",
                    bg: "bg-red-500/10 border-red-500/20",
                    desc: "Desperate to sell. Max leverage.",
                  },
                ] as const
              ).map((t) => (
                <div
                  key={t.tier}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border ${t.bg}`}
                >
                  <div>
                    <span className={`text-xs font-bold ${t.color}`}>
                      {t.tier}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t.desc}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t.range}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Scoring explanation */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                How It's Scored
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Days on Market</span>
                <span className="text-foreground font-medium">0–30 pts</span>
              </div>
              <div className="flex justify-between">
                <span>Total Price Drop %</span>
                <span className="text-foreground font-medium">0–40 pts</span>
              </div>
              <div className="flex justify-between">
                <span>Number of Price Cuts</span>
                <span className="text-foreground font-medium">0–30 pts</span>
              </div>
              <div className="pt-2 border-t border-steel-border flex justify-between font-medium">
                <span className="text-foreground">Total Score</span>
                <span className="text-amber-400">0–100</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Listing Results ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary stats (when listings exist) */}
          {sorted.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-surface border-steel-border">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold font-display text-foreground">
                    {sorted.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Listings analyzed
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold font-display text-red-400">
                    {burningCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Burning</div>
                </CardContent>
              </Card>
              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold font-display text-orange-400">
                    {hotCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Hot</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Listings */}
          {sorted.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Sorted by Urgency
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Highest urgency first
                </span>
              </div>
              {sorted.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  onRemove={() => handleRemove(listing.id)}
                />
              ))}
            </div>
          ) : (
            /* Empty state */
            <Card
              className="bg-surface border-steel-border border-dashed"
              data-ocid="seller_urgency.empty_state"
            >
              <CardContent className="p-12 text-center space-y-4">
                <div className="p-4 rounded-full bg-amber/10 border border-amber/20 w-fit mx-auto">
                  <Flame className="w-8 h-8 text-amber/60" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-display uppercase">
                    No Listings Yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
                    Add a listing using the form to detect seller urgency and
                    get a recommended opening offer.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span>Burning = seller is desperate, max leverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span>Hot = strong negotiation position</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Warm = some room to negotiate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Cold = take your time</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
