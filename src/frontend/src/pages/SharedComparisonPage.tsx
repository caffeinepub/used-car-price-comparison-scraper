import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Minus, TrendingDown, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NHTSARecallSection from "../components/NHTSARecallSection";
import PriceStatisticsPanel from "../components/PriceStatisticsPanel";
import {
  useGetAllListings,
  useGetDealScores,
  useGetMileageAdjustedListings,
  useGetPriceTrend,
} from "../hooks/useQueries";

// ─── ATP SVG Logo ──────────────────────────────────────────────────────────────

function ATPLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Auto Track Pro logo"
    >
      <title>Auto Track Pro logo</title>
      <polygon
        points="18,2 33,10 33,26 18,34 3,26 3,10"
        fill="#1C1C2E"
        stroke="#F59E0B"
        strokeWidth="2"
      />
      <text
        x="18"
        y="23"
        textAnchor="middle"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="13"
        fill="#F59E0B"
      >
        ATP
      </text>
    </svg>
  );
}

// ─── Chart Data Type ───────────────────────────────────────────────────────────

interface ChartDataPoint {
  date: string;
  timestamp: number;
  price: number;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SharedComparisonPage() {
  // Parse URL params on mount — no router dependency needed
  const params = new URLSearchParams(window.location.search);
  const make = params.get("make") ?? "";
  const model = params.get("model") ?? "";

  const { data: allListings = [], isLoading: listingsLoading } =
    useGetAllListings();
  const { data: mileageAdjusted = [] } = useGetMileageAdjustedListings(
    make,
    model,
  );
  const { data: priceTrend } = useGetPriceTrend(make, model);

  // Filter to selected make/model, non-archived
  const filteredListings = useMemo(
    () =>
      (allListings as any[]).filter(
        (l) => l.make === make && l.model === model && !l.archived,
      ),
    [allListings, make, model],
  );

  const listingIds = filteredListings.map((l: any) => l.id);
  const { data: dealScores = [] } = useGetDealScores(listingIds);

  const dealScoreMap: Record<string, string> = {};
  for (const d of dealScores as any[]) {
    dealScoreMap[d.listingId] = d.dealRating;
  }

  // Build chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    const sorted = [...filteredListings].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp),
    );
    return sorted.map((l) => {
      const ts = Number(l.timestamp) / 1_000_000;
      const date = new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      });
      return { date, timestamp: ts, price: Number(l.price) };
    });
  }, [filteredListings]);

  const latestYear =
    filteredListings.length > 0
      ? Math.max(...filteredListings.map((l: any) => Number(l.year)))
      : undefined;

  const trendIcon =
    priceTrend === "up" ? (
      <TrendingUp className="w-4 h-4 text-red-400" />
    ) : priceTrend === "down" ? (
      <TrendingDown className="w-4 h-4 text-emerald-400" />
    ) : (
      <Minus className="w-4 h-4 text-amber-400" />
    );

  const trendLabel =
    priceTrend === "up"
      ? "Trending Up"
      : priceTrend === "down"
        ? "Trending Down"
        : "Stable";

  const viewFullAppUrl = `/compare?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;

  // ── Invalid URL state ──────────────────────────────────────────────────────
  if (!make || !model) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Minimal branded header */}
        <header className="border-b border-steel-border bg-background/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <ATPLogo size={32} />
              <span className="font-bold text-sm text-foreground hidden sm:block">
                Auto Track <span className="text-amber-400">Pro</span>
              </span>
            </a>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Invalid Comparison Link
            </h1>
            <p className="text-muted-foreground mb-6">
              Please check the URL or visit Auto Track Pro to generate a new
              shareable report.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-charcoal font-bold text-sm transition-colors"
            >
              Go to Auto Track Pro
            </a>
          </div>
        </main>
      </div>
    );
  }

  // ── Main report ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Minimal branded header */}
      <header className="sticky top-0 z-40 border-b border-steel-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <ATPLogo size={32} />
            <span className="font-bold text-sm text-foreground hidden sm:block">
              Auto Track <span className="text-amber-400">Pro</span>
            </span>
          </a>

          <a
            href={viewFullAppUrl}
            className="shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-charcoal font-bold text-sm transition-colors"
          >
            View Full App
          </a>
        </div>
      </header>

      {/* Report content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Page title */}
          <div>
            <h1 className="text-3xl font-bold font-display text-amber-400">
              {make} {model} — Price Comparison Report
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Public read-only report · Generated by Auto Track Pro
            </p>
          </div>

          {/* Trend badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-steel-border text-sm">
              {trendIcon}
              <span className="text-muted-foreground">{trendLabel}</span>
            </div>
          </div>

          {/* Price History Chart */}
          <div className="card-panel p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Price History — {make} {model}
            </h2>

            {listingsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No price data available for this selection.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={chartData}
                  margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      color: "#e2e8f0",
                    }}
                    formatter={(value: number) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(value)
                    }
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: "#f59e0b" }}
                    name="Price"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Statistics Panel */}
          <PriceStatisticsPanel
            listings={filteredListings}
            make={make}
            model={model}
            dealScores={dealScoreMap}
          />

          {/* Mileage-Adjusted Table */}
          {(mileageAdjusted as any[]).length > 0 && (
            <div className="card-panel p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Mileage-Adjusted Listings
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-steel-border text-muted-foreground">
                      <th className="text-left py-2 pr-4">Year</th>
                      <th className="text-left py-2 pr-4">Trim</th>
                      <th className="text-left py-2 pr-4">Mileage</th>
                      <th className="text-left py-2 pr-4">Price</th>
                      <th className="text-left py-2 pr-4">$/Mile</th>
                      <th className="text-left py-2 pr-4">Source</th>
                      <th className="text-left py-2">Dealer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mileageAdjusted as any[]).map((l: any) => (
                      <tr
                        key={l.id ?? `${l.year}-${l.price}-${l.mileage}`}
                        className="border-b border-steel-border/40 hover:bg-surface/50 transition-colors"
                      >
                        <td className="py-2 pr-4">{String(l.year)}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {l.trim || "—"}
                        </td>
                        <td className="py-2 pr-4">
                          {Number(l.mileage).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 text-amber-400 font-medium">
                          ${Number(l.price).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {l.pricePerMile != null
                            ? `$${Number(l.pricePerMile).toFixed(4)}`
                            : "—"}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {l.source || "—"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {l.dealerName || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NHTSA Recalls & Safety */}
          <NHTSARecallSection
            make={make}
            model={model}
            latestYear={latestYear}
          />

          {/* Footer CTA */}
          <div className="card-panel p-8 text-center space-y-4 border border-amber-500/20 bg-amber-500/5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
              <ATPLogo size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                Want to track your own listings?
              </h3>
              <p className="text-muted-foreground text-sm">
                Try Auto Track Pro free — import your listings, track prices
                over time, and get deal alerts.
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-charcoal font-bold text-sm transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-steel-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ATPLogo size={20} />
            <span>
              © {new Date().getFullYear()} Auto Track Pro — Used Car
              Intelligence
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
