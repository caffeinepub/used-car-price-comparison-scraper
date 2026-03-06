import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart2,
  Calendar,
  DollarSign,
  Info,
  Loader2,
  TrendingDown,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
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
import type { DepreciationDataPoint } from "../hooks/useQueries";
import { useDepreciationCurve } from "../hooks/useQueries";

// ─── Placeholder depreciation data ───────────────────────────────────────────

const PLACEHOLDER_DATA = [
  { label: "Year 0", monthsFromFirst: 0, value: 30000 },
  { label: "Year 1", monthsFromFirst: 12, value: 25500 },
  { label: "Year 2", monthsFromFirst: 24, value: 22000 },
  { label: "Year 3", monthsFromFirst: 36, value: 19200 },
  { label: "Year 4", monthsFromFirst: 48, value: 17000 },
  { label: "Year 5", monthsFromFirst: 60, value: 15200 },
];

// ─── Currency formatter ───────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

// ─── Chart data point type ────────────────────────────────────────────────────

interface ChartPoint {
  label: string;
  monthsFromFirst: number;
  value: number;
}

function buildChartData(points: DepreciationDataPoint[]): ChartPoint[] {
  return points.map((p) => {
    const months = Number(p.monthsFromFirst);
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    const label =
      months === 0
        ? "Start"
        : remMonths === 0
          ? `Yr ${years}`
          : `${years}y ${remMonths}m`;
    return { label, monthsFromFirst: months, value: p.avgPrice };
  });
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  startingPrice: number;
}

function CustomTooltip({
  active,
  payload,
  label,
  startingPrice,
}: TooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value as number;
  const drop = startingPrice - value;
  const dropPct =
    startingPrice > 0 ? ((drop / startingPrice) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-surface border border-steel-border rounded-lg p-3 shadow-xl text-xs">
      <p className="font-semibold text-amber font-rajdhani text-sm mb-1">
        {label}
      </p>
      <p className="text-foreground">
        <span className="text-muted-text">Avg Price: </span>
        <span className="font-bold">{fmt(value)}</span>
      </p>
      {drop > 0 && (
        <p className="text-red-400 mt-0.5">
          −{fmt(drop)} ({dropPct}% from start)
        </p>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className={`flex-1 min-w-[140px] rounded-xl border p-4 flex flex-col gap-1 ${
        accent
          ? "bg-amber/10 border-amber/30"
          : "bg-surface border-steel-border"
      }`}
    >
      <div className="flex items-center gap-2 text-muted-text text-xs mb-1">
        <span className={accent ? "text-amber" : "text-muted-text"}>
          {icon}
        </span>
        <span className="uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p
        className={`text-xl font-bold font-rajdhani ${accent ? "text-amber" : "text-foreground"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-text">{sub}</p>}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-20 ml-auto" />
      </div>
      <Skeleton className="w-full h-[340px] rounded-lg" />
      <div className="flex gap-4 pt-3 border-t border-steel-border">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32 ml-auto" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DepreciationCurvePage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const hasInputs = make.trim() !== "" && model.trim() !== "";

  const {
    data: rawData,
    isLoading,
    isFetching,
  } = useDepreciationCurve(make.trim(), model.trim());

  // Determine which data set to use
  const liveData: ChartPoint[] =
    rawData && rawData.length > 0 ? buildChartData(rawData) : [];
  const isLiveMode = hasInputs && !isLoading;
  const chartData: ChartPoint[] =
    isLiveMode && liveData.length > 0 ? liveData : PLACEHOLDER_DATA;
  const isPlaceholder = !isLiveMode || liveData.length === 0;

  // Compute summary stats
  const startingPrice = chartData.length > 0 ? chartData[0].value : 0;
  const latestValue =
    chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const totalDepreciationPct =
    startingPrice > 0
      ? (((startingPrice - latestValue) / startingPrice) * 100).toFixed(1)
      : "0.0";

  const latestMonths =
    liveData.length > 0 ? liveData[liveData.length - 1].monthsFromFirst : null;
  const latestLabel =
    latestMonths !== null
      ? latestMonths >= 12
        ? `After ${Math.round(latestMonths / 12)} yr${Math.round(latestMonths / 12) !== 1 ? "s" : ""}`
        : `After ${latestMonths} mo`
      : "Over 5 years";

  // Y-axis domain
  const allValues = chartData.map((d) => d.value);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const yPad = (maxVal - minVal) * 0.15 || 5000;
  const yDomain: [number, number] = [Math.max(0, minVal - yPad), maxVal + yPad];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Depreciation Curve"
        description="Value loss over time based on your listing data"
        icon={<TrendingDown className="w-6 h-6" />}
      />

      {/* Inputs */}
      <div className="bg-surface border border-steel-border rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="depreciation-make"
              className="text-xs font-medium text-muted-text uppercase tracking-wider"
            >
              Make
            </label>
            <input
              id="depreciation-make"
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Toyota"
              className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50 transition-colors"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="depreciation-model"
              className="text-xs font-medium text-muted-text uppercase tracking-wider"
            >
              Model
            </label>
            <input
              id="depreciation-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Camry"
              className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50 transition-colors"
            />
          </div>
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-2 rounded-lg bg-amber/5 border border-amber/15 px-3 py-2.5">
          <Info className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <p className="text-xs text-muted-text leading-relaxed">
            {hasInputs
              ? "Depreciation curve is computed from your actual listing data for this make/model. Add more listings to improve accuracy."
              : "Enter a make and model above to load the depreciation curve from your listing data. Sample data is shown below."}
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="flex flex-wrap gap-3">
        <StatCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Starting Price"
          value={fmt(startingPrice)}
          sub={isPlaceholder ? "Sample value" : "Earliest avg listing price"}
        />
        <StatCard
          icon={<Calendar className="w-4 h-4" />}
          label="Est. Latest Value"
          value={fmt(latestValue)}
          sub={
            isPlaceholder
              ? "Sample projected value"
              : "Most recent avg listing price"
          }
        />
        <StatCard
          icon={<BarChart2 className="w-4 h-4" />}
          label="Total Depreciation %"
          value={`${totalDepreciationPct}%`}
          sub={latestLabel}
          accent
        />
      </div>

      {/* Chart */}
      <div className="bg-surface border border-steel-border rounded-xl p-5">
        {isLoading && hasInputs ? (
          <ChartSkeleton />
        ) : hasInputs && liveData.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="p-3 rounded-full bg-amber/10 border border-amber/20">
              <TrendingDown className="w-6 h-6 text-amber/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Not enough data
            </p>
            <p className="text-xs text-muted-text max-w-xs leading-relaxed">
              Not enough listing data to project a depreciation curve — add more
              listings for{" "}
              <span className="text-amber font-medium">
                {make} {model}
              </span>{" "}
              to see results.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground font-rajdhani uppercase tracking-wide">
                {isPlaceholder
                  ? "Projected Value Over Time"
                  : `${make} ${model} — Value Over Time`}
              </h2>
              <div className="flex items-center gap-2">
                {isFetching && hasInputs && (
                  <Loader2 className="w-3.5 h-3.5 text-amber animate-spin" />
                )}
                <span
                  className={`text-xs border rounded px-2 py-0.5 ${
                    isPlaceholder
                      ? "text-muted-text bg-background border-steel-border"
                      : "text-amber bg-amber/10 border-amber/30"
                  }`}
                >
                  {isPlaceholder
                    ? "Sample Data"
                    : `${liveData.length} data points`}
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  width={52}
                  domain={yDomain}
                />
                <Tooltip
                  content={<CustomTooltip startingPrice={startingPrice} />}
                />
                {/* Reference line at 50% of starting price */}
                {startingPrice > 0 && (
                  <ReferenceLine
                    y={startingPrice * 0.5}
                    stroke="rgba(251,191,36,0.25)"
                    strokeDasharray="6 4"
                    label={{
                      value: "50% value",
                      position: "insideTopRight",
                      fill: "#94a3b8",
                      fontSize: 10,
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ fill: "#f59e0b", r: 5, strokeWidth: 0 }}
                  activeDot={{ fill: "#fbbf24", r: 7, strokeWidth: 0 }}
                  name="Avg Price"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Chart legend / annotation */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-text border-t border-steel-border pt-3">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 h-0.5 bg-amber rounded" />
                {isPlaceholder ? "Projected Value" : "Avg Listing Price"}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-6 h-0.5 rounded"
                  style={{
                    background: "rgba(251,191,36,0.35)",
                    borderTop: "1px dashed rgba(251,191,36,0.5)",
                  }}
                />
                50% Threshold
              </span>
              <span className="ml-auto italic">
                {make && model
                  ? `${make} ${model}`
                  : "Enter make & model above to filter"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Year-by-year breakdown table */}
      <div className="bg-surface border border-steel-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-steel-border">
          <h2 className="text-sm font-semibold text-foreground font-rajdhani uppercase tracking-wide">
            Period Breakdown
          </h2>
        </div>

        {isLoading && hasInputs ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-steel-border">
                  <th className="text-left px-5 py-2.5 text-xs text-muted-text uppercase tracking-wider font-medium">
                    Period
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs text-muted-text uppercase tracking-wider font-medium">
                    {isPlaceholder ? "Est. Value" : "Avg Price"}
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs text-muted-text uppercase tracking-wider font-medium">
                    Period Loss
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs text-muted-text uppercase tracking-wider font-medium">
                    Cumulative Loss
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs text-muted-text uppercase tracking-wider font-medium">
                    Retained %
                  </th>
                  {!isPlaceholder && (
                    <th className="text-right px-5 py-2.5 text-xs text-muted-text uppercase tracking-wider font-medium">
                      Listings
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => {
                  const periodLoss =
                    i === 0 ? 0 : chartData[i - 1].value - row.value;
                  const cumulativeLoss = startingPrice - row.value;
                  const retainedPct =
                    startingPrice > 0
                      ? ((row.value / startingPrice) * 100).toFixed(1)
                      : "100.0";
                  const livePoint =
                    !isPlaceholder && rawData ? rawData[i] : null;
                  return (
                    <tr
                      key={`${row.label}-${i}`}
                      className="border-b border-steel-border/50 hover:bg-surface/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-foreground font-medium">
                        {row.label}
                      </td>
                      <td className="px-5 py-3 text-right text-foreground font-semibold">
                        {fmt(row.value)}
                      </td>
                      <td className="px-5 py-3 text-right text-red-400">
                        {periodLoss > 0 ? `−${fmt(periodLoss)}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-text">
                        {cumulativeLoss > 0 ? `−${fmt(cumulativeLoss)}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`font-semibold ${
                            Number(retainedPct) >= 70
                              ? "text-emerald-400"
                              : Number(retainedPct) >= 55
                                ? "text-amber"
                                : "text-red-400"
                          }`}
                        >
                          {retainedPct}%
                        </span>
                      </td>
                      {!isPlaceholder && (
                        <td className="px-5 py-3 text-right text-muted-text text-xs">
                          {livePoint ? Number(livePoint.listingCount) : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
