import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Car, ChevronRight, DollarSign, Globe, MapPin } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
// Local type definition (matches backend RegionalBreakdown)
interface RegionalBreakdown {
  region: string;
  listingCount: bigint;
  avgPrice: number;
  sources: string[];
}
import { useActor } from "../hooks/useActor";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Query hook ───────────────────────────────────────────────────────────────

function useGetRegionalBreakdown() {
  const { actor, isFetching } = useActor();
  return useQuery<RegionalBreakdown[]>({
    queryKey: ["regionalBreakdown"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getRegionalBreakdown();
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="card-panel flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <p className="text-xs text-muted-text uppercase tracking-wider font-medium">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground font-display mt-0.5">
          {value}
        </p>
        {subtext && <p className="text-xs text-muted-text mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="card-panel flex items-start gap-4">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-7 w-32 rounded" />
      </div>
    </div>
  );
}

function SourceChips({ sources }: { sources: string[] }) {
  const MAX_VISIBLE = 3;
  const visible = sources.slice(0, MAX_VISIBLE);
  const overflow = sources.length - MAX_VISIBLE;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((src) => (
        <span
          key={src}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber/10 text-amber-700 dark:text-amber-400 border border-amber/20"
        >
          {src}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-muted-text border border-steel-border">
          +{overflow} more
        </span>
      )}
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function RegionalBarChart({ data }: { data: RegionalBreakdown[] }) {
  const maxCount = Math.max(...data.map((d) => Number(d.listingCount)), 1);

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const count = Number(item.listingCount);
        const widthPct = Math.max((count / maxCount) * 100, 2);
        return (
          <div key={item.region} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-muted-text w-5 shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  {item.region || "Unknown"}
                </span>
              </div>
              <span className="text-xs text-muted-text shrink-0 ml-3">
                {count} listing{count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-steel-border">
              <div
                className="h-full rounded-full bg-amber-500 dark:bg-amber-400 transition-all duration-500 ease-out group-hover:bg-amber-600 dark:group-hover:bg-amber-300"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }, (_, i) => ({
        key: `skeleton-${i}`,
        pct: 80 - i * 10,
      })).map(({ key, pct }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton
            className="h-2 w-full rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Rankings Table ───────────────────────────────────────────────────────────

function RegionTable({ data }: { data: RegionalBreakdown[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-steel-border">
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-text uppercase tracking-wider w-8">
              #
            </th>
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-text uppercase tracking-wider">
              Region
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-muted-text uppercase tracking-wider">
              Listings
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-muted-text uppercase tracking-wider">
              Avg Price
            </th>
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-text uppercase tracking-wider">
              Sources
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={item.region}
              className="border-b border-steel-border/50 hover:bg-amber-500/5 transition-colors"
            >
              <td className="py-3 px-3 text-muted-text font-mono text-xs">
                {idx + 1}
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500/60 dark:text-amber-400/60 shrink-0" />
                  <span className="font-medium text-foreground">
                    {item.region || "Unknown"}
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 text-right">
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-700 dark:text-amber-400 font-mono"
                >
                  {Number(item.listingCount)}
                </Badge>
              </td>
              <td className="py-3 px-3 text-right font-semibold text-foreground">
                {item.avgPrice > 0 ? formatCurrency(item.avgPrice) : "—"}
              </td>
              <td className="py-3 px-3">
                <SourceChips sources={item.sources} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key) => (
        <Skeleton key={key} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-5">
        <Globe className="w-8 h-8 text-amber-500/60 dark:text-amber-400/60" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-2">
        No Regional Data Yet
      </h3>
      <p className="text-muted-text text-sm max-w-sm mb-6">
        Regional breakdown appears once your listings have a{" "}
        <span className="text-foreground font-medium">Region</span> field filled
        in (e.g. "Texas", "CA", "Florida"). Add listings with region data to see
        a geographic breakdown.
      </p>
      <Link
        to="/add"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber/10 border border-amber/30 text-amber-700 dark:text-amber-400 text-sm font-semibold hover:bg-amber/20 transition-colors"
      >
        <Car className="w-4 h-4" />
        Add a Listing
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegionalBreakdownPage() {
  const { data, isLoading } = useGetRegionalBreakdown();

  const sorted = useMemo(
    () =>
      (data ?? [])
        .slice()
        .sort((a, b) => Number(b.listingCount) - Number(a.listingCount)),
    [data],
  );

  const stats = useMemo(() => {
    if (!sorted.length)
      return { totalRegions: 0, totalListings: 0, weightedAvgPrice: 0 };
    const totalListings = sorted.reduce(
      (s, r) => s + Number(r.listingCount),
      0,
    );
    const weightedSum = sorted.reduce(
      (s, r) => s + r.avgPrice * Number(r.listingCount),
      0,
    );
    return {
      totalRegions: sorted.length,
      totalListings,
      weightedAvgPrice: totalListings > 0 ? weightedSum / totalListings : 0,
    };
  }, [sorted]);

  return (
    <div className="min-h-screen bg-surface px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h1 className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                Regional Breakdown
              </h1>
            </div>
            <p className="text-muted-text text-sm">
              Geographic distribution of listings by dealer state or region
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={Globe}
                label="Total Regions"
                value={stats.totalRegions}
                subtext="unique regions with listings"
              />
              <StatCard
                icon={Car}
                label="Total Listings"
                value={stats.totalListings.toLocaleString()}
                subtext="across all regions"
              />
              <StatCard
                icon={DollarSign}
                label="Overall Avg Price"
                value={
                  stats.weightedAvgPrice > 0
                    ? formatCurrency(stats.weightedAvgPrice)
                    : "—"
                }
                subtext="weighted by listing count"
              />
            </>
          )}
        </div>

        {/* Bar Chart */}
        <section className="card-panel">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Listings by Region
            </h2>
          </div>
          {isLoading ? (
            <BarChartSkeleton />
          ) : sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <RegionalBarChart data={sorted} />
          )}
        </section>

        {/* Rankings Table */}
        {!isLoading && sorted.length > 0 && (
          <section className="card-panel">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                Region Rankings
              </h2>
              <span className="text-xs text-muted-text ml-1">
                sorted by listing volume
              </span>
            </div>
            <RegionTable data={sorted} />
          </section>
        )}

        {/* Skeleton for rankings table */}
        {isLoading && (
          <section className="card-panel">
            <div className="flex items-center gap-2 mb-5">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-44 rounded" />
            </div>
            <TableSkeleton />
          </section>
        )}
      </div>
    </div>
  );
}
