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
import { ArrowUpDown, PlusCircle, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetAllListings } from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type RetentionLevel =
  | "Holds Value"
  | "Moderate"
  | "High Volatility"
  | "Depreciating Fast";

function getRetentionLevel(spreadRatio: number): RetentionLevel {
  if (spreadRatio < 0.1) return "Holds Value";
  if (spreadRatio < 0.25) return "Moderate";
  if (spreadRatio < 0.4) return "High Volatility";
  return "Depreciating Fast";
}

function retentionBadge(level: RetentionLevel) {
  const styles: Record<RetentionLevel, string> = {
    "Holds Value":
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 border",
    Moderate: "bg-amber/15 text-amber border-amber/30 border",
    "High Volatility":
      "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 border",
    "Depreciating Fast":
      "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 border",
  };
  return (
    <Badge className={`${styles[level]} text-xs whitespace-nowrap`}>
      {level}
    </Badge>
  );
}

// ─── Custom Scatter Tooltip ───────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-popover border border-steel-border rounded-lg px-3 py-2.5 shadow-panel text-xs max-w-[200px]">
      <p className="font-bold text-foreground mb-1">
        {d.make} {d.model} — {d.trim || "Base"}
      </p>
      <p className="text-muted-foreground">
        Avg Price:{" "}
        <span className="text-foreground font-bold">
          {fmtCurrency(d.avgPrice)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Spread Ratio:{" "}
        <span className="text-amber font-bold">
          {(d.spreadRatio * 100).toFixed(1)}%
        </span>
      </p>
      <p className="text-muted-foreground">
        Rating:{" "}
        <span className="text-foreground font-bold">
          {getRetentionLevel(d.spreadRatio)}
        </span>
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealerPriceElasticityPage() {
  const { data: allListings = [], isLoading } = useGetAllListings();
  const [makeFilter, setMakeFilter] = useState("All");
  const [sortField, setSortField] = useState<string>("spreadRatio");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const activeListings = useMemo(
    () => allListings.filter((l: any) => !l.archived),
    [allListings],
  );

  const distinctMakes = useMemo(() => {
    const set = new Set<string>();
    for (const l of activeListings) if (l.make) set.add(l.make);
    return ["All", ...Array.from(set).sort()];
  }, [activeListings]);

  interface TrimGroup {
    key: string;
    make: string;
    model: string;
    trim: string;
    listingCount: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    priceSpread: number;
    spreadRatio: number;
    retentionLevel: RetentionLevel;
    x: number; // avgPrice for scatter
    y: number; // spreadRatio for scatter
  }

  const groups = useMemo<TrimGroup[]>(() => {
    const map = new Map<string, any[]>();
    for (const l of activeListings) {
      const key = `${l.make}__${l.model}__${l.trim ?? ""}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return Array.from(map.entries()).map(([key, listings]) => {
      const [make, model, trim] = key.split("__");
      const prices = listings.map((l: any) => Number(l.price));
      const avgPrice =
        prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceSpread = maxPrice - minPrice;
      const spreadRatio = avgPrice > 0 ? priceSpread / avgPrice : 0;
      const retentionLevel = getRetentionLevel(spreadRatio);
      return {
        key,
        make,
        model,
        trim: trim || "",
        listingCount: listings.length,
        avgPrice,
        minPrice,
        maxPrice,
        priceSpread,
        spreadRatio,
        retentionLevel,
        x: avgPrice,
        y: spreadRatio,
      };
    });
  }, [activeListings]);

  const filtered = useMemo(() => {
    let list = groups;
    if (makeFilter !== "All") list = list.filter((g) => g.make === makeFilter);
    const q = search.toLowerCase();
    if (q)
      list = list.filter(
        (g) =>
          g.make.toLowerCase().includes(q) ||
          g.model.toLowerCase().includes(q) ||
          g.trim.toLowerCase().includes(q),
      );
    return list;
  }, [groups, makeFilter, search]);

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
  const totalTrimVariants = groups.length;
  const mostStable = [...groups].sort(
    (a, b) => a.spreadRatio - b.spreadRatio,
  )[0];
  const mostVolatile = [...groups].sort(
    (a, b) => b.spreadRatio - a.spreadRatio,
  )[0];
  const avgSpreadRatio =
    groups.length > 0
      ? groups.reduce((s, g) => s + g.spreadRatio, 0) / groups.length
      : 0;

  // Color per retention level for scatter
  const dotColor: Record<RetentionLevel, string> = {
    "Holds Value": "#10b981",
    Moderate: "#F59E0B",
    "High Volatility": "#f97316",
    "Depreciating Fast": "#ef4444",
  };

  if (isLoading) {
    return (
      <div
        className="max-w-screen-xl mx-auto px-4 py-8"
        data-ocid="price_elasticity.loading_state"
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
      data-ocid="price_elasticity.page"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber/10 border border-amber/20 shrink-0">
          <TrendingDown className="w-6 h-6 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground uppercase">
            Price Elasticity by Trim
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover which trims hold their value best and which depreciate
            fastest based on price spread across your listings.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className="bg-surface border-steel-border"
          data-ocid="price_elasticity.summary.card"
        >
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Trim Variants
            </p>
            <p className="text-2xl font-bold font-display text-foreground">
              {totalTrimVariants}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Most Stable
            </p>
            <p className="text-sm font-bold font-display text-emerald-600 dark:text-emerald-400 truncate">
              {mostStable
                ? `${mostStable.make} ${mostStable.model}${mostStable.trim ? ` — ${mostStable.trim}` : ""}`
                : "—"}
            </p>
            {mostStable && (
              <p className="text-xs text-muted-foreground">
                {(mostStable.spreadRatio * 100).toFixed(1)}% spread
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Most Volatile
            </p>
            <p className="text-sm font-bold font-display text-red-500 dark:text-red-400 truncate">
              {mostVolatile
                ? `${mostVolatile.make} ${mostVolatile.model}${mostVolatile.trim ? ` — ${mostVolatile.trim}` : ""}`
                : "—"}
            </p>
            {mostVolatile && (
              <p className="text-xs text-muted-foreground">
                {(mostVolatile.spreadRatio * 100).toFixed(1)}% spread
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Avg Spread Ratio
            </p>
            <p className="text-2xl font-bold font-display text-amber">
              {(avgSpreadRatio * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="price_elasticity.empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
            <TrendingDown className="w-7 h-7 text-amber" />
          </div>
          <h3 className="text-lg font-bold text-foreground font-display mb-1">
            No listings yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Add listings with different trims to see which trims hold value best
            across your inventory.
          </p>
          <Link
            to="/add"
            className="px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-bold hover:bg-amber/90 transition-colors flex items-center gap-2"
            data-ocid="price_elasticity.add.link"
          >
            <PlusCircle className="w-4 h-4" />
            Add First Listing
          </Link>
        </div>
      )}

      {groups.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make, model, trim…"
              data-ocid="price_elasticity.search_input"
              className="w-full sm:max-w-xs px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="elasticity-make-select"
                className="text-xs text-muted-foreground"
              >
                Make:
              </label>
              <select
                id="elasticity-make-select"
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                data-ocid="price_elasticity.make.select"
                className="px-3 py-1.5 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
              >
                {distinctMakes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scatter chart */}
          {filtered.length > 1 && (
            <Card className="bg-surface border-steel-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Price vs. Volatility — Trim Scatter
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Higher Y = more volatile. Lower right = expensive but stable.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  {(
                    [
                      "Holds Value",
                      "Moderate",
                      "High Volatility",
                      "Depreciating Fast",
                    ] as RetentionLevel[]
                  ).map((level) => (
                    <div key={level} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: dotColor[level] }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {level}
                      </span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Avg Price"
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Avg Price",
                        position: "insideBottom",
                        offset: -5,
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Spread Ratio"
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Spread %",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                      }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ strokeDasharray: "3 3" }}
                    />
                    <Scatter
                      data={filtered}
                      shape={(props: any) => {
                        const level = getRetentionLevel(props.payload.y ?? 0);
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={5}
                            fill={dotColor[level]}
                            fillOpacity={0.85}
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <div
            className="rounded-xl border border-steel-border overflow-hidden"
            data-ocid="price_elasticity.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-steel-border bg-surface hover:bg-surface">
                  <TableHead className="text-xs text-muted-foreground">
                    Make
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Model
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Trim
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
                    onClick={() => handleSort("avgPrice")}
                  >
                    <div className="flex items-center gap-1">
                      Avg Price
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Min Price
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Max Price
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("priceSpread")}
                  >
                    <div className="flex items-center gap-1">
                      Spread ($)
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("spreadRatio")}
                  >
                    <div className="flex items-center gap-1">
                      Spread (%)
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Value Retention
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((g, idx) => (
                  <TableRow
                    key={g.key}
                    data-ocid={`price_elasticity.item.${idx + 1}`}
                    className="border-steel-border hover:bg-surface/50"
                  >
                    <TableCell className="text-amber font-bold">
                      {g.make}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {g.model}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {g.trim || "—"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {g.listingCount}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {fmtCurrency(g.avgPrice)}
                    </TableCell>
                    <TableCell className="text-emerald-600 dark:text-emerald-400">
                      {fmtCurrency(g.minPrice)}
                    </TableCell>
                    <TableCell className="text-red-500 dark:text-red-400">
                      {fmtCurrency(g.maxPrice)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtCurrency(g.priceSpread)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          g.spreadRatio < 0.1
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : g.spreadRatio > 0.25
                              ? "text-red-500 dark:text-red-400 font-bold"
                              : "text-amber font-bold"
                        }
                      >
                        {(g.spreadRatio * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>{retentionBadge(g.retentionLevel)}</TableCell>
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
