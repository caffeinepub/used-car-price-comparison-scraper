import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Layers, Search, TrendingUp } from "lucide-react";
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
import type { CrossModelResult } from "../backend";
import { useCrossModelSearch } from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

interface TrimGroup {
  trim: string;
  avgPrice: number;
  count: number;
  premiumPct: number;
  premiumDollar: number;
}

function groupByTrim(
  listings: CrossModelResult[],
  make: string,
  model: string,
): TrimGroup[] {
  const m = make.trim().toLowerCase();
  const mo = model.trim().toLowerCase();
  const filtered = listings.filter(
    (l) => l.make.toLowerCase() === m && l.model.toLowerCase() === mo,
  );
  if (!filtered.length) return [];

  const groups: Record<string, number[]> = {};
  for (const l of filtered) {
    const t = l.trim || "Base";
    if (!groups[t]) groups[t] = [];
    groups[t].push(Number(l.price));
  }

  const result: Omit<TrimGroup, "premiumPct" | "premiumDollar">[] =
    Object.entries(groups).map(([trim, prices]) => ({
      trim,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      count: prices.length,
    }));

  result.sort((a, b) => a.avgPrice - b.avgPrice);
  const basePrice = result[0]?.avgPrice ?? 0;

  return result.map((g) => ({
    ...g,
    premiumPct:
      basePrice > 0
        ? Math.round(((g.avgPrice - basePrice) / basePrice) * 100)
        : 0,
    premiumDollar: g.avgPrice - basePrice,
  }));
}

function getVerdict(premiumPct: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (premiumPct <= 5)
    return {
      label: "Great Value",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/15 border-emerald-500/30",
    };
  if (premiumPct <= 15)
    return {
      label: "Moderate Premium",
      color: "text-amber",
      bg: "bg-amber/15 border-amber/30",
    };
  if (premiumPct <= 30)
    return {
      label: "High Premium — Evaluate Features",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/15 border-orange-500/30",
    };
  return {
    label: "Likely Overpriced for Trim",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/15 border-red-500/30",
  };
}

// ─── Custom Bar Tooltip ───────────────────────────────────────────────────────

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
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <div className="font-bold text-foreground">{label}</div>
      <div className="text-muted-foreground">
        Avg Price:{" "}
        <span className="font-bold text-amber">
          {fmtCurrency(payload[0].value)}
        </span>
      </div>
    </div>
  );
}

// ─── Trim Card ────────────────────────────────────────────────────────────────

function TrimCard({ group, index }: { group: TrimGroup; index: number }) {
  const verdict = getVerdict(group.premiumPct);
  const isBase = group.premiumPct === 0;

  return (
    <Card
      className={`bg-surface border-steel-border relative overflow-hidden transition-all hover:border-amber/30 ${isBase ? "border-amber/30" : ""}`}
      data-ocid={`trim.card.${index + 1}`}
    >
      {isBase && (
        <div className="absolute top-3 right-3">
          <Badge className="text-xs bg-amber/15 text-amber border-amber/30 border">
            Base Trim
          </Badge>
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 pr-14">
          <h3 className="font-bold text-foreground font-display text-base uppercase tracking-wide leading-tight">
            {group.trim}
          </h3>
          <Badge
            className={`text-xs ${verdict.bg} ${verdict.color} border shrink-0`}
          >
            {group.count} listing{group.count !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="text-2xl font-bold text-amber font-display">
          {fmtCurrency(group.avgPrice)}
        </div>

        {!isBase && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">
                +{fmtCurrency(group.premiumDollar)}
              </span>{" "}
              ({group.premiumPct}% premium over base)
            </span>
          </div>
        )}

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${verdict.bg} ${verdict.color}`}
        >
          {verdict.label}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrimAnalyzerPage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [submittedMake, setSubmittedMake] = useState("");
  const [submittedModel, setSubmittedModel] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch all listings — 999999 budget/mileage to get everything
  const { data: allListings, isLoading } = useCrossModelSearch(999999, 999999);

  const trimGroups = useMemo(() => {
    if (!allListings || !submittedMake || !submittedModel) return [];
    return groupByTrim(allListings, submittedMake, submittedModel);
  }, [allListings, submittedMake, submittedModel]);

  const barData = trimGroups.map((g) => ({
    name: g.trim.length > 14 ? `${g.trim.slice(0, 12)}…` : g.trim,
    fullName: g.trim,
    price: g.avgPrice,
  }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) return;
    setSubmittedMake(make.trim());
    setSubmittedModel(model.trim());
    setHasSearched(true);
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber/10 border border-amber/20 shrink-0">
          <Layers className="w-6 h-6 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground uppercase">
            Trim-Level Value Analyzer
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Is the premium trim worth the extra cost? Compare average prices by
            trim level based on actual market listings.
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-surface border-steel-border">
        <CardContent className="p-5">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="trim-make"
                className="text-xs text-muted-foreground"
              >
                Make
              </label>
              <input
                id="trim-make"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Toyota"
                data-ocid="trim.make.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="trim-model"
                className="text-xs text-muted-foreground"
              >
                Model
              </label>
              <input
                id="trim-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. RAV4"
                data-ocid="trim.model.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!make.trim() || !model.trim() || isLoading}
                data-ocid="trim.primary_button"
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-amber text-zinc-900 text-sm font-bold hover:bg-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Analyze Trims
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="trim.loading_state"
        >
          {Array.from({ length: 4 }, (_, i) => `sk-${i}`).map((k) => (
            <div
              key={k}
              className="bg-surface border border-steel-border rounded-xl p-4 space-y-3"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-36 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading &&
        hasSearched &&
        (trimGroups.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            data-ocid="trim.empty_state"
          >
            <div className="p-4 rounded-full bg-amber/10 border border-amber/20">
              <Car className="w-8 h-8 text-amber/60" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground font-display uppercase">
                No Listings Found
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                No listings for{" "}
                <strong>
                  {submittedMake} {submittedModel}
                </strong>{" "}
                in your data. Try adding listings for this make/model first.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Bar Chart */}
            {trimGroups.length > 1 && (
              <Card className="bg-surface border-steel-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
                    Average Price by Trim — {submittedMake} {submittedModel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52" data-ocid="trim.chart_point">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barData}
                        layout="vertical"
                        margin={{ top: 4, right: 60, bottom: 4, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--steel-border)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 11,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 11,
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                          {barData.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={
                                index === 0
                                  ? "oklch(0.75 0.16 65)"
                                  : `oklch(${0.65 - index * 0.04} 0.15 200)`
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trim Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground font-display uppercase tracking-wider">
                  Trim Comparison — {trimGroups.length} trim
                  {trimGroups.length !== 1 ? "s" : ""} found
                </h2>
              </div>

              {/* Verdict Legend */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  0–5% premium: Great Value
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber/10 border border-amber/20 text-amber">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                  5–15%: Moderate Premium
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  15–30%: High Premium
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  30%+: Likely Overpriced
                </span>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2"
                data-ocid="trim.list"
              >
                {trimGroups.map((group, i) => (
                  <TrimCard key={group.trim} group={group} index={i} />
                ))}
              </div>
            </div>
          </>
        ))}

      {/* Pre-search prompt */}
      {!hasSearched && !isLoading && (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          data-ocid="trim.empty_state"
        >
          <div className="p-4 rounded-full bg-amber/10 border border-amber/20">
            <Layers className="w-8 h-8 text-amber/70" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground font-display uppercase tracking-wide">
              Enter a Make and Model to Start
            </p>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              We'll analyze all your listings for that model, group them by trim
              level, and show you whether the premium is worth it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
