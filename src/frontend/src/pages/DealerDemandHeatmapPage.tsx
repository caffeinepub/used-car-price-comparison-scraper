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
import { Flame, MapPin, PlusCircle, Star, TrendingUp } from "lucide-react";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

interface ModelCount {
  label: string;
  make: string;
  model: string;
  count: number;
  avgPrice: number;
  pct: number;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ModelCount;
  return (
    <div className="bg-popover border border-steel-border rounded-lg px-3 py-2.5 shadow-panel text-xs">
      <p className="font-bold text-foreground mb-1">
        {d.make} {d.model}
      </p>
      <p className="text-muted-foreground">
        Listings: <span className="text-amber font-bold">{d.count}</span>
      </p>
      <p className="text-muted-foreground">
        Avg Price:{" "}
        <span className="text-foreground font-bold">
          {fmtCurrency(d.avgPrice)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Market Share:{" "}
        <span className="text-foreground font-bold">{d.pct.toFixed(1)}%</span>
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealerDemandHeatmapPage() {
  const { data: allListings = [], isLoading } = useGetAllListings();
  const [regionFilter, setRegionFilter] = useState("All");

  const activeListings = useMemo(
    () => allListings.filter((l: any) => !l.archived),
    [allListings],
  );

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const l of activeListings) {
      if (l.region) set.add(l.region);
    }
    return ["All", ...Array.from(set).sort()];
  }, [activeListings]);

  const filteredListings = useMemo(() => {
    if (regionFilter === "All") return activeListings;
    return activeListings.filter((l: any) => l.region === regionFilter);
  }, [activeListings, regionFilter]);

  const modelCounts = useMemo<ModelCount[]>(() => {
    const map = new Map<
      string,
      { count: number; prices: number[]; make: string; model: string }
    >();
    for (const l of filteredListings) {
      const key = `${l.make} ${l.model}`;
      if (!map.has(key))
        map.set(key, { count: 0, prices: [], make: l.make, model: l.model });
      const entry = map.get(key)!;
      entry.count++;
      entry.prices.push(Number(l.price));
    }
    const total = filteredListings.length || 1;
    return Array.from(map.values())
      .map((v) => ({
        label: `${v.make} ${v.model}`,
        make: v.make,
        model: v.model,
        count: v.count,
        avgPrice:
          v.prices.reduce((a: number, b: number) => a + b, 0) / v.prices.length,
        pct: (v.count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredListings]);

  const top15 = modelCounts.slice(0, 15).reverse(); // reversed for horizontal bar chart
  const maxCount =
    top15.length > 0 ? Math.max(...top15.map((m) => m.count)) : 1;

  // Summary stats
  const totalModels = modelCounts.length;
  const topModel = modelCounts[0];
  const mostActiveRegion = useMemo(() => {
    if (regionFilter !== "All") return regionFilter;
    const map = new Map<string, number>();
    for (const l of activeListings) {
      if (l.region) map.set(l.region, (map.get(l.region) ?? 0) + 1);
    }
    let best = "";
    let bestCount = 0;
    map.forEach((count, region) => {
      if (count > bestCount) {
        bestCount = count;
        best = region;
      }
    });
    return best || "N/A";
  }, [activeListings, regionFilter]);

  if (isLoading) {
    return (
      <div
        className="max-w-screen-xl mx-auto px-4 py-8"
        data-ocid="demand_heatmap.loading_state"
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
      data-ocid="demand_heatmap.page"
    >
      {/* Header */}
      <PageHeader
        title="Demand Heatmap"
        description="See which makes and models have the highest listing volume — a proxy for market demand and regional interest."
        icon={<Flame className="w-6 h-6" />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card
          className="bg-surface border-steel-border"
          data-ocid="demand_heatmap.summary.card"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Unique Models
              </p>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">
              {totalModels}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-3.5 h-3.5 text-amber" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Top Model
              </p>
            </div>
            <p className="text-lg font-bold font-display text-amber truncate">
              {topModel ? topModel.label : "—"}
            </p>
            {topModel && (
              <p className="text-xs text-muted-foreground">
                {topModel.count} listings
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-amber" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Most Active Region
              </p>
            </div>
            <p className="text-lg font-bold font-display text-foreground truncate">
              {mostActiveRegion}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {activeListings.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="demand_heatmap.empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
            <Flame className="w-7 h-7 text-amber" />
          </div>
          <h3 className="text-lg font-bold text-foreground font-display mb-1">
            No listings yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Add listings to see which makes and models have the highest demand
            in your market.
          </p>
          <Link
            to="/add"
            className="px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-bold hover:bg-amber/90 transition-colors flex items-center gap-2"
            data-ocid="demand_heatmap.add.link"
          >
            <PlusCircle className="w-4 h-4" />
            Add First Listing
          </Link>
        </div>
      )}

      {activeListings.length > 0 && (
        <>
          {/* Region filter */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="demand-region-select"
              className="text-xs text-muted-foreground font-medium"
            >
              Filter by region:
            </label>
            <select
              id="demand-region-select"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              data-ocid="demand_heatmap.region.select"
              className="px-3 py-1.5 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Bar Chart */}
          {top15.length > 0 && (
            <Card className="bg-surface border-steel-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Top {top15.length} Models by Listing Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(300, top15.length * 38)}
                >
                  <BarChart
                    data={top15}
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
                      width={120}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "var(--border)", opacity: 0.3 }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {top15.map((entry) => (
                        <Cell
                          key={entry.label}
                          fill="#F59E0B"
                          fillOpacity={
                            maxCount > 0
                              ? 0.4 + (entry.count / maxCount) * 0.6
                              : 0.6
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Rankings Table */}
          <div
            className="rounded-xl border border-steel-border overflow-hidden"
            data-ocid="demand_heatmap.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-steel-border bg-surface hover:bg-surface">
                  <TableHead className="text-xs text-muted-foreground w-12">
                    Rank
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Make / Model
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Listings
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    % of Total
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Avg Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelCounts.map((item, idx) => (
                  <TableRow
                    key={item.label}
                    data-ocid={`demand_heatmap.item.${idx + 1}`}
                    className="border-steel-border hover:bg-surface/50"
                  >
                    <TableCell>
                      <span
                        className={`text-sm font-bold font-display ${
                          idx === 0
                            ? "text-amber"
                            : idx === 1
                              ? "text-muted-foreground"
                              : idx === 2
                                ? "text-orange-500"
                                : "text-muted-foreground"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="text-amber font-bold">{item.make}</span>{" "}
                      <span className="text-foreground">{item.model}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full bg-amber"
                          style={{
                            width: `${Math.max(4, (item.count / (modelCounts[0]?.count || 1)) * 64)}px`,
                            opacity:
                              0.4 +
                              (item.count / (modelCounts[0]?.count || 1)) * 0.6,
                          }}
                        />
                        <span className="font-bold text-foreground">
                          {item.count}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.pct.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {fmtCurrency(item.avgPrice)}
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
