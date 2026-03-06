import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  BarChart3,
  PlusCircle,
  Signal,
  TrendingDown,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import { useGetAllListings } from "../hooks/useQueries";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SaturationLevel = "Low" | "Moderate" | "High" | "Oversaturated";
type SortKey = "label" | "count" | "saturation" | "leverage";
type SortDir = "asc" | "desc";

interface SaturationEntry {
  label: string;
  make: string;
  model: string;
  count: number;
  saturation: SaturationLevel;
  leverage: number;
  tip: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSaturation(count: number): SaturationLevel {
  if (count <= 2) return "Low";
  if (count <= 5) return "Moderate";
  if (count <= 10) return "High";
  return "Oversaturated";
}

function getLeverage(level: SaturationLevel): number {
  switch (level) {
    case "Low":
      return 20;
    case "Moderate":
      return 45;
    case "High":
      return 70;
    case "Oversaturated":
      return 95;
  }
}

function getBuyerTip(level: SaturationLevel): string {
  switch (level) {
    case "Low":
      return "Seller has leverage — limited options in market";
    case "Moderate":
      return "Some room to negotiate on price";
    case "High":
      return "You have leverage — push hard on price";
    case "Oversaturated":
      return "Strong buyer market — make aggressive offers";
  }
}

const SATURATION_COLORS: Record<SaturationLevel, string> = {
  Low: "oklch(0.70 0.18 160)",
  Moderate: "oklch(0.75 0.16 65)",
  High: "oklch(0.65 0.18 50)",
  Oversaturated: "oklch(0.60 0.22 25)",
};

const SATURATION_BADGE_CLASSES: Record<SaturationLevel, string> = {
  Low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Moderate: "bg-amber/10 text-amber border-amber/20",
  High: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  Oversaturated:
    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const SATURATION_PROGRESS_CLASSES: Record<SaturationLevel, string> = {
  Low: "[&>div]:bg-emerald-500",
  Moderate: "[&>div]:bg-amber",
  High: "[&>div]:bg-orange-500",
  Oversaturated: "[&>div]:bg-red-500",
};

const SATURATION_ORDER: SaturationLevel[] = [
  "Low",
  "Moderate",
  "High",
  "Oversaturated",
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as SaturationEntry;
  return (
    <div className="bg-popover border border-steel-border rounded-lg px-3 py-2.5 shadow-panel text-xs">
      <p className="font-bold text-foreground mb-1">{d.label}</p>
      <p className="text-muted-foreground">
        Listings: <span className="font-bold text-foreground">{d.count}</span>
      </p>
      <p className="text-muted-foreground">
        Saturation:{" "}
        <span
          className={`font-bold ${
            d.saturation === "Low"
              ? "text-emerald-500"
              : d.saturation === "Moderate"
                ? "text-amber"
                : d.saturation === "High"
                  ? "text-orange-500"
                  : "text-red-500"
          }`}
        >
          {d.saturation}
        </span>
      </p>
      <p className="text-muted-foreground">
        Leverage:{" "}
        <span className="font-bold text-foreground">{d.leverage}%</span>
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketSaturationPage() {
  const { data: allListings = [], isLoading } = useGetAllListings();
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const activeListings = useMemo(
    () => allListings.filter((l: any) => !l.archived),
    [allListings],
  );

  const entries = useMemo<SaturationEntry[]>(() => {
    const map = new Map<
      string,
      { count: number; make: string; model: string }
    >();
    for (const l of activeListings) {
      const key = `${l.make} ${l.model}`;
      if (!map.has(key))
        map.set(key, { count: 0, make: l.make, model: l.model });
      map.get(key)!.count++;
    }
    return Array.from(map.values()).map((v) => {
      const saturation = getSaturation(v.count);
      const leverage = getLeverage(saturation);
      return {
        label: `${v.make} ${v.model}`,
        make: v.make,
        model: v.model,
        count: v.count,
        saturation,
        leverage,
        tip: getBuyerTip(saturation),
      };
    });
  }, [activeListings]);

  const sorted = useMemo(() => {
    const arr = [...entries];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "label") cmp = a.label.localeCompare(b.label);
      else if (sortKey === "count") cmp = a.count - b.count;
      else if (sortKey === "saturation")
        cmp =
          SATURATION_ORDER.indexOf(a.saturation) -
          SATURATION_ORDER.indexOf(b.saturation);
      else if (sortKey === "leverage") cmp = a.leverage - b.leverage;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [entries, sortKey, sortDir]);

  const top10Chart = useMemo(
    () => [...entries].sort((a, b) => b.count - a.count).slice(0, 10),
    [entries],
  );

  const totalCombos = entries.length;
  const highPlusPct =
    entries.length > 0
      ? Math.round(
          (entries.filter(
            (e) => e.saturation === "High" || e.saturation === "Oversaturated",
          ).length /
            entries.length) *
            100,
        )
      : 0;
  const avgLeverage =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.leverage, 0) / entries.length)
      : 0;

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (isLoading) {
    return (
      <div
        className="max-w-screen-xl mx-auto px-4 py-8 space-y-4"
        data-ocid="market_saturation.loading_state"
      >
        {["s1", "s2", "s3", "s4"].map((s) => (
          <div
            key={s}
            className="h-14 bg-surface border border-steel-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 py-8 space-y-8"
      data-ocid="market_saturation.page"
    >
      {/* Header */}
      <PageHeader
        title="Market Saturation"
        description="More listings of the same model means more negotiating leverage for buyers. Use this data to know when to push hard on price."
        icon={<Signal className="w-6 h-6" />}
      />

      {/* Empty state */}
      {activeListings.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="market_saturation.empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
            <Signal className="w-7 h-7 text-amber" />
          </div>
          <h3 className="text-lg font-bold text-foreground font-display mb-1">
            No listings yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Add listings to see market saturation levels and identify where you
            have the most negotiating leverage.
          </p>
          <Link
            to="/add"
            className="px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-bold hover:bg-amber/90 transition-colors flex items-center gap-2"
            data-ocid="market_saturation.add.link"
          >
            <PlusCircle className="w-4 h-4" />
            Add First Listing
          </Link>
        </div>
      )}

      {activeListings.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card
              className="bg-surface border-steel-border"
              data-ocid="market_saturation.summary.card"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-amber" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Make/Model Combos
                  </p>
                </div>
                <p className="text-2xl font-bold font-display text-foreground">
                  {totalCombos}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-surface border-steel-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    High+ Saturation
                  </p>
                </div>
                <p className="text-2xl font-bold font-display text-orange-500 dark:text-orange-400">
                  {highPlusPct}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-surface border-steel-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Avg Buyer Leverage
                  </p>
                </div>
                <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                  {avgLeverage}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart */}
          {top10Chart.length > 0 && (
            <Card className="bg-surface border-steel-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Top {top10Chart.length} Models by Listing Count
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bar color indicates saturation level: green=Low,
                  amber=Moderate, orange=High, red=Oversaturated
                </p>
              </CardHeader>
              <CardContent>
                <div data-ocid="market_saturation.chart_point">
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(280, top10Chart.length * 42)}
                  >
                    <BarChart
                      data={[...top10Chart].reverse()}
                      layout="vertical"
                      margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={130}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "var(--border)", opacity: 0.3 }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {[...top10Chart].reverse().map((entry) => (
                          <Cell
                            key={entry.label}
                            fill={SATURATION_COLORS[entry.saturation]}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {(
              ["Low", "Moderate", "High", "Oversaturated"] as SaturationLevel[]
            ).map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm inline-block"
                  style={{ background: SATURATION_COLORS[level] }}
                />
                <span className="text-muted-foreground">{level}</span>
              </div>
            ))}
          </div>

          {/* Table */}
          <div
            className="rounded-xl border border-steel-border overflow-hidden"
            data-ocid="market_saturation.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-steel-border bg-surface hover:bg-surface">
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("label")}
                    data-ocid="market_saturation.label.toggle"
                  >
                    <div className="flex items-center gap-1">
                      Make / Model
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("count")}
                    data-ocid="market_saturation.count.toggle"
                  >
                    <div className="flex items-center gap-1">
                      Listings
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("saturation")}
                    data-ocid="market_saturation.saturation.toggle"
                  >
                    <div className="flex items-center gap-1">
                      Saturation
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("leverage")}
                    data-ocid="market_saturation.leverage.toggle"
                  >
                    <div className="flex items-center gap-1">
                      Leverage Score
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Buyer Tip
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry, idx) => (
                  <TableRow
                    key={entry.label}
                    className="border-steel-border hover:bg-surface/50"
                    data-ocid={`market_saturation.item.${idx + 1}`}
                  >
                    <TableCell>
                      <span className="font-medium text-amber">
                        {entry.make}
                      </span>{" "}
                      <span className="text-foreground">{entry.model}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-foreground">
                        {entry.count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${SATURATION_BADGE_CLASSES[entry.saturation]}`}
                      >
                        {entry.saturation}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={entry.leverage}
                          className={`h-1.5 flex-1 bg-muted ${SATURATION_PROGRESS_CLASSES[entry.saturation]}`}
                        />
                        <span className="text-xs font-bold text-foreground w-8 text-right">
                          {entry.leverage}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs">
                      {entry.tip}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
