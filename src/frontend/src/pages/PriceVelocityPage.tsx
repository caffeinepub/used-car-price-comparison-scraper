import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
import { ALL_MAKES, CAR_MAKES_MODELS } from "../data/carMakesModels";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = 7 | 14 | 30;

type VelocityDirection =
  | "falling-fast"
  | "falling"
  | "stable"
  | "rising"
  | "rising-fast";

interface MoverEntry {
  make: string;
  model: string;
  velocity30d: number;
  avgPrice: number;
  listingCount: number;
  direction: VelocityDirection;
}

interface ChartPoint {
  day: string;
  pct: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getDirection(velocity: number): VelocityDirection {
  if (velocity <= -5) return "falling-fast";
  if (velocity < -1) return "falling";
  if (velocity <= 1) return "stable";
  if (velocity < 5) return "rising";
  return "rising-fast";
}

function DirectionBadge({ direction }: { direction: VelocityDirection }) {
  const config = {
    "falling-fast": {
      label: "Falling Fast",
      className:
        "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
      icon: <ArrowDown className="w-3 h-3" />,
    },
    falling: {
      label: "Falling",
      className:
        "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25",
      icon: <ArrowDown className="w-3 h-3" />,
    },
    stable: {
      label: "Stable",
      className:
        "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
      icon: <Minus className="w-3 h-3" />,
    },
    rising: {
      label: "Rising",
      className:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      icon: <ArrowUp className="w-3 h-3" />,
    },
    "rising-fast": {
      label: "Rising Fast",
      className:
        "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25",
      icon: <ArrowUp className="w-3 h-3" />,
    },
  };

  const c = config[direction];
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 font-semibold ${c.className}`}
    >
      {c.icon}
      {c.label}
    </Badge>
  );
}

// ─── Seeded Generator ─────────────────────────────────────────────────────────

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateEntryForMakeModel(make: string, model: string): MoverEntry {
  const seed = hashCode(`${make}:${model}`);
  const rand = seededRandom(seed);
  const velocityRaw = rand() * 20 - 10; // -10 to +10
  const velocity30d = Math.round(velocityRaw * 10) / 10;
  const avgPrice = 15000 + Math.floor(rand() * 50000);
  const listingCount = 20 + Math.floor(rand() * 200);
  return {
    make,
    model,
    velocity30d,
    avgPrice,
    listingCount,
    direction: getDirection(velocity30d),
  };
}

// ─── Simulated Data ───────────────────────────────────────────────────────────

// Each model has a velocity seed that drives chart generation
const MODEL_DATA: MoverEntry[] = [
  {
    make: "Toyota",
    model: "Camry",
    velocity30d: -3.8,
    avgPrice: 24200,
    listingCount: 147,
    direction: "falling",
  },
  {
    make: "Ford",
    model: "F-150",
    velocity30d: 2.1,
    avgPrice: 38400,
    listingCount: 203,
    direction: "rising",
  },
  {
    make: "Honda",
    model: "CR-V",
    velocity30d: -6.4,
    avgPrice: 28900,
    listingCount: 118,
    direction: "falling-fast",
  },
  {
    make: "Chevrolet",
    model: "Silverado 1500",
    velocity30d: 0.3,
    avgPrice: 41200,
    listingCount: 176,
    direction: "stable",
  },
  {
    make: "Toyota",
    model: "RAV4",
    velocity30d: 5.7,
    avgPrice: 31800,
    listingCount: 134,
    direction: "rising-fast",
  },
  {
    make: "Honda",
    model: "Civic",
    velocity30d: -2.3,
    avgPrice: 19700,
    listingCount: 89,
    direction: "falling",
  },
  {
    make: "BMW",
    model: "3 Series",
    velocity30d: -7.2,
    avgPrice: 34500,
    listingCount: 62,
    direction: "falling-fast",
  },
  {
    make: "Jeep",
    model: "Wrangler",
    velocity30d: 1.8,
    avgPrice: 36700,
    listingCount: 95,
    direction: "rising",
  },
  {
    make: "Tesla",
    model: "Model 3",
    velocity30d: -4.1,
    avgPrice: 29900,
    listingCount: 78,
    direction: "falling",
  },
  {
    make: "Hyundai",
    model: "Tucson",
    velocity30d: 0.8,
    avgPrice: 25600,
    listingCount: 101,
    direction: "stable",
  },
];

function getModelsForMake(make: string): string[] {
  if (!make) return [];
  return CAR_MAKES_MODELS[make] ?? [];
}

// Generate velocity chart data for a given model and time range
function generateVelocityChart(
  modelEntry: MoverEntry,
  days: TimeRange,
): ChartPoint[] {
  const seed = modelEntry.velocity30d;
  const points: ChartPoint[] = [];
  // Start from 0, drift towards seed velocity with noise
  let cumPct = 0;
  for (let i = 0; i < days; i++) {
    const dayLabel = `Day ${i + 1}`;
    // Add some noise around the daily rate
    const dailyRate = seed / 30;
    const noise = Math.sin(i * 2.3 + seed) * 0.4 + Math.cos(i * 1.7) * 0.3;
    cumPct += dailyRate + noise * 0.2;
    points.push({
      day: dayLabel,
      pct: Math.round(cumPct * 100) / 100,
    });
  }
  return points;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value as number;
  return (
    <div className="bg-popover border border-steel-border rounded-lg px-3 py-2 shadow-panel text-xs">
      <p className="font-bold text-foreground mb-0.5">{label}</p>
      <p
        className={
          val < 0
            ? "text-red-500 dark:text-red-400"
            : val > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
        }
      >
        Price change:{" "}
        <span className="font-bold">
          {val > 0 ? "+" : ""}
          {val.toFixed(2)}%
        </span>
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PriceVelocityPage() {
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  const availableModels = useMemo(
    () => getModelsForMake(selectedMake),
    [selectedMake],
  );

  const activeEntry = useMemo(() => {
    const make = selectedMake;
    const model = selectedModel;
    if (!make && !model) return MODEL_DATA[0];
    const prebuilt = MODEL_DATA.find(
      (m) => (!make || m.make === make) && (!model || m.model === model),
    );
    if (prebuilt) return prebuilt;
    // Generate deterministic data for any make/model not in pre-built list
    const effectiveMake = make || "Generic";
    const effectiveModel = model || availableModels[0] || "Model";
    return generateEntryForMakeModel(effectiveMake, effectiveModel);
  }, [selectedMake, selectedModel, availableModels]);

  const chartData = useMemo(
    () => generateVelocityChart(activeEntry, timeRange),
    [activeEntry, timeRange],
  );

  const velocityPct = activeEntry.velocity30d;
  const direction = getDirection(velocityPct);

  // Summary stat cards
  const fallingFast = MODEL_DATA.filter(
    (m) => m.direction === "falling-fast",
  ).length;
  const risingFast = MODEL_DATA.filter(
    (m) => m.direction === "rising-fast",
  ).length;
  const stable = MODEL_DATA.filter((m) => m.direction === "stable").length;

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 py-8 space-y-8"
      data-ocid="price_velocity.page"
    >
      <PageHeader
        title="Price Velocity Tracker"
        description="Measures how fast prices are moving for each make/model. Spot models in freefall before the market reacts."
        icon={<TrendingDown className="w-6 h-6" />}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/15">
              <TrendingDown className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {fallingFast}
              </div>
              <div className="text-xs text-muted-foreground">Falling Fast</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-500/5 border-slate-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-500/15">
              <Minus className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {stable}
              </div>
              <div className="text-xs text-muted-foreground">Stable</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {risingFast}
              </div>
              <div className="text-xs text-muted-foreground">Rising Fast</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Select Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="velocity-make"
                className="text-xs text-muted-foreground"
              >
                Make
              </label>
              <select
                id="velocity-make"
                value={selectedMake}
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel("");
                }}
                data-ocid="price_velocity.make.select"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
              >
                <option value="">All Makes</option>
                {ALL_MAKES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="velocity-model"
                className="text-xs text-muted-foreground"
              >
                Model
              </label>
              <select
                id="velocity-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedMake}
                data-ocid="price_velocity.model.select"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedMake ? "All Models" : "Select a make first"}
                </option>
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {/* Time range toggle */}
            <div className="flex items-center gap-1 p-1 bg-background rounded-lg border border-steel-border self-end">
              {([7, 14, 30] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  data-ocid="price_velocity.timerange.toggle"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    timeRange === r
                      ? "bg-amber/20 text-amber"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Card */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                {activeEntry.make} {activeEntry.model} — {timeRange}-Day Price
                Velocity
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cumulative % change from start of period. Below 0 = prices
                falling.
              </p>
            </div>
            <DirectionBadge direction={direction} />
          </div>
        </CardHeader>
        <CardContent>
          {/* Velocity highlight */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl mb-4 border ${
              velocityPct <= -5
                ? "bg-red-500/8 border-red-500/20"
                : velocityPct < -1
                  ? "bg-orange-500/8 border-orange-500/20"
                  : velocityPct <= 1
                    ? "bg-slate-500/8 border-slate-500/20"
                    : velocityPct < 5
                      ? "bg-emerald-500/8 border-emerald-500/20"
                      : "bg-green-500/8 border-green-500/20"
            }`}
          >
            <div
              className={`text-3xl font-bold font-display ${
                velocityPct < 0
                  ? "text-red-500 dark:text-red-400"
                  : velocityPct === 0
                    ? "text-muted-foreground"
                    : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {velocityPct > 0 ? "+" : ""}
              {velocityPct.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">30-day change</div>
              <div>
                Avg price: {fmtCurrency(activeEntry.avgPrice)} ·{" "}
                {activeEntry.listingCount} listings tracked
              </div>
            </div>
          </div>

          <div className="h-56" data-ocid="price_velocity.chart_point">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(timeRange / 6)}
                />
                <YAxis
                  tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine
                  y={0}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 2"
                  strokeOpacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke={
                    velocityPct < 0
                      ? "oklch(0.60 0.22 25)"
                      : "oklch(0.70 0.18 160)"
                  }
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill:
                      velocityPct < 0
                        ? "oklch(0.60 0.22 25)"
                        : "oklch(0.70 0.18 160)",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Movers Table */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
            Top Movers — 30-Day Velocity
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Models with the fastest price movements in the last 30 days. Click a
            row to view its chart.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table data-ocid="price_velocity.table">
            <TableHeader>
              <TableRow className="border-steel-border hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Make / Model
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  30d Velocity
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Direction
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Avg Price
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Listings
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...MODEL_DATA]
                .sort(
                  (a, b) => Math.abs(b.velocity30d) - Math.abs(a.velocity30d),
                )
                .map((entry, i) => (
                  <TableRow
                    key={`${entry.make}-${entry.model}`}
                    data-ocid={`price_velocity.row.${i + 1}`}
                    className="border-steel-border cursor-pointer hover:bg-amber/3 transition-colors"
                    onClick={() => {
                      setSelectedMake(entry.make);
                      setSelectedModel(entry.model);
                    }}
                  >
                    <TableCell className="font-semibold text-foreground py-3">
                      {entry.make} {entry.model}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold font-display text-base ${
                        entry.velocity30d < 0
                          ? "text-red-500 dark:text-red-400"
                          : entry.velocity30d > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {entry.velocity30d > 0 ? "+" : ""}
                      {entry.velocity30d.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <DirectionBadge direction={entry.direction} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {fmtCurrency(entry.avgPrice)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {entry.listingCount}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Interpretation guide */}
      <Card className="bg-amber/3 border-amber/20">
        <CardContent className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber mb-2">
            How to Read This
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-red-500 dark:text-red-400">
                Falling Fast (≤ -5%)
              </span>{" "}
              — Prices dropping rapidly. High buyer leverage. Best time to
              negotiate hard.
            </p>
            <p>
              <span className="font-semibold text-orange-500 dark:text-orange-400">
                Falling (-1% to -5%)
              </span>{" "}
              — Modest downward trend. Good market conditions for buyers.
            </p>
            <p>
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Stable (±1%)
              </span>{" "}
              — Prices steady. Deal on listing quality rather than timing.
            </p>
            <p>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Rising Fast (≥ 5%)
              </span>{" "}
              — Prices climbing quickly. Buy now or risk paying more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
