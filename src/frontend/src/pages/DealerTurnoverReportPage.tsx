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
import { Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
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
import { useGetAllListings } from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeDaysOnLot(timestamp: bigint): number {
  const nowNs = Date.now() * 1_000_000;
  const ts = Number(timestamp);
  return Math.max(0, (nowNs - ts) / (1_000_000 * 86_400_000));
}

type TurnoverRating = "Faster" | "On Par" | "Slower" | "Stalled";

function getTurnoverRating(avgDays: number, benchmark: number): TurnoverRating {
  if (benchmark === 0) return "On Par";
  const ratio = avgDays / benchmark;
  if (ratio < 0.8) return "Faster";
  if (ratio <= 1.2) return "On Par";
  if (ratio <= 1.5) return "Slower";
  return "Stalled";
}

function turnoverBadge(rating: TurnoverRating) {
  const styles: Record<TurnoverRating, string> = {
    Faster:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 border",
    "On Par": "bg-amber/15 text-amber border-amber/30 border",
    Slower:
      "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 border",
    Stalled:
      "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 border",
  };
  return <Badge className={`${styles[rating]} text-xs`}>{rating}</Badge>;
}

function fmtDays(n: number) {
  return `${n.toFixed(1)}d`;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, benchmark }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-popover border border-steel-border rounded-lg px-3 py-2.5 shadow-panel text-xs">
      <p className="font-bold text-foreground mb-1">
        {d.make} {d.model}
      </p>
      <p className="text-muted-foreground">
        Avg Days:{" "}
        <span className="text-amber font-bold">{fmtDays(d.avgDaysOnLot)}</span>
      </p>
      <p className="text-muted-foreground">
        Market Benchmark:{" "}
        <span className="text-foreground font-bold">{fmtDays(benchmark)}</span>
      </p>
      <p className="text-muted-foreground">
        Rating:{" "}
        <span className="text-foreground font-bold">
          {getTurnoverRating(d.avgDaysOnLot, benchmark)}
        </span>
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealerTurnoverReportPage() {
  const { data: allListings = [], isLoading } = useGetAllListings();
  const [sortField, setSortField] = useState<string>("avgDaysOnLot");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const activeListings = useMemo(
    () => allListings.filter((l: any) => !l.archived),
    [allListings],
  );

  // Overall benchmark = avg days on lot across ALL listings
  const marketBenchmark = useMemo(() => {
    if (activeListings.length === 0) return 0;
    const total = activeListings.reduce(
      (s: number, l: any) => s + computeDaysOnLot(BigInt(l.timestamp ?? 0)),
      0,
    );
    return total / activeListings.length;
  }, [activeListings]);

  interface TurnoverGroup {
    key: string;
    make: string;
    model: string;
    listingCount: number;
    avgDaysOnLot: number;
    diffDays: number;
    diffPct: number;
    rating: TurnoverRating;
  }

  const groups = useMemo<TurnoverGroup[]>(() => {
    const map = new Map<string, any[]>();
    for (const l of activeListings) {
      const key = `${l.make}__${l.model}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return Array.from(map.entries()).map(([key, listings]) => {
      const [make, model] = key.split("__");
      const avgDaysOnLot =
        listings.reduce(
          (s: number, l: any) => s + computeDaysOnLot(BigInt(l.timestamp ?? 0)),
          0,
        ) / listings.length;
      const diffDays = avgDaysOnLot - marketBenchmark;
      const diffPct =
        marketBenchmark > 0 ? (diffDays / marketBenchmark) * 100 : 0;
      const rating = getTurnoverRating(avgDaysOnLot, marketBenchmark);
      return {
        key,
        make,
        model,
        listingCount: listings.length,
        avgDaysOnLot,
        diffDays,
        diffPct,
        rating,
      };
    });
  }, [activeListings, marketBenchmark]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter(
      (g) =>
        !q ||
        g.make.toLowerCase().includes(q) ||
        g.model.toLowerCase().includes(q),
    );
  }, [groups, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortField];
      const bv = (b as any)[sortField];
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Summary stats
  const fleetAvg =
    groups.length > 0
      ? groups.reduce((s, g) => s + g.avgDaysOnLot, 0) / groups.length
      : 0;
  const fastest = [...groups].sort(
    (a, b) => a.avgDaysOnLot - b.avgDaysOnLot,
  )[0];
  const slowest = [...groups].sort(
    (a, b) => b.avgDaysOnLot - a.avgDaysOnLot,
  )[0];

  // Top 10 for bar chart
  const chartData = [...groups]
    .sort((a, b) => a.avgDaysOnLot - b.avgDaysOnLot)
    .slice(0, 10);

  if (isLoading) {
    return (
      <div
        className="max-w-screen-xl mx-auto px-4 py-8"
        data-ocid="turnover.loading_state"
      >
        <div className="space-y-4">
          {["s1", "s2", "s3", "s4", "s5"].map((s) => (
            <div
              key={s}
              className="h-12 bg-surface border border-steel-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 py-8 space-y-8"
      data-ocid="turnover.page"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber/10 border border-amber/20 shrink-0">
          <RefreshCw className="w-6 h-6 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground uppercase">
            Inventory Turnover Report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            See how fast each model moves vs. the market average. Identify fast
            movers and stalled inventory.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className="bg-surface border-steel-border"
          data-ocid="turnover.summary.card"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-3.5 h-3.5 text-amber" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Fleet Avg
              </p>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">
              {fmtDays(fleetAvg)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Market Benchmark
              </p>
            </div>
            <p className="text-2xl font-bold font-display text-amber">
              {fmtDays(marketBenchmark)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Fastest Moving
              </p>
            </div>
            <p className="text-sm font-bold font-display text-emerald-600 dark:text-emerald-400 truncate">
              {fastest ? `${fastest.make} ${fastest.model}` : "—"}
            </p>
            {fastest && (
              <p className="text-xs text-muted-foreground">
                {fmtDays(fastest.avgDaysOnLot)} avg
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-3.5 h-3.5 text-red-500" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Slowest Moving
              </p>
            </div>
            <p className="text-sm font-bold font-display text-red-500 dark:text-red-400 truncate">
              {slowest ? `${slowest.make} ${slowest.model}` : "—"}
            </p>
            {slowest && (
              <p className="text-xs text-muted-foreground">
                {fmtDays(slowest.avgDaysOnLot)} avg
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="turnover.empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
            <RefreshCw className="w-7 h-7 text-amber" />
          </div>
          <h3 className="text-lg font-bold text-foreground font-display mb-1">
            No listings yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Add listings to see how fast each model moves compared to the market
            average.
          </p>
          <Link
            to="/add"
            className="px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-bold hover:bg-amber/90 transition-colors flex items-center gap-2"
            data-ocid="turnover.add.link"
          >
            <PlusCircle className="w-4 h-4" />
            Add First Listing
          </Link>
        </div>
      )}

      {groups.length > 0 && (
        <>
          {/* Chart */}
          {chartData.length > 0 && (
            <Card className="bg-surface border-steel-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Top {chartData.length} Models — Avg Days on Lot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 50, left: 10, bottom: 4 }}
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
                      dataKey={(d) => `${d.make} ${d.model}`}
                      width={110}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip benchmark={marketBenchmark} />}
                      cursor={{ fill: "var(--border)", opacity: 0.3 }}
                    />
                    <ReferenceLine
                      x={marketBenchmark}
                      stroke="#F59E0B"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{
                        value: "Benchmark",
                        position: "insideTopRight",
                        fontSize: 10,
                        fill: "#F59E0B",
                      }}
                    />
                    <Bar dataKey="avgDaysOnLot" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry) => {
                        const rating = getTurnoverRating(
                          entry.avgDaysOnLot,
                          marketBenchmark,
                        );
                        const colors: Record<TurnoverRating, string> = {
                          Faster: "#10b981",
                          "On Par": "#F59E0B",
                          Slower: "#f97316",
                          Stalled: "#ef4444",
                        };
                        return (
                          <Cell
                            key={entry.key}
                            fill={colors[rating]}
                            fillOpacity={0.8}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search make or model…"
            data-ocid="turnover.search_input"
            className="w-full max-w-sm px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
          />

          {/* Table */}
          <div
            className="rounded-xl border border-steel-border overflow-hidden"
            data-ocid="turnover.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-steel-border bg-surface hover:bg-surface">
                  <TableHead className="text-xs text-muted-foreground">
                    Make / Model
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("listingCount")}
                  >
                    <div className="flex items-center gap-1">
                      Listings
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("avgDaysOnLot")}
                  >
                    <div className="flex items-center gap-1">
                      Avg Days on Lot
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Benchmark
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("diffDays")}
                  >
                    <div className="flex items-center gap-1">
                      Diff (days)
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("diffPct")}
                  >
                    <div className="flex items-center gap-1">
                      Diff (%)
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Rating
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((g, idx) => (
                  <TableRow
                    key={g.key}
                    data-ocid={`turnover.item.${idx + 1}`}
                    className="border-steel-border hover:bg-surface/50"
                  >
                    <TableCell className="font-medium">
                      <span className="text-amber font-bold">{g.make}</span>{" "}
                      <span className="text-foreground">{g.model}</span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {g.listingCount}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {fmtDays(g.avgDaysOnLot)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDays(marketBenchmark)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          g.diffDays < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : g.diffDays > 0
                              ? "text-red-500 dark:text-red-400"
                              : "text-muted-foreground"
                        }
                      >
                        {g.diffDays >= 0 ? "+" : ""}
                        {g.diffDays.toFixed(1)}d
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          g.diffPct < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : g.diffPct > 0
                              ? "text-red-500 dark:text-red-400"
                              : "text-muted-foreground"
                        }
                      >
                        {g.diffPct >= 0 ? "+" : ""}
                        {g.diffPct.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>{turnoverBadge(g.rating)}</TableCell>
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
