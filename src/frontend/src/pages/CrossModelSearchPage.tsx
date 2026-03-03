import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  DollarSign,
  ExternalLink,
  Gauge,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  TrendingDown,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { CrossModelResult } from "../hooks/useQueries";
import { useCrossModelSearch } from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtMileage = (n: number) => new Intl.NumberFormat("en-US").format(n);

const fmtPricePerMile = (ppm: number) => {
  if (ppm <= 0) return "—";
  return `$${ppm.toFixed(4)}`;
};

/**
 * Normalise a raw dealScore string from the backend.
 * Missing or empty values are treated as 'Fair'.
 */
function normaliseDealScore(
  score: string,
): "Good Deal" | "Fair" | "Overpriced" {
  if (score === "Good Deal") return "Good Deal";
  if (score === "Overpriced") return "Overpriced";
  return "Fair";
}

// ─── Deal Score Badge ─────────────────────────────────────────────────────────

function DealBadge({ score }: { score: string }) {
  const normalised = normaliseDealScore(score);

  if (normalised === "Good Deal") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block" />
        Good Deal
      </span>
    );
  }
  if (normalised === "Overpriced") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 inline-block" />
        Overpriced
      </span>
    );
  }
  // 'Fair' (including empty / unknown)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber/15 text-amber border border-amber/25">
      <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
      Fair
    </span>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ listing }: { listing: CrossModelResult }) {
  const price = Number(listing.price);
  const mileage = Number(listing.mileage);
  const year = Number(listing.year);
  const normalised = normaliseDealScore(listing.dealScore);

  return (
    <div
      className={`bg-surface border rounded-xl p-4 flex flex-col gap-3 transition-all hover:border-amber/30 hover:shadow-amber-glow/10 ${
        normalised === "Good Deal"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : normalised === "Overpriced"
            ? "border-red-500/20"
            : "border-steel-border"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground font-rajdhani text-base uppercase tracking-wide truncate">
            {year} {listing.make} {listing.model}
          </h3>
          {listing.trim && (
            <p className="text-xs text-muted-text truncate">{listing.trim}</p>
          )}
        </div>
        <DealBadge score={listing.dealScore} />
      </div>

      {/* Price */}
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-amber shrink-0" />
        <span className="text-xl font-bold text-amber font-rajdhani">
          {fmtCurrency(price)}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted-text">
          <Gauge className="w-3.5 h-3.5 shrink-0" />
          <span>{mileage > 0 ? `${fmtMileage(mileage)} mi` : "N/A"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-text">
          <TrendingDown className="w-3.5 h-3.5 shrink-0" />
          <span>{fmtPricePerMile(listing.pricePerMile)}/mi</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-text">
          <Tag className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{listing.source || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-text">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{listing.dealerName || "—"}</span>
        </div>
      </div>

      {/* Condition */}
      {listing.condition && (
        <div className="text-xs text-muted-text">
          Condition:{" "}
          <span className="text-foreground capitalize">
            {listing.condition}
          </span>
        </div>
      )}

      {/* Link */}
      {listing.listingUrl && (
        <a
          href={listing.listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-amber hover:text-amber/80 transition-colors mt-auto"
        >
          <ExternalLink className="w-3 h-3" />
          View Listing
        </a>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
        <div
          key={key}
          className="bg-surface border border-steel-border rounded-xl p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-28" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  count,
  color,
  highlighted,
}: {
  label: string;
  count: number;
  color: "emerald" | "amber" | "red";
  highlighted?: boolean;
}) {
  const colorMap = {
    emerald:
      "text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    amber: "text-amber border-amber/30 bg-amber/10",
    red: "text-red-700 dark:text-red-400 border-red-500/30 bg-red-500/10",
  };
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${colorMap[color]} mb-3 ${
        highlighted ? "shadow-sm" : ""
      }`}
    >
      {highlighted && (
        <Star className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
      )}
      <span
        className={`text-sm font-bold font-rajdhani uppercase tracking-wider ${colorMap[color].split(" ")[0]}`}
      >
        {label}
      </span>
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${colorMap[color]}`}
      >
        {count} listing{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ─── Sort by price ascending ──────────────────────────────────────────────────

function sortByPriceAsc(arr: CrossModelResult[]): CrossModelResult[] {
  return [...arr].sort((a, b) => Number(a.price) - Number(b.price));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CrossModelSearchPage() {
  const [budgetInput, setBudgetInput] = useState("");
  const [mileageInput, setMileageInput] = useState("");
  const [textFilter, setTextFilter] = useState("");
  const [submittedBudget, setSubmittedBudget] = useState(0);
  const [submittedMileage, setSubmittedMileage] = useState(0);

  const hasSearched = submittedBudget > 0 && submittedMileage > 0;

  const {
    data: results,
    isLoading,
    isFetching,
  } = useCrossModelSearch(submittedBudget, submittedMileage);

  // Client-side text filter — preserves backend tier+price ordering
  const filteredResults = useMemo(() => {
    if (!results) return [];
    if (!textFilter.trim()) return results;
    const q = textFilter.trim().toLowerCase();
    return results.filter(
      (r) =>
        r.make.toLowerCase().includes(q) || r.model.toLowerCase().includes(q),
    );
  }, [results, textFilter]);

  /**
   * Group by normalised deal score tier.
   * - 'Good Deal'  → emerald section (highlighted)
   * - 'Fair' or empty/unknown → amber section
   * - 'Overpriced' → red section
   * Within each tier, sort by price ascending (client-side guarantee).
   */
  const goodDeals = useMemo(
    () =>
      sortByPriceAsc(
        filteredResults.filter(
          (r) => normaliseDealScore(r.dealScore) === "Good Deal",
        ),
      ),
    [filteredResults],
  );
  const fairDeals = useMemo(
    () =>
      sortByPriceAsc(
        filteredResults.filter(
          (r) => normaliseDealScore(r.dealScore) === "Fair",
        ),
      ),
    [filteredResults],
  );
  const overpriced = useMemo(
    () =>
      sortByPriceAsc(
        filteredResults.filter(
          (r) => normaliseDealScore(r.dealScore) === "Overpriced",
        ),
      ),
    [filteredResults],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const budget = Number.parseFloat(budgetInput.replace(/[^0-9.]/g, ""));
    const mileage = Number.parseInt(mileageInput.replace(/[^0-9]/g, ""), 10);
    if (!budget || !mileage || budget <= 0 || mileage <= 0) return;
    setSubmittedBudget(budget);
    setSubmittedMileage(mileage);
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") {
      setBudgetInput("");
      return;
    }
    const num = Number.parseInt(raw, 10);
    setBudgetInput(new Intl.NumberFormat("en-US").format(num));
  };

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") {
      setMileageInput("");
      return;
    }
    const num = Number.parseInt(raw, 10);
    setMileageInput(new Intl.NumberFormat("en-US").format(num));
  };

  const budgetNum = Number.parseFloat(budgetInput.replace(/[^0-9.]/g, "")) || 0;
  const mileageNum =
    Number.parseInt(mileageInput.replace(/[^0-9]/g, ""), 10) || 0;
  const canSearch = budgetNum > 0 && mileageNum > 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber/10 border border-amber/20">
          <Search className="w-5 h-5 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-rajdhani tracking-wide text-foreground uppercase">
            Cross-Model Search
          </h1>
          <p className="text-sm text-muted-text">
            Find the best deals across all makes and models within your budget
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-surface border border-steel-border rounded-xl p-5">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Max Budget */}
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="cross-budget"
                className="text-xs font-medium text-muted-text uppercase tracking-wider flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Max Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text text-sm pointer-events-none">
                  $
                </span>
                <input
                  id="cross-budget"
                  type="text"
                  inputMode="numeric"
                  value={budgetInput}
                  onChange={handleBudgetChange}
                  placeholder="25,000"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50 transition-colors"
                />
              </div>
            </div>

            {/* Max Mileage */}
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="cross-mileage"
                className="text-xs font-medium text-muted-text uppercase tracking-wider flex items-center gap-1.5"
              >
                <Gauge className="w-3.5 h-3.5" />
                Max Mileage
              </label>
              <div className="relative">
                <input
                  id="cross-mileage"
                  type="text"
                  inputMode="numeric"
                  value={mileageInput}
                  onChange={handleMileageChange}
                  placeholder="80,000"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text text-xs pointer-events-none">
                  mi
                </span>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!canSearch || isLoading || isFetching}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber text-zinc-900 text-sm font-semibold hover:bg-amber/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isLoading || isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs text-muted-text flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            Results are grouped by deal quality — Good Deals first, then Fair,
            then Overpriced. Within each tier, listings are sorted by price
            (lowest first). Listings with 0 mileage are always included.
          </p>
        </form>
      </div>

      {/* Results Area */}
      {!hasSearched ? (
        /* Pre-search prompt */
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="p-4 rounded-full bg-amber/10 border border-amber/20">
            <Car className="w-8 h-8 text-amber/70" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground font-rajdhani uppercase tracking-wide">
              Ready to Find Your Best Deal?
            </p>
            <p className="text-sm text-muted-text max-w-sm leading-relaxed">
              Enter a budget and max mileage to find the best deals across all
              makes and models in your listings.
            </p>
          </div>
          {/* Deal score legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-text">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Good Deal — priced &gt;10% below average
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-text">
              <span className="w-2 h-2 rounded-full bg-amber inline-block" />
              Fair — within 10% of average
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-text">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Overpriced — priced &gt;10% above average
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[
              { label: "Under $15k", budget: "15,000", mileage: "100,000" },
              { label: "Under $25k", budget: "25,000", mileage: "80,000" },
              { label: "Under $40k", budget: "40,000", mileage: "60,000" },
            ].map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => {
                  setBudgetInput(preset.budget);
                  setMileageInput(preset.mileage);
                }}
                className="px-3 py-1.5 rounded-lg border border-steel-border text-xs text-muted-text hover:text-foreground hover:border-amber/30 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <ResultsSkeleton />
      ) : (
        <>
          {/* Text filter + result count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-text pointer-events-none" />
              <input
                type="text"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                placeholder="Filter by make or model…"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-text focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-text">
              {isFetching && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber" />
              )}
              <span>
                {filteredResults.length} result
                {filteredResults.length !== 1 ? "s" : ""}
                {textFilter && ` matching "${textFilter}"`}
              </span>
              <span className="text-steel-border">·</span>
              <span>
                Budget: {fmtCurrency(submittedBudget)} · Max:{" "}
                {fmtMileage(submittedMileage)} mi
              </span>
            </div>
          </div>

          {/* Deal score summary chips */}
          {filteredResults.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {goodDeals.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block" />
                  {goodDeals.length} Good Deal
                  {goodDeals.length !== 1 ? "s" : ""}
                </span>
              )}
              {fairDeals.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber border border-amber/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
                  {fairDeals.length} Fair
                </span>
              )}
              {overpriced.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 inline-block" />
                  {overpriced.length} Overpriced
                </span>
              )}
            </div>
          )}

          {/* Empty state */}
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="p-3 rounded-full bg-amber/10 border border-amber/20">
                <Search className="w-6 h-6 text-amber/60" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No listings found
              </p>
              <p className="text-xs text-muted-text max-w-xs leading-relaxed">
                {textFilter
                  ? `No listings match "${textFilter}" within your criteria. Try adjusting the filter.`
                  : "No listings match your budget and mileage criteria. Try increasing your budget or max mileage."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Good Deals Section — highlighted */}
              {goodDeals.length > 0 && (
                <section>
                  <SectionHeader
                    label="Good Deals"
                    count={goodDeals.length}
                    color="emerald"
                    highlighted
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {goodDeals.map((listing) => (
                      <ResultCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </section>
              )}

              {/* Fair Deals Section */}
              {fairDeals.length > 0 && (
                <section>
                  <SectionHeader
                    label="Fair Price"
                    count={fairDeals.length}
                    color="amber"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {fairDeals.map((listing) => (
                      <ResultCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </section>
              )}

              {/* Overpriced Section */}
              {overpriced.length > 0 && (
                <section>
                  <SectionHeader
                    label="Overpriced"
                    count={overpriced.length}
                    color="red"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {overpriced.map((listing) => (
                      <ResultCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
