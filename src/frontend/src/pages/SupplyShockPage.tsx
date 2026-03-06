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
import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { useMemo, useState } from "react";
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
import PageHeader from "../components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShockStatus = "spike" | "drop" | "normal";

interface WeekPoint {
  week: string;
  volume: number;
  baseline: number;
  status: ShockStatus;
  pctChange: number;
}

interface MarketEntry {
  make: string;
  model: string;
  currentVolume: number;
  baselineVolume: number;
  pctChange: number;
  status: ShockStatus;
  weeklyData: WeekPoint[];
}

// ─── Simulated Data ───────────────────────────────────────────────────────────

function buildWeeks(
  baseline: number,
  shockWeek: number,
  shockDirection: "spike" | "drop" | "none",
): WeekPoint[] {
  const WEEK_LABELS = [
    "Wk 1",
    "Wk 2",
    "Wk 3",
    "Wk 4",
    "Wk 5",
    "Wk 6",
    "Wk 7",
    "Wk 8",
  ];
  return WEEK_LABELS.map((label, i) => {
    let vol = baseline + Math.round((Math.sin(i * 1.2) * baseline) / 10);
    if (i === shockWeek) {
      if (shockDirection === "spike") vol = Math.round(baseline * 1.55);
      else if (shockDirection === "drop") vol = Math.round(baseline * 0.42);
    }
    const pctChange = ((vol - baseline) / baseline) * 100;
    let status: ShockStatus = "normal";
    if (pctChange > 40) status = "spike";
    else if (pctChange < -40) status = "drop";
    return { week: label, volume: vol, baseline, status, pctChange };
  });
}

const MARKET_ENTRIES: MarketEntry[] = [
  (() => {
    const wk = buildWeeks(140, 7, "spike");
    return {
      make: "Toyota",
      model: "Camry",
      currentVolume: wk[7].volume,
      baselineVolume: 140,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(195, 7, "drop");
    return {
      make: "Ford",
      model: "F-150",
      currentVolume: wk[7].volume,
      baselineVolume: 195,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(112, 7, "none");
    return {
      make: "Honda",
      model: "CR-V",
      currentVolume: wk[7].volume,
      baselineVolume: 112,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(165, 6, "spike");
    return {
      make: "Chevrolet",
      model: "Silverado",
      currentVolume: wk[7].volume,
      baselineVolume: 165,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(128, 7, "none");
    return {
      make: "Toyota",
      model: "RAV4",
      currentVolume: wk[7].volume,
      baselineVolume: 128,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(88, 7, "drop");
    return {
      make: "Honda",
      model: "Civic",
      currentVolume: wk[7].volume,
      baselineVolume: 88,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(60, 7, "none");
    return {
      make: "BMW",
      model: "3 Series",
      currentVolume: wk[7].volume,
      baselineVolume: 60,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(90, 5, "spike");
    return {
      make: "Jeep",
      model: "Wrangler",
      currentVolume: wk[7].volume,
      baselineVolume: 90,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(74, 7, "none");
    return {
      make: "Tesla",
      model: "Model 3",
      currentVolume: wk[7].volume,
      baselineVolume: 74,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
  (() => {
    const wk = buildWeeks(98, 4, "drop");
    return {
      make: "Hyundai",
      model: "Tucson",
      currentVolume: wk[7].volume,
      baselineVolume: 98,
      pctChange: wk[7].pctChange,
      status: wk[7].status,
      weeklyData: wk,
    };
  })(),
];

const MAKES = [...new Set(MARKET_ENTRIES.map((m) => m.make))].sort();

function getModelsForMake(make: string) {
  if (!make) return [...new Set(MARKET_ENTRIES.map((m) => m.model))].sort();
  return MARKET_ENTRIES.filter((m) => m.make === make)
    .map((m) => m.model)
    .sort();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ShockStatus }) {
  if (status === "spike") {
    return (
      <Badge
        variant="outline"
        className="bg-amber/15 text-amber border-amber/30 inline-flex items-center gap-1 text-xs"
      >
        <AlertTriangle className="w-3 h-3" />
        Spike
      </Badge>
    );
  }
  if (status === "drop") {
    return (
      <Badge
        variant="outline"
        className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25 inline-flex items-center gap-1 text-xs"
      >
        <AlertTriangle className="w-3 h-3" />
        Drop
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 inline-flex items-center gap-1 text-xs"
    >
      <CheckCircle2 className="w-3 h-3" />
      Normal
    </Badge>
  );
}

function ShockAlert({ entry }: { entry: MarketEntry }) {
  if (entry.status === "normal") return null;

  const isSpike = entry.status === "spike";
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${
        isSpike
          ? "bg-amber/8 border-amber/25"
          : "bg-red-500/8 border-red-500/25"
      }`}
      data-ocid="supply_shock.alert_banner.panel"
    >
      <div
        className={`p-2 rounded-lg shrink-0 ${
          isSpike ? "bg-amber/15" : "bg-red-500/15"
        }`}
      >
        <AlertTriangle
          className={`w-5 h-5 ${isSpike ? "text-amber" : "text-red-500 dark:text-red-400"}`}
        />
      </div>
      <div>
        <p
          className={`text-sm font-bold mb-1 ${
            isSpike ? "text-amber" : "text-red-600 dark:text-red-400"
          }`}
        >
          {isSpike ? "Inventory Surge Detected" : "Inventory Shortage Detected"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isSpike
            ? `Current listings are ${entry.pctChange.toFixed(0)}% above baseline. Prices may drop soon as supply outpaces demand. Buyers have strong leverage right now.`
            : `Current listings are ${Math.abs(entry.pctChange).toFixed(0)}% below baseline. Expect higher prices and tighter inventory as supply tightens.`}
        </p>
      </div>
    </div>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as WeekPoint;
  return (
    <div className="bg-popover border border-steel-border rounded-lg px-3 py-2 shadow-panel text-xs">
      <p className="font-bold text-foreground mb-0.5">{label}</p>
      <p className="text-muted-foreground">
        Volume:{" "}
        <span className="font-bold text-foreground">{point.volume}</span>
      </p>
      <p className="text-muted-foreground">
        Baseline:{" "}
        <span className="font-bold text-foreground">{point.baseline}</span>
      </p>
      <p
        className={
          point.pctChange > 0
            ? "text-amber"
            : point.pctChange < 0
              ? "text-red-500 dark:text-red-400"
              : "text-muted-foreground"
        }
      >
        {point.pctChange > 0 ? "+" : ""}
        {point.pctChange.toFixed(1)}% vs baseline
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupplyShockPage() {
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const availableModels = useMemo(
    () => getModelsForMake(selectedMake),
    [selectedMake],
  );

  const activeEntry = useMemo(() => {
    if (!selectedModel) return MARKET_ENTRIES[0];
    return (
      MARKET_ENTRIES.find(
        (m) =>
          (!selectedMake || m.make === selectedMake) &&
          m.model === selectedModel,
      ) ?? MARKET_ENTRIES[0]
    );
  }, [selectedMake, selectedModel]);

  const spikes = MARKET_ENTRIES.filter((m) => m.status === "spike").length;
  const drops = MARKET_ENTRIES.filter((m) => m.status === "drop").length;
  const normals = MARKET_ENTRIES.filter((m) => m.status === "normal").length;

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 py-8 space-y-8"
      data-ocid="supply_shock.page"
    >
      <PageHeader
        title="Supply Shock Detector"
        description="Alerts you when a make/model's listing volume spikes or drops significantly — an early signal of upcoming price shifts."
        icon={<Zap className="w-6 h-6" />}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-amber/5 border-amber/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber/15">
              <AlertTriangle className="w-5 h-5 text-amber" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber">{spikes}</div>
              <div className="text-xs text-muted-foreground">
                Inventory Spikes
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/15">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {drops}
              </div>
              <div className="text-xs text-muted-foreground">
                Inventory Drops
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {normals}
              </div>
              <div className="text-xs text-muted-foreground">Normal Supply</div>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="shock-make"
                className="text-xs text-muted-foreground"
              >
                Make
              </label>
              <select
                id="shock-make"
                value={selectedMake}
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel("");
                }}
                data-ocid="supply_shock.make.select"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
              >
                <option value="">All Makes</option>
                {MAKES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="shock-model"
                className="text-xs text-muted-foreground"
              >
                Model
              </label>
              <select
                id="shock-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                data-ocid="supply_shock.model.select"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
              >
                <option value="">Select Model</option>
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shock Alert Banner */}
      <ShockAlert entry={activeEntry} />

      {/* Bar Chart */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                {activeEntry.make} {activeEntry.model} — 8-Week Inventory Volume
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Orange bars = above baseline · Red bars = below baseline ·
                Dashed line = baseline
              </p>
            </div>
            <StatusBadge status={activeEntry.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-60" data-ocid="supply_shock.chart_point">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeEntry.weeklyData}
                margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BarTooltip />} />
                <ReferenceLine
                  y={activeEntry.baselineVolume}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 2"
                  strokeOpacity={0.6}
                  label={{
                    value: "Baseline",
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {activeEntry.weeklyData.map((entry) => (
                    <Cell
                      key={entry.week}
                      fill={
                        entry.status === "spike"
                          ? "oklch(0.75 0.16 65)"
                          : entry.status === "drop"
                            ? "oklch(0.60 0.22 25)"
                            : "oklch(0.70 0.18 160)"
                      }
                      fillOpacity={entry.status === "normal" ? 0.6 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Market Shock Overview Table */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
            Market Shock Overview — All Models
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Current week vs. 8-week baseline. Click a row to view its chart.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table data-ocid="supply_shock.table">
            <TableHeader>
              <TableRow className="border-steel-border hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Make / Model
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Current Vol
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Baseline
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  % Change
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...MARKET_ENTRIES]
                .sort((a, b) => {
                  const order = { spike: 0, drop: 1, normal: 2 };
                  return order[a.status] - order[b.status];
                })
                .map((entry, i) => (
                  <TableRow
                    key={`${entry.make}-${entry.model}`}
                    data-ocid={`supply_shock.row.${i + 1}`}
                    className="border-steel-border cursor-pointer hover:bg-amber/3 transition-colors"
                    onClick={() => {
                      setSelectedMake(entry.make);
                      setSelectedModel(entry.model);
                    }}
                  >
                    <TableCell className="font-semibold text-foreground py-3">
                      {entry.make} {entry.model}
                    </TableCell>
                    <TableCell className="text-right text-foreground font-mono">
                      {entry.currentVolume}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono">
                      {entry.baselineVolume}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        entry.pctChange > 0
                          ? "text-amber"
                          : entry.pctChange < 0
                            ? "text-red-500 dark:text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {entry.pctChange > 0 ? "+" : ""}
                      {entry.pctChange.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Guide */}
      <Card className="bg-amber/3 border-amber/20">
        <CardContent className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber mb-2">
            What These Signals Mean
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-amber">
                Inventory Spike (volume &gt;40% above baseline)
              </span>{" "}
              — Too much supply. Sellers compete for buyers, prices typically
              fall within 2–4 weeks.
            </p>
            <p>
              <span className="font-semibold text-red-500 dark:text-red-400">
                Inventory Drop (volume &gt;40% below baseline)
              </span>{" "}
              — Tight supply. Prices rise as buyers compete. Less room to
              negotiate.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
