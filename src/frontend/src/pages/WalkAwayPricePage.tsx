import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  DollarSign,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type NegStyle = "conservative" | "balanced" | "aggressive";

const STYLE_CONFIG: Record<
  NegStyle,
  { openingDiscount: number; label: string; color: string; bg: string }
> = {
  conservative: {
    openingDiscount: 3,
    label: "Conservative",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  balanced: {
    openingDiscount: 6,
    label: "Balanced",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  aggressive: {
    openingDiscount: 10,
    label: "Aggressive",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  },
};

function computePrices(
  listedPrice: number,
  marketPrice: number | null,
  targetDiscountPct: number,
  style: NegStyle,
  maxBudget: number | null,
) {
  const effectiveMarket = marketPrice && marketPrice > 0 ? marketPrice : null;
  const openingPct = STYLE_CONFIG[style].openingDiscount;

  const openingOffer =
    Math.round((listedPrice * (1 - openingPct / 100)) / 100) * 100;
  const targetPrice =
    Math.round((listedPrice * (1 - targetDiscountPct / 100)) / 100) * 100;

  // Walk-away: if market price given, use market * 1.05; else listed * (1 - targetDiscount% - 2%)
  let walkAway: number;
  if (effectiveMarket) {
    walkAway = Math.round((effectiveMarket * 1.05) / 100) * 100;
  } else {
    walkAway =
      Math.round((listedPrice * (1 - (targetDiscountPct + 2) / 100)) / 100) *
      100;
  }

  // Apply max budget ceiling
  if (maxBudget && maxBudget > 0) {
    walkAway = Math.min(walkAway, maxBudget);
  }

  return { openingOffer, targetPrice, walkAway, effectiveMarket };
}

// ─── Price Position Gauge ──────────────────────────────────────────────────────

function PriceGauge({
  listedPrice,
  marketPrice,
  targetPrice,
  walkAway,
  openingOffer,
}: {
  listedPrice: number;
  marketPrice: number | null;
  targetPrice: number;
  walkAway: number;
  openingOffer: number;
}) {
  const allPrices = [openingOffer, walkAway, targetPrice, listedPrice];
  if (marketPrice) allPrices.push(marketPrice);

  const minPrice = Math.min(...allPrices) * 0.97;
  const maxPrice = Math.max(...allPrices) * 1.03;
  const range = maxPrice - minPrice;

  const pct = (val: number) => ((val - minPrice) / range) * 100;

  const markers = [
    {
      label: "Opening",
      price: openingOffer,
      color: "bg-emerald-400",
      textColor: "text-emerald-400",
    },
    {
      label: "Walk-Away",
      price: walkAway,
      color: "bg-red-400",
      textColor: "text-red-400",
    },
    {
      label: "Target",
      price: targetPrice,
      color: "bg-amber-400",
      textColor: "text-amber-400",
    },
    ...(marketPrice
      ? [
          {
            label: "Market Avg",
            price: marketPrice,
            color: "bg-blue-400",
            textColor: "text-blue-400",
          },
        ]
      : []),
    {
      label: "Listed",
      price: listedPrice,
      color: "bg-zinc-400",
      textColor: "text-zinc-400",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Gauge bar */}
      <div className="relative h-8">
        {/* Background zones */}
        <div className="absolute inset-y-0 left-0 right-0 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-emerald-500/15" />
          <div className="flex-1 bg-amber-500/10" />
          <div className="flex-1 bg-red-500/15" />
        </div>

        {/* Markers */}
        {markers.map((m) => (
          <div
            key={m.label}
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: `${pct(m.price)}%`, transform: "translateX(-50%)" }}
          >
            <div className={`w-1 h-6 rounded-full ${m.color}`} />
          </div>
        ))}

        {/* Zone labels */}
        <div className="absolute inset-0 flex items-center">
          <div className="flex-1 text-center">
            <span className="text-[10px] text-emerald-400/70 font-medium">
              Below Market
            </span>
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] text-amber-400/70 font-medium">
              Near Market
            </span>
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] text-red-400/70 font-medium">
              Above Market
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {markers.map((m) => (
          <div key={m.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${m.color}`} />
            <span className={`text-xs font-medium ${m.textColor}`}>
              {m.label}: {fmtCurrency(m.price)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const DEFAULT_WAP = {
  listedPrice: 28000,
  marketPriceInput: "",
  targetDiscount: 8,
  style: "balanced" as NegStyle,
  maxBudgetInput: "",
};

export default function WalkAwayPricePage() {
  // Raw string inputs so backspace clears to empty (not reverts to min)
  const [listedPriceRaw, setListedPriceRaw] = useState<string>("28000");
  const [marketPriceInput, setMarketPriceInput] = useState<string>("");
  const [targetDiscount, setTargetDiscount] = useState<number>(8);
  const [style, setStyle] = useState<NegStyle>("balanced");
  const [maxBudgetInput, setMaxBudgetInput] = useState<string>("");

  // Committed values used for calculation
  const [committedListedPrice, setCommittedListedPrice] =
    useState<number>(28000);
  const [committedMarketPrice, setCommittedMarketPrice] = useState<
    number | null
  >(null);
  const [committedMaxBudget, setCommittedMaxBudget] = useState<number | null>(
    null,
  );
  const [committedDiscount, setCommittedDiscount] = useState<number>(8);
  const [committedStyle, setCommittedStyle] = useState<NegStyle>("balanced");
  const listedPrice = committedListedPrice;
  const marketPrice = committedMarketPrice;
  const maxBudget = committedMaxBudget;

  const handleCalculate = () => {
    const lp = listedPriceRaw === "" ? 0 : Math.max(0, Number(listedPriceRaw));
    const mp = marketPriceInput ? Number(marketPriceInput) : null;
    const mb = maxBudgetInput ? Number(maxBudgetInput) : null;
    setCommittedListedPrice(lp);
    setCommittedMarketPrice(mp);
    setCommittedMaxBudget(mb);
    setCommittedDiscount(targetDiscount);
    setCommittedStyle(style);
  };

  const handleClear = () => {
    setListedPriceRaw("28000");
    setMarketPriceInput("");
    setMaxBudgetInput("");
    setTargetDiscount(DEFAULT_WAP.targetDiscount);
    setStyle(DEFAULT_WAP.style);
    setCommittedListedPrice(DEFAULT_WAP.listedPrice);
    setCommittedMarketPrice(null);
    setCommittedMaxBudget(null);
    setCommittedDiscount(DEFAULT_WAP.targetDiscount);
    setCommittedStyle(DEFAULT_WAP.style);
  };

  const { openingOffer, targetPrice, walkAway, effectiveMarket } = useMemo(
    () =>
      computePrices(
        listedPrice,
        marketPrice,
        committedDiscount,
        committedStyle,
        maxBudget,
      ),
    [listedPrice, marketPrice, committedDiscount, committedStyle, maxBudget],
  );

  const styleConfig = STYLE_CONFIG[style];

  const aboveMarket =
    effectiveMarket && listedPrice > effectiveMarket
      ? ((listedPrice - effectiveMarket) / effectiveMarket) * 100
      : null;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="Walk-Away Price Calculator"
        description="Know exactly what price to offer, what to target, and the exact number where you walk away."
        icon={<DollarSign className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vehicle & Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Listed Price */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="wap-listed"
                  className="text-xs text-muted-foreground"
                >
                  Listed Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    id="wap-listed"
                    type="number"
                    value={listedPriceRaw}
                    onChange={(e) => setListedPriceRaw(e.target.value)}
                    placeholder="e.g. 28000"
                    min={0}
                    max={500000}
                    data-ocid="walk_away.listed_price.input"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>
              </div>

              {/* Market Price */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="wap-market"
                  className="text-xs text-muted-foreground"
                >
                  Avg Market Price{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    id="wap-market"
                    type="number"
                    value={marketPriceInput}
                    onChange={(e) => setMarketPriceInput(e.target.value)}
                    placeholder="e.g. 26000"
                    min={0}
                    data-ocid="walk_away.market_price.input"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>
              </div>

              {/* Max Budget */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="wap-budget"
                  className="text-xs text-muted-foreground"
                >
                  Max Budget{" "}
                  <span className="text-muted-foreground/60">
                    (hard ceiling)
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    id="wap-budget"
                    type="number"
                    value={maxBudgetInput}
                    onChange={(e) => setMaxBudgetInput(e.target.value)}
                    placeholder="e.g. 27000"
                    min={0}
                    data-ocid="walk_away.max_budget.input"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Negotiation Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Negotiation Style */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Negotiation Style
                </Label>
                <Select
                  value={style}
                  onValueChange={(v) => setStyle(v as NegStyle)}
                >
                  <SelectTrigger
                    data-ocid="walk_away.style.select"
                    className="bg-background border-steel-border focus:ring-amber/30 text-foreground"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">
                      Conservative (3% below asking)
                    </SelectItem>
                    <SelectItem value="balanced">
                      Balanced (6% below asking)
                    </SelectItem>
                    <SelectItem value="aggressive">
                      Aggressive (10% below asking)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className={`text-xs ${styleConfig.color}`}>
                  Opens {styleConfig.openingDiscount}% below listed price
                </p>
              </div>

              {/* Target Discount */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">
                    Target Discount
                  </Label>
                  <span className="text-xs font-bold text-foreground font-display">
                    {targetDiscount}%
                  </span>
                </div>
                <Slider
                  value={[targetDiscount]}
                  onValueChange={([v]) => setTargetDiscount(v)}
                  min={0}
                  max={25}
                  step={0.5}
                  aria-label="Target discount percentage"
                  data-ocid="walk_away.target_discount.toggle"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>25%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Calculate / Clear buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCalculate}
              data-ocid="walk_away.calculate.submit_button"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber text-black font-semibold text-sm hover:bg-amber/90 transition-colors"
            >
              <Calculator className="w-4 h-4" />
              Calculate
            </button>
            <button
              type="button"
              onClick={handleClear}
              data-ocid="walk_away.clear.button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-muted border border-steel-border text-muted-foreground font-semibold text-sm hover:bg-muted/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Market Position Alert */}
          {aboveMarket !== null && (
            <Card className="bg-red-500/5 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-foreground">
                    <span className="font-bold text-red-400">
                      {aboveMarket.toFixed(1)}% above market average
                    </span>{" "}
                    — this listing is overpriced. Your walk-away is adjusted to
                    market-fair territory.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Walk-Away Threshold — Main CTA */}
          <Card className="border-2 border-red-500/40 bg-red-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Do Not Pay More Than
                  </div>
                  <div className="text-4xl font-bold font-display text-red-400">
                    {fmtCurrency(walkAway)}
                  </div>
                  <Badge className="mt-2 bg-red-500/15 border-red-500/40 text-red-400 border">
                    Walk-Away Threshold
                  </Badge>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-muted-foreground">
                    If they won't go below this price
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Walk. Away.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Better deals exist
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-surface border-steel-border">
              <CardContent className="p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Opening Offer
                </div>
                <div className="text-2xl font-bold font-display text-emerald-400">
                  {fmtCurrency(openingOffer)}
                </div>
                <div className={`text-xs mt-1 ${styleConfig.color}`}>
                  {styleConfig.label} style
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {styleConfig.openingDiscount}% below asking
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-steel-border">
              <CardContent className="p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Target Price
                </div>
                <div className="text-2xl font-bold font-display text-amber-400">
                  {fmtCurrency(targetPrice)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {targetDiscount}% off listed
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Your ideal outcome
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-steel-border">
              <CardContent className="p-4 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Listed Price
                </div>
                <div className="text-2xl font-bold font-display text-zinc-400">
                  {fmtCurrency(listedPrice)}
                </div>
                {effectiveMarket && (
                  <>
                    <div className="text-xs text-muted-foreground mt-1">
                      Market: {fmtCurrency(effectiveMarket)}
                    </div>
                    <div
                      className={`text-xs mt-1 ${listedPrice <= effectiveMarket ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {listedPrice <= effectiveMarket
                        ? "Below market ✓"
                        : "Above market ↑"}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Price Position Gauge */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber" />
                Price Position Gauge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PriceGauge
                listedPrice={listedPrice}
                marketPrice={effectiveMarket}
                targetPrice={targetPrice}
                walkAway={walkAway}
                openingOffer={openingOffer}
              />
            </CardContent>
          </Card>

          {/* Summary Line */}
          <Card className="bg-amber/5 border-amber/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-bold text-amber">
                    Your opening offer is {fmtCurrency(openingOffer)}.
                  </span>{" "}
                  If they won't go below{" "}
                  <span className="font-bold text-red-400">
                    {fmtCurrency(walkAway)}
                  </span>
                  , walk away.{" "}
                  {effectiveMarket &&
                    `Market average is ${fmtCurrency(effectiveMarket)} — ${
                      listedPrice > effectiveMarket
                        ? "this car is priced above market, you have leverage."
                        : "this is a fair market price, negotiate politely."
                    }`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
