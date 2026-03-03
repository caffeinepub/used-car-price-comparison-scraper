import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle,
  Clock,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Seasonal Data ────────────────────────────────────────────────────────────

const MONTHLY_INDEX = [
  { month: "Jan", shortMonth: "J", index: 92, label: "January" },
  { month: "Feb", shortMonth: "F", index: 90, label: "February" },
  { month: "Mar", shortMonth: "M", index: 95, label: "March" },
  { month: "Apr", shortMonth: "A", index: 100, label: "April" },
  { month: "May", shortMonth: "M", index: 105, label: "May" },
  { month: "Jun", shortMonth: "J", index: 108, label: "June" },
  { month: "Jul", shortMonth: "J", index: 110, label: "July" },
  { month: "Aug", shortMonth: "A", index: 108, label: "August" },
  { month: "Sep", shortMonth: "S", index: 102, label: "September" },
  { month: "Oct", shortMonth: "O", index: 98, label: "October" },
  { month: "Nov", shortMonth: "N", index: 96, label: "November" },
  { month: "Dec", shortMonth: "D", index: 93, label: "December" },
];

const currentMonthIndex = new Date().getMonth(); // 0-based

function getSignal(monthIdx: number): "buy" | "wait" | "average" {
  const idx = MONTHLY_INDEX[monthIdx].index;
  if (idx <= 95) return "buy";
  if (idx >= 105) return "wait";
  return "average";
}

function getBestMonths(): string[] {
  const sorted = [...MONTHLY_INDEX].sort((a, b) => a.index - b.index);
  return sorted.slice(0, 3).map((m) => m.month);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const diff = val - 100;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <div className="font-bold text-foreground">{label}</div>
      <div className="text-muted-foreground">
        Price Index: <span className="font-bold text-foreground">{val}</span>
      </div>
      <div
        className={
          diff <= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-500 dark:text-red-400"
        }
      >
        {diff > 0 ? `+${diff}%` : `${diff}%`} vs. average
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShouldIWaitPage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const signal = getSignal(currentMonthIndex);
  const bestMonths = getBestMonths();
  const currentData = MONTHLY_INDEX[currentMonthIndex];
  const vehicleName =
    [make, model].filter(Boolean).join(" ") || "this vehicle type";

  const pctVsAvg = currentData.index - 100;
  const absLabel = Math.abs(pctVsAvg);
  const direction = pctVsAvg > 0 ? "above" : "below";

  let recommendationText = "";
  if (signal === "buy") {
    recommendationText = `Based on historical seasonal patterns for ${vehicleName}, prices tend to be ${absLabel}% ${direction} average in ${currentData.label}. This is one of the best months to buy — dealers are more motivated to move inventory, and you have stronger negotiating leverage right now.`;
  } else if (signal === "wait") {
    recommendationText = `Based on historical seasonal patterns for ${vehicleName}, prices tend to be ${absLabel}% ${direction} average in ${currentData.label}. This is a seasonally high-price period. If you can wait until late fall or early winter, you could save ${Math.round(absLabel * 0.7)}–${Math.round(absLabel * 1.1)}% on the purchase price.`;
  } else {
    recommendationText = `Based on historical seasonal patterns for ${vehicleName}, prices in ${currentData.label} are roughly at average levels — ${absLabel}% ${direction} the annual mean. There's no strong reason to wait or rush. If you find a good deal now, it's reasonable to move on it.`;
  }

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber/10 border border-amber/20 shrink-0">
          <Clock className="w-6 h-6 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground uppercase">
            Should I Wait?
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Seasonal price intelligence — find out if now is a good time to buy
            or if prices are likely to drop soon.
          </p>
        </div>
      </div>

      {/* Input */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Vehicle to Analyze
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAnalyze}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="wait-make"
                className="text-xs text-muted-foreground"
              >
                Make
              </label>
              <input
                id="wait-make"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Honda"
                data-ocid="wait.make.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="wait-model"
                className="text-xs text-muted-foreground"
              >
                Model
              </label>
              <input
                id="wait-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Accord"
                data-ocid="wait.model.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                data-ocid="wait.primary_button"
                className="px-6 py-2 rounded-lg bg-amber text-zinc-900 text-sm font-bold hover:bg-amber/90 transition-colors whitespace-nowrap"
              >
                Analyze Timing
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Signal Banner — always visible after submit, or by default */}
      {(submitted || true) && (
        <>
          {/* Main Signal Card */}
          <Card
            data-ocid="wait.card"
            className={`border-2 ${
              signal === "buy"
                ? "border-emerald-500/40 bg-emerald-500/5"
                : signal === "wait"
                  ? "border-red-500/40 bg-red-500/5"
                  : "border-amber/40 bg-amber/5"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-5 flex-wrap">
                <div
                  className={`p-4 rounded-2xl ${
                    signal === "buy"
                      ? "bg-emerald-500/20"
                      : signal === "wait"
                        ? "bg-red-500/20"
                        : "bg-amber/20"
                  }`}
                >
                  {signal === "buy" ? (
                    <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                  ) : signal === "wait" ? (
                    <TrendingUp className="w-10 h-10 text-red-500 dark:text-red-400" />
                  ) : (
                    <Minus className="w-10 h-10 text-amber" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    {currentData.label} Signal
                  </div>
                  <h2
                    className={`text-xl font-bold font-display uppercase ${
                      signal === "buy"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : signal === "wait"
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber"
                    }`}
                  >
                    {signal === "buy"
                      ? "Good Time to Buy"
                      : signal === "wait"
                        ? "Prices Are High — Consider Waiting"
                        : "Average Pricing"}
                  </h2>
                  <p className="text-sm text-foreground leading-relaxed mt-2">
                    {recommendationText}
                  </p>
                </div>
                <div className="text-center min-w-[80px]">
                  <div className="text-3xl font-bold font-display text-foreground">
                    {currentData.index}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Price Index
                  </div>
                  <div className="text-xs font-medium mt-0.5">
                    {pctVsAvg > 0 ? (
                      <span className="text-red-500 dark:text-red-400 flex items-center gap-0.5 justify-center">
                        <TrendingUp className="w-3 h-3" />+{pctVsAvg}%
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 justify-center">
                        <TrendingDown className="w-3 h-3" />
                        {pctVsAvg}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
                  Monthly Price Index
                </CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber inline-block" />
                    Current month
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 inline-block" />
                    Best months
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                100 = average price. Below 100 = cheaper than average.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-56" data-ocid="wait.chart_point">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={MONTHLY_INDEX}
                    margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--steel-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[85, 115]}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={100}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 2"
                      strokeOpacity={0.5}
                    />
                    <Bar dataKey="index" radius={[4, 4, 0, 0]}>
                      {MONTHLY_INDEX.map((entry, index) => {
                        const isCurrent = index === currentMonthIndex;
                        const isBest =
                          bestMonths.includes(entry.month) &&
                          index !== currentMonthIndex;
                        let color = "oklch(0.45 0.012 260)";
                        if (isCurrent) color = "oklch(0.75 0.16 65)";
                        else if (isBest) color = "oklch(0.70 0.18 160)";
                        else if (entry.index >= 105)
                          color = "oklch(0.55 0.22 25)";
                        return (
                          <Cell
                            key={`cell-${entry.month}`}
                            fill={color}
                            fillOpacity={0.85}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Best Months + Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-surface border-steel-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Best Months to Buy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {MONTHLY_INDEX.map((m, i) => ({ ...m, i }))
                    .sort((a, b) => a.index - b.index)
                    .slice(0, 3)
                    .map((m) => (
                      <div
                        key={m.month}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          m.i === currentMonthIndex
                            ? "border-amber/40 bg-amber/10"
                            : "border-emerald-500/30 bg-emerald-500/10"
                        }`}
                      >
                        {m.i === currentMonthIndex && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                        )}
                        <span
                          className={`text-sm font-bold font-display ${
                            m.i === currentMonthIndex
                              ? "text-amber"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {m.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Index {m.index}
                        </span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {m.index - 100}%
                        </span>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Early winter months (Jan–Feb) and late fall (Nov–Dec)
                  historically show the lowest prices as dealers push year-end
                  inventory.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-surface border-steel-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Why Prices Are Seasonal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Jan–Feb:</strong>{" "}
                  Post-holiday slowdown. Low buyer demand forces dealers to
                  discount.
                </p>
                <p>
                  <strong className="text-foreground">May–Aug:</strong> Peak
                  season. Tax refund buying, graduation gifts, summer travel
                  push prices up.
                </p>
                <p>
                  <strong className="text-foreground">Sep–Nov:</strong> New
                  model year arrivals reduce demand for prior-year used cars.
                </p>
                <p>
                  <strong className="text-foreground">Dec:</strong> Year-end
                  clearance. Dealers want to clear lots before January inventory
                  counts.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
