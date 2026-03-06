import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import { useGetAllListings } from "../hooks/useQueries";

// ─── Seasonal Baseline ────────────────────────────────────────────────────────
// Used when there's no real data for the selected make/model
const BASELINE_INDEX = [92, 90, 95, 100, 105, 108, 110, 108, 102, 98, 96, 93];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type ViewMode = "price" | "index";

interface MonthPoint {
  month: string;
  shortMonth: string;
  monthIndex: number;
  avgPrice: number | null;
  relativeIndex: number;
  count: number;
  isReal: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getMonthBgClass(relativeIndex: number): string {
  if (relativeIndex <= 93) return "bg-emerald-500/15 border-emerald-500/25";
  if (relativeIndex <= 97) return "bg-emerald-500/8 border-emerald-500/15";
  if (relativeIndex <= 103) return "bg-amber/8 border-amber/15";
  if (relativeIndex <= 107) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function getIndexTextClass(relativeIndex: number): string {
  if (relativeIndex <= 97) return "text-emerald-600 dark:text-emerald-400";
  if (relativeIndex <= 103) return "text-amber";
  return "text-red-500 dark:text-red-400";
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  viewMode,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  viewMode: ViewMode;
}) {
  if (!active || !payload?.length) return null;
  const d: MonthPoint = payload[0]?.payload;
  const diff = d.relativeIndex - 100;
  return (
    <div className="bg-popover border border-steel-border rounded-lg px-3 py-2.5 shadow-panel text-xs">
      <p className="font-bold text-foreground mb-1">{d.month}</p>
      {viewMode === "price" && d.avgPrice !== null ? (
        <p className="text-muted-foreground">
          Avg Price:{" "}
          <span className="font-bold text-foreground">
            {fmtCurrency(d.avgPrice)}
          </span>
        </p>
      ) : null}
      <p className="text-muted-foreground">
        Index:{" "}
        <span className="font-bold text-foreground">
          {d.relativeIndex.toFixed(1)}
        </span>
      </p>
      <p
        className={
          diff <= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-500 dark:text-red-400"
        }
      >
        {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`} vs. avg
      </p>
      {d.count > 0 && (
        <p className="text-muted-foreground mt-0.5">
          {d.count} listing{d.count !== 1 ? "s" : ""}
        </p>
      )}
      <p className="text-muted-foreground/60 italic mt-0.5">
        {d.isReal ? "Real data" : "General market estimate"}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SeasonalPricingPage() {
  const { data: allListings = [], isLoading } = useGetAllListings();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("index");

  const currentMonthIndex = new Date().getMonth(); // 0-based

  const activeListings = useMemo(
    () => allListings.filter((l: any) => !l.archived),
    [allListings],
  );

  const makes = useMemo(() => {
    const set = new Set<string>();
    for (const l of activeListings) if (l.make) set.add(l.make);
    return Array.from(set).sort();
  }, [activeListings]);

  const modelsForMake = useMemo(() => {
    const set = new Set<string>();
    for (const l of activeListings)
      if ((!make || l.make === make) && l.model) set.add(l.model);
    return Array.from(set).sort();
  }, [activeListings, make]);

  // Compute 12-month data points
  const monthPoints = useMemo<MonthPoint[]>(() => {
    const filtered = activeListings.filter(
      (l: any) => (!make || l.make === make) && (!model || l.model === model),
    );

    // Group prices by month
    const buckets: number[][] = Array.from({ length: 12 }, () => []);
    for (const l of filtered) {
      try {
        const ms = Number(l.timestamp) / 1_000_000;
        const monthIdx = new Date(ms).getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          buckets[monthIdx].push(Number(l.price));
        }
      } catch {
        // skip malformed timestamps
      }
    }

    const hasAnyData = buckets.some((b) => b.length > 0);

    // Compute avg prices per month
    const avgPrices: (number | null)[] = buckets.map((b) =>
      b.length > 0 ? b.reduce((s, v) => s + v, 0) / b.length : null,
    );

    // Compute overall avg for relative index
    const allPrices: number[] = filtered.map((l: any) => Number(l.price));
    const overallAvg =
      allPrices.length > 0
        ? allPrices.reduce((s, v) => s + v, 0) / allPrices.length
        : null;

    return MONTH_NAMES.map((name, i) => {
      let relativeIndex: number;

      if (hasAnyData && avgPrices[i] !== null && overallAvg && overallAvg > 0) {
        relativeIndex = (avgPrices[i]! / overallAvg) * 100;
      } else if (hasAnyData && avgPrices[i] === null) {
        // Missing month — use baseline
        relativeIndex = BASELINE_INDEX[i];
      } else {
        // No data at all — baseline
        relativeIndex = BASELINE_INDEX[i];
      }

      return {
        month: name,
        shortMonth: MONTH_SHORT[i],
        monthIndex: i,
        avgPrice: avgPrices[i],
        relativeIndex,
        count: buckets[i].length,
        isReal: buckets[i].length > 0,
      };
    });
  }, [activeListings, make, model]);

  const hasRealData = monthPoints.some((p) => p.isReal);

  const bestMonth = useMemo(
    () => [...monthPoints].sort((a, b) => a.relativeIndex - b.relativeIndex)[0],
    [monthPoints],
  );
  const worstMonth = useMemo(
    () => [...monthPoints].sort((a, b) => b.relativeIndex - a.relativeIndex)[0],
    [monthPoints],
  );

  // Top 2 cheapest and top 2 most expensive
  const sortedByIndex = useMemo(
    () => [...monthPoints].sort((a, b) => a.relativeIndex - b.relativeIndex),
    [monthPoints],
  );
  const cheapestMonths = sortedByIndex.slice(0, 2).map((p) => p.monthIndex);
  const expensiveMonths = sortedByIndex
    .slice(-2)
    .map((p) => p.monthIndex)
    .reverse();

  const chartData = monthPoints.map((p) => ({
    ...p,
    value:
      viewMode === "price" && p.avgPrice !== null
        ? p.avgPrice
        : p.relativeIndex,
  }));

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (isLoading) {
    return (
      <div
        className="max-w-screen-xl mx-auto px-4 py-8 space-y-4"
        data-ocid="seasonal_pricing.loading_state"
      >
        {["s1", "s2", "s3"].map((s) => (
          <div
            key={s}
            className="h-14 bg-surface border border-steel-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  const vehicleLabel =
    [make, model].filter(Boolean).join(" ") || "General Market";

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 py-8 space-y-8"
      data-ocid="seasonal_pricing.page"
    >
      {/* Header */}
      <PageHeader
        title="Seasonal Pricing Calendar"
        description="Historical chart showing the best months to buy each make/model. Prices follow predictable seasonal patterns — use this to time your purchase."
        icon={<CalendarDays className="w-6 h-6" />}
      />

      {/* Filter Form */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Vehicle (optional — shows general market by default)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAnalyze}
            className="flex flex-col sm:flex-row gap-3 items-end"
          >
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="seasonal-make"
                className="text-xs text-muted-foreground"
              >
                Make
              </label>
              <input
                id="seasonal-make"
                list="seasonal-makes-list"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Honda"
                data-ocid="seasonal_pricing.make.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
              <datalist id="seasonal-makes-list">
                {makes.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="seasonal-model"
                className="text-xs text-muted-foreground"
              >
                Model
              </label>
              <input
                id="seasonal-model"
                list="seasonal-models-list"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Accord"
                data-ocid="seasonal_pricing.model.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
              <datalist id="seasonal-models-list">
                {modelsForMake.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <button
              type="submit"
              data-ocid="seasonal_pricing.primary_button"
              className="px-6 py-2 rounded-lg bg-amber text-zinc-900 text-sm font-bold hover:bg-amber/90 transition-colors whitespace-nowrap"
            >
              Analyze
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Data Source Note */}
      {!hasRealData || !submitted ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber/5 border border-amber/20 text-xs text-amber">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          Showing general market seasonal trends. Add more listings from
          multiple months to see vehicle-specific pricing patterns.
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          Showing real pricing data for{" "}
          <span className="font-bold">{vehicleLabel}</span> from your listings.
          Months with no data fall back to market estimates.
        </div>
      )}

      {/* Best / Worst Month Hero Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <TrendingDown className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                Best Month to Buy
              </div>
              <h2 className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                {bestMonth.month}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Index{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {bestMonth.relativeIndex.toFixed(0)}
                </span>{" "}
                —{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {(100 - bestMonth.relativeIndex).toFixed(1)}%
                </span>{" "}
                below average
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-500/30 bg-red-500/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/20">
              <TrendingUp className="w-7 h-7 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                Most Expensive Month
              </div>
              <h2 className="text-xl font-bold font-display text-red-600 dark:text-red-400">
                {worstMonth.month}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Index{" "}
                <span className="font-bold text-red-600 dark:text-red-400">
                  {worstMonth.relativeIndex.toFixed(0)}
                </span>{" "}
                —{" "}
                <span className="font-bold text-red-600 dark:text-red-400">
                  +{(worstMonth.relativeIndex - 100).toFixed(1)}%
                </span>{" "}
                above average
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
                12-Month Pricing Trend — {vehicleLabel}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {viewMode === "index"
                  ? "100 = average. Below 100 = cheaper than average."
                  : "Average listing price per month."}
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-background rounded-lg border border-steel-border">
              <button
                type="button"
                onClick={() => setViewMode("index")}
                data-ocid="seasonal_pricing.index.toggle"
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "index"
                    ? "bg-amber/20 text-amber"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Index
              </button>
              <button
                type="button"
                onClick={() => setViewMode("price")}
                data-ocid="seasonal_pricing.price.toggle"
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "price"
                    ? "bg-amber/20 text-amber"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Price
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64" data-ocid="seasonal_pricing.chart_point">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 0, left: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortMonth"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) =>
                    viewMode === "price" ? `$${(v / 1000).toFixed(0)}k` : `${v}`
                  }
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
                {/* Average reference line (index mode only) */}
                {viewMode === "index" && (
                  <ReferenceLine
                    y={100}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 2"
                    strokeOpacity={0.5}
                  />
                )}
                {/* Current month reference */}
                <ReferenceLine
                  x={MONTH_SHORT[currentMonthIndex]}
                  stroke="oklch(0.75 0.16 65)"
                  strokeDasharray="4 2"
                  strokeOpacity={0.7}
                  label={{
                    value: "Now",
                    position: "top",
                    fontSize: 10,
                    fill: "oklch(0.75 0.16 65)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.75 0.16 65)"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const isCurrent = payload.monthIndex === currentMonthIndex;
                    const isBest = payload.monthIndex === bestMonth.monthIndex;
                    const isWorst =
                      payload.monthIndex === worstMonth.monthIndex;
                    const r = isCurrent ? 6 : isBest || isWorst ? 5 : 3;
                    const fill = isCurrent
                      ? "oklch(0.75 0.16 65)"
                      : isBest
                        ? "oklch(0.70 0.18 160)"
                        : isWorst
                          ? "oklch(0.60 0.22 25)"
                          : "oklch(0.75 0.16 65)";
                    return (
                      <circle
                        key={`dot-${payload.monthIndex}`}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={fill}
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7, fill: "oklch(0.75 0.16 65)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 12-Month Calendar Grid */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Monthly Price Calendar
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {monthPoints.map((p) => {
            const isBest = cheapestMonths.includes(p.monthIndex);
            const isWorst = expensiveMonths.includes(p.monthIndex);
            const isCurrent = p.monthIndex === currentMonthIndex;
            const diff = p.relativeIndex - 100;
            return (
              <div
                key={p.month}
                className={`rounded-xl border p-3 text-center transition-colors ${getMonthBgClass(p.relativeIndex)} ${isCurrent ? "ring-2 ring-amber/50" : ""}`}
                data-ocid={`seasonal_pricing.month.${p.monthIndex + 1}`}
              >
                <div
                  className={`text-xs font-bold mb-1 ${isCurrent ? "text-amber" : "text-foreground"}`}
                >
                  {p.shortMonth}
                </div>
                <div
                  className={`text-sm font-bold font-display ${getIndexTextClass(p.relativeIndex)}`}
                >
                  {p.relativeIndex.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {diff > 0 ? "+" : ""}
                  {diff.toFixed(1)}%
                </div>
                {isBest && (
                  <Badge
                    variant="outline"
                    className="mt-1.5 text-[9px] px-1 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                  >
                    Best
                  </Badge>
                )}
                {isWorst && (
                  <Badge
                    variant="outline"
                    className="mt-1.5 text-[9px] px-1 py-0 border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10"
                  >
                    Avoid
                  </Badge>
                )}
                {isCurrent && !isBest && !isWorst && (
                  <Badge
                    variant="outline"
                    className="mt-1.5 text-[9px] px-1 py-0 border-amber/30 text-amber bg-amber/10"
                  >
                    Now
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Seasonal Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-surface border-steel-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Why Prices Are Seasonal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Jan–Feb:</strong> Post-holiday
              slowdown. Low buyer demand forces dealers to discount. Best time
              for patient buyers.
            </p>
            <p>
              <strong className="text-foreground">May–Aug:</strong> Peak season.
              Tax refund buying, graduation gifts, and summer travel push prices
              up significantly.
            </p>
            <p>
              <strong className="text-foreground">Sep–Nov:</strong> New model
              year arrivals reduce demand for prior-year used cars, creating
              moderate dips.
            </p>
            <p>
              <strong className="text-foreground">Dec:</strong> Year-end
              clearance. Dealers push volume before year-end inventory counts —
              strong negotiating opportunity.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              How to Use This Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Low index (≤97):</strong>{" "}
              Prices are below average — this is a favorable time to buy.
              Negotiate aggressively.
            </p>
            <p>
              <strong className="text-foreground">Mid index (98–103):</strong>{" "}
              Pricing near average. Deal on individual listing quality rather
              than seasonal timing.
            </p>
            <p>
              <strong className="text-foreground">High index (≥104):</strong>{" "}
              Seasonal peak. Consider waiting unless you find an exceptional
              individual deal.
            </p>
            <p>
              <strong className="text-foreground">Tip:</strong> Combine this
              with the Market Saturation tool — low-saturation months + high
              price index = best time to wait.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
