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
  Award,
  ExternalLink,
  Globe,
  PlusCircle,
  Search,
  Upload,
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
import { useGetAllListings } from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtMileage(n: number) {
  return `${new Intl.NumberFormat("en-US").format(n)} mi`;
}

interface SourceSummary {
  source: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
  pctAboveCheapest: number;
  isCheapest: boolean;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as SourceSummary;
  return (
    <div className="bg-popover border border-steel-border rounded-lg px-3 py-2.5 shadow-panel text-xs">
      <p className="font-bold text-foreground mb-1">{d.source}</p>
      <p className="text-muted-foreground">
        Avg:{" "}
        <span className="font-bold text-foreground">
          {fmtCurrency(d.avgPrice)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Range:{" "}
        <span className="text-foreground">
          {fmtCurrency(d.minPrice)} – {fmtCurrency(d.maxPrice)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Listings: <span className="font-bold text-foreground">{d.count}</span>
      </p>
      {d.isCheapest ? (
        <p className="text-emerald-500 font-bold mt-0.5">✓ Cheapest Source</p>
      ) : (
        <p className="text-red-400 mt-0.5">
          +{d.pctAboveCheapest.toFixed(1)}% above cheapest
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CrossMarketPage() {
  const { data: allListings = [], isLoading } = useGetAllListings();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const activeListings = useMemo(
    () => allListings.filter((l: any) => !l.archived),
    [allListings],
  );

  // Unique makes/models from data
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

  const trimsForMakeModel = useMemo(() => {
    const set = new Set<string>();
    for (const l of activeListings)
      if ((!make || l.make === make) && (!model || l.model === model) && l.trim)
        set.add(l.trim);
    return Array.from(set).sort();
  }, [activeListings, make, model]);

  // Filter matching listings
  const matchingListings = useMemo(() => {
    if (!submitted) return [];
    return activeListings
      .filter((l: any) => {
        if (make && l.make !== make) return false;
        if (model && l.model !== model) return false;
        if (trim && l.trim !== trim) return false;
        return true;
      })
      .sort((a: any, b: any) => Number(a.price) - Number(b.price));
  }, [activeListings, make, model, trim, submitted]);

  // Per-source summary
  const sourceSummaries = useMemo<SourceSummary[]>(() => {
    if (!submitted || matchingListings.length === 0) return [];
    const map = new Map<string, { prices: number[] }>();
    for (const l of matchingListings) {
      const src = l.source?.trim() || "Unknown";
      if (!map.has(src)) map.set(src, { prices: [] });
      map.get(src)!.prices.push(Number(l.price));
    }
    const summaries = Array.from(map.entries()).map(([source, { prices }]) => {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      return {
        source,
        avgPrice: avg,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        count: prices.length,
        pctAboveCheapest: 0,
        isCheapest: false,
      };
    });
    const cheapestAvg = Math.min(...summaries.map((s) => s.avgPrice));
    for (const s of summaries) {
      s.isCheapest = s.avgPrice === cheapestAvg;
      s.pctAboveCheapest =
        cheapestAvg > 0 ? ((s.avgPrice - cheapestAvg) / cheapestAvg) * 100 : 0;
    }
    return summaries.sort((a, b) => a.avgPrice - b.avgPrice);
  }, [submitted, matchingListings]);

  const cheapestSource = sourceSummaries.find((s) => s.isCheapest);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (isLoading) {
    return (
      <div
        className="max-w-screen-xl mx-auto px-4 py-8 space-y-4"
        data-ocid="cross_market.loading_state"
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

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 py-8 space-y-8"
      data-ocid="cross_market.page"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber/10 border border-amber/20 shrink-0">
          <Globe className="w-6 h-6 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground uppercase">
            Cross-Market Comparison
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare the same make/model/trim across all sources in your
            listings. Find where prices are lowest and spot over-priced sources
            at a glance.
          </p>
        </div>
      </div>

      {/* No listings at all */}
      {activeListings.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="cross_market.empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
            <Globe className="w-7 h-7 text-amber" />
          </div>
          <h3 className="text-lg font-bold text-foreground font-display mb-1">
            No listings yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Import listings from multiple sources to compare prices across
            markets.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/add"
              className="px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-bold hover:bg-amber/90 transition-colors flex items-center gap-2"
              data-ocid="cross_market.add.link"
            >
              <PlusCircle className="w-4 h-4" />
              Add Listing
            </Link>
            <Link
              to="/import"
              className="px-4 py-2 rounded-lg border border-steel-border bg-surface text-foreground text-sm font-medium hover:border-amber/40 transition-colors flex items-center gap-2"
              data-ocid="cross_market.import.link"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </Link>
          </div>
        </div>
      )}

      {activeListings.length > 0 && (
        <>
          {/* Search Form */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Vehicle to Compare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 items-end"
              >
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="cross-make"
                    className="text-xs text-muted-foreground"
                  >
                    Make
                  </label>
                  <input
                    id="cross-make"
                    list="cross-makes-list"
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g. Toyota"
                    data-ocid="cross_market.make.input"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                  <datalist id="cross-makes-list">
                    {makes.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="cross-model"
                    className="text-xs text-muted-foreground"
                  >
                    Model
                  </label>
                  <input
                    id="cross-model"
                    list="cross-models-list"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Camry"
                    data-ocid="cross_market.model.input"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                  <datalist id="cross-models-list">
                    {modelsForMake.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="cross-trim"
                    className="text-xs text-muted-foreground"
                  >
                    Trim{" "}
                    <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <input
                    id="cross-trim"
                    list="cross-trims-list"
                    type="text"
                    value={trim}
                    onChange={(e) => setTrim(e.target.value)}
                    placeholder="e.g. XLE, LE"
                    data-ocid="cross_market.trim.input"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                  <datalist id="cross-trims-list">
                    {trimsForMakeModel.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <button
                  type="submit"
                  data-ocid="cross_market.primary_button"
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-amber text-zinc-900 text-sm font-bold hover:bg-amber/90 transition-colors whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  Compare
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Pre-submit placeholder */}
          {!submitted && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
                <Globe className="w-7 h-7 text-amber opacity-60" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-display mb-1">
                Compare Prices Across Sources
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Enter a make and model above to see how prices compare across
                all the sources in your listings — Autotrader, CarGurus, private
                sellers, and more.
              </p>
            </div>
          )}

          {/* Results */}
          {submitted && matchingListings.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="cross_market.results.empty_state"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted/20 border border-steel-border flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-display mb-1">
                No listings found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No active listings match{" "}
                <span className="text-amber font-medium">
                  {[make, model, trim].filter(Boolean).join(" ") ||
                    "your search"}
                </span>
                . Try a different make, model, or leave trim empty.
              </p>
            </div>
          )}
          {submitted && matchingListings.length > 0 && (
            <>
              {/* Cheapest Source Callout */}
              {cheapestSource && (
                <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                    <div className="p-3 rounded-xl bg-emerald-500/20">
                      <Award className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                        Cheapest Source for{" "}
                        {[make, model, trim].filter(Boolean).join(" ")}
                      </div>
                      <h2 className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                        {cheapestSource.source}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Average{" "}
                        <span className="font-bold text-foreground">
                          {fmtCurrency(cheapestSource.avgPrice)}
                        </span>{" "}
                        across{" "}
                        <span className="font-bold text-foreground">
                          {cheapestSource.count}
                        </span>{" "}
                        listing
                        {cheapestSource.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                        {fmtCurrency(cheapestSource.minPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lowest price found
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Source Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sourceSummaries.map((src) => (
                  <Card
                    key={src.source}
                    className={`border-2 transition-colors ${
                      src.isCheapest
                        ? "border-emerald-500/30 bg-surface"
                        : "border-steel-border bg-surface"
                    }`}
                    data-ocid="cross_market.source.card"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold border-steel-border text-muted-foreground"
                        >
                          {src.source}
                        </Badge>
                        {src.isCheapest ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                            Cheapest
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                            +{src.pctAboveCheapest.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-display text-foreground">
                          {fmtCurrency(src.avgPrice)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          avg price
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>
                          Range:{" "}
                          <span className="text-foreground">
                            {fmtCurrency(src.minPrice)} –{" "}
                            {fmtCurrency(src.maxPrice)}
                          </span>
                        </div>
                        <div>
                          Listings:{" "}
                          <span className="font-bold text-foreground">
                            {src.count}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bar Chart */}
              {sourceSummaries.length > 1 && (
                <Card className="bg-surface border-steel-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Average Price by Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-56" data-ocid="cross_market.chart_point">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={sourceSummaries}
                          margin={{
                            top: 8,
                            right: 16,
                            bottom: 0,
                            left: 10,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="source"
                            tick={{
                              fontSize: 11,
                              fill: "var(--muted-foreground)",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            tick={{
                              fontSize: 11,
                              fill: "var(--muted-foreground)",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "var(--border)", opacity: 0.3 }}
                          />
                          <Bar
                            dataKey="avgPrice"
                            radius={[4, 4, 0, 0]}
                            name="Avg Price"
                          >
                            {sourceSummaries.map((s) => (
                              <Cell
                                key={s.source}
                                fill={
                                  s.isCheapest
                                    ? "oklch(0.70 0.18 160)"
                                    : "oklch(0.60 0.22 25)"
                                }
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

              {/* Listings Table */}
              <div>
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  All Matching Listings ({matchingListings.length} total —
                  sorted by price)
                </h2>
                <div
                  className="rounded-xl border border-steel-border overflow-hidden"
                  data-ocid="cross_market.table"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="border-steel-border bg-surface hover:bg-surface">
                        <TableHead className="text-xs text-muted-foreground">
                          Make / Model / Trim
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Year
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Mileage
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Price
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Source
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Dealer
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Region
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">
                          Link
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchingListings.map((l: any, idx: number) => (
                        <TableRow
                          key={l.id}
                          className="border-steel-border hover:bg-surface/50"
                          data-ocid={`cross_market.item.${idx + 1}`}
                        >
                          <TableCell>
                            <span className="font-medium text-amber">
                              {l.make}
                            </span>{" "}
                            <span className="text-foreground">{l.model}</span>
                            {l.trim && (
                              <span className="text-muted-foreground text-xs ml-1">
                                {l.trim}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {Number(l.year)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {fmtMileage(Number(l.mileage))}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-foreground">
                              {fmtCurrency(Number(l.price))}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs border-steel-border text-muted-foreground"
                            >
                              {l.source || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-[120px] truncate">
                            {l.dealerName || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {l.region || "—"}
                          </TableCell>
                          <TableCell>
                            {l.listingUrl ? (
                              <a
                                href={l.listingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber hover:text-amber/80 transition-colors"
                                data-ocid={`cross_market.listing.link.${idx + 1}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
