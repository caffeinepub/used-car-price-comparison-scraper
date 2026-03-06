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
  Building2,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Radar,
} from "lucide-react";
import { useMemo, useState } from "react";
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

function varianceBadge(variance: number) {
  if (variance < -5)
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 border text-xs">
        Priced Low
      </Badge>
    );
  if (variance > 5)
    return (
      <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 border text-xs">
        Priced High
      </Badge>
    );
  return (
    <Badge className="bg-amber/15 text-amber border-amber/30 border text-xs">
      On Market
    </Badge>
  );
}

interface MakeModelGroup {
  key: string;
  make: string;
  model: string;
  listings: any[];
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  spread: number;
  listingCount: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealerPricingRadarPage() {
  const { data: allListings = [], isLoading } = useGetAllListings();
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("listingCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const activeListings = useMemo(
    () => allListings.filter((l: any) => !l.archived),
    [allListings],
  );

  const groups = useMemo<MakeModelGroup[]>(() => {
    const map = new Map<string, any[]>();
    for (const l of activeListings) {
      const key = `${l.make}__${l.model}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return Array.from(map.entries()).map(([key, listings]) => {
      const prices = listings.map((l: any) => Number(l.price));
      const avgPrice =
        prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const [make, model] = key.split("__");
      return {
        key,
        make,
        model,
        listings,
        avgPrice,
        minPrice,
        maxPrice,
        spread: maxPrice - minPrice,
        listingCount: listings.length,
      };
    });
  }, [activeListings]);

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
      let av = (a as any)[sortField];
      let bv = (b as any)[sortField];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Summary stats
  const totalMakes = new Set(groups.map((g) => g.make)).size;
  const avgVarianceAll = useMemo(() => {
    if (activeListings.length === 0) return 0;
    const overallAvg =
      activeListings.reduce((s: number, l: any) => s + Number(l.price), 0) /
      activeListings.length;
    const variances = activeListings.map((l: any) =>
      Math.abs(((Number(l.price) - overallAvg) / overallAvg) * 100),
    );
    return (
      variances.reduce((a: number, b: number) => a + b, 0) / variances.length
    );
  }, [activeListings]);

  const listingsBelowMarket = useMemo(() => {
    let count = 0;
    for (const g of groups) {
      for (const l of g.listings) {
        const variance = ((Number(l.price) - g.avgPrice) / g.avgPrice) * 100;
        if (variance < -5) count++;
      }
    }
    return count;
  }, [groups]);

  if (isLoading) {
    return (
      <div
        className="max-w-screen-xl mx-auto px-4 py-8"
        data-ocid="pricing_radar.loading_state"
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
      data-ocid="pricing_radar.page"
    >
      {/* Header */}
      <PageHeader
        title="Competitive Pricing Radar"
        description="Compare your listed prices against market averages for each make/model. Identify under- and over-priced inventory at a glance."
        icon={<Radar className="w-6 h-6" />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card
          className="bg-surface border-steel-border"
          data-ocid="pricing_radar.summary.card"
        >
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Makes Tracked
            </p>
            <p className="text-2xl font-bold font-display text-foreground">
              {totalMakes}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {groups.length} make/model pairs
            </p>
          </CardContent>
        </Card>
        <Card
          className="bg-surface border-steel-border"
          data-ocid="pricing_radar.variance.card"
        >
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Avg Variance
            </p>
            <p className="text-2xl font-bold font-display text-amber">
              ±{avgVarianceAll.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              From market mean
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Below Market
            </p>
            <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {listingsBelowMarket}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Listings priced &gt;5% below avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="pricing_radar.empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-amber" />
          </div>
          <h3 className="text-lg font-bold text-foreground font-display mb-1">
            No listings yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Add some car listings to see how your prices compare to the market
            average.
          </p>
          <Link
            to="/add"
            className="px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-bold hover:bg-amber/90 transition-colors flex items-center gap-2"
            data-ocid="pricing_radar.add.link"
          >
            <PlusCircle className="w-4 h-4" />
            Add First Listing
          </Link>
        </div>
      )}

      {groups.length > 0 && (
        <>
          {/* Search */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make or model…"
              data-ocid="pricing_radar.search_input"
              className="w-full max-w-sm px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
            />
          </div>

          {/* Table */}
          <div
            className="rounded-xl border border-steel-border overflow-hidden"
            data-ocid="pricing_radar.table"
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
                    onClick={() => handleSort("avgPrice")}
                  >
                    <div className="flex items-center gap-1">
                      Avg Price
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Low Price
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    High Price
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("spread")}
                  >
                    <div className="flex items-center gap-1">
                      Price Spread
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((g, idx) => {
                  const isExpanded = expandedKey === g.key;
                  // Overall group status based on spread ratio
                  const spreadRatio =
                    g.avgPrice > 0 ? g.spread / g.avgPrice : 0;
                  const groupVariance =
                    spreadRatio < 0.05 ? 0 : spreadRatio < 0.15 ? 0 : 8;
                  return (
                    <>
                      <TableRow
                        key={g.key}
                        data-ocid={`pricing_radar.item.${idx + 1}`}
                        className="border-steel-border hover:bg-surface/50 cursor-pointer"
                        onClick={() =>
                          setExpandedKey(isExpanded ? null : g.key)
                        }
                      >
                        <TableCell className="font-medium text-foreground">
                          <div>
                            <span className="text-amber font-bold">
                              {g.make}
                            </span>{" "}
                            <span className="text-foreground">{g.model}</span>
                          </div>
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
                          {fmtCurrency(g.spread)}
                        </TableCell>
                        <TableCell>{varianceBadge(groupVariance)}</TableCell>
                        <TableCell>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded drill-down */}
                      {isExpanded &&
                        g.listings.map((listing: any, li: number) => {
                          const price = Number(listing.price);
                          const variance =
                            g.avgPrice > 0
                              ? ((price - g.avgPrice) / g.avgPrice) * 100
                              : 0;
                          return (
                            <TableRow
                              key={`${g.key}-${li}`}
                              className="border-steel-border bg-background/40"
                            >
                              <TableCell className="pl-8 text-muted-foreground text-xs">
                                {listing.dealerName || listing.source || "—"}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {listing.year ? Number(listing.year) : "—"}
                              </TableCell>
                              <TableCell className="font-bold text-foreground text-sm">
                                {fmtCurrency(price)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                Market avg: {fmtCurrency(g.avgPrice)}
                              </TableCell>
                              <TableCell className="text-xs">
                                <span
                                  className={
                                    variance < 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : variance > 0
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                  }
                                >
                                  {variance >= 0 ? "+" : ""}
                                  {variance.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell>{listing.trim || "—"}</TableCell>
                              <TableCell>{varianceBadge(variance)}</TableCell>
                              <TableCell />
                            </TableRow>
                          );
                        })}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
