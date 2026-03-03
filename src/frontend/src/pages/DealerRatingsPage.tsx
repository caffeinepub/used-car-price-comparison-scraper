import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, ShieldCheck, Star, Users } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { DealerRating } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAggregateDealerRating,
  useGetDealerRatings,
  useSubmitDealerRating,
} from "../hooks/useQueries";

// ─── Star Rating Input ────────────────────────────────────────────────────────

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <fieldset
      className="flex items-center gap-1 border-none p-0 m-0"
      aria-label="Star rating"
    >
      <legend className="sr-only">Star rating</legend>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          data-ocid={`dealer_ratings.rating.item.${star}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              (hovered || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {["", "Poor", "Fair", "Good", "Great", "Excellent"][value]}
        </span>
      )}
    </fieldset>
  );
}

// ─── Star Display ─────────────────────────────────────────────────────────────

function StarDisplay({
  rating,
  size = "sm",
}: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${cls} transition-colors ${
            rating >= star
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Aggregate Panel ──────────────────────────────────────────────────────────

function AggregatePanelSkeleton() {
  return (
    <div className="card-panel p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
      <Skeleton
        className="h-20 w-40 rounded-xl"
        data-ocid="dealer_ratings.loading_state"
      />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function AggregatePanel({ dealerName }: { dealerName: string }) {
  const { data: agg, isLoading } = useGetAggregateDealerRating(dealerName);

  if (isLoading) return <AggregatePanelSkeleton />;

  const count = agg ? Number(agg.count) : 0;
  const avg = agg?.avgRating ?? 0;

  return (
    <div className="card-panel p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
      <div className="text-center sm:text-left">
        <p className="text-5xl font-bold font-display text-amber">
          {avg > 0 ? avg.toFixed(1) : "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">out of 5</p>
      </div>
      <div className="flex-1">
        <StarDisplay rating={Math.round(avg)} size="lg" />
        <p className="text-sm text-muted-foreground mt-2">
          {count > 0
            ? `${count} community review${count !== 1 ? "s" : ""}`
            : "No reviews yet — be the first!"}
        </p>
        <p className="text-base font-semibold text-foreground mt-1">
          {dealerName}
        </p>
      </div>
      {count > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Community Verified
        </div>
      )}
    </div>
  );
}

// ─── Review List ──────────────────────────────────────────────────────────────

function formatTs(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncatePrincipal(p: { toString: () => string }) {
  const s = p.toString();
  if (s.length <= 12) return s;
  return `${s.slice(0, 5)}…${s.slice(-5)}`;
}

function ReviewList({ dealerName }: { dealerName: string }) {
  const { data: ratings, isLoading } = useGetDealerRatings(dealerName);

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="dealer_ratings.loading_state">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <div
        className="card-panel p-10 text-center"
        data-ocid="dealer_ratings.empty_state"
      >
        <Users className="w-10 h-10 mx-auto mb-3 opacity-20 text-amber" />
        <p className="text-sm text-muted-foreground">
          No reviews yet for this dealer. Be the first to rate your experience!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(ratings as DealerRating[]).map((r, idx) => (
        <div
          key={`${r.reviewer.toString()}-${Number(r.timestamp)}`}
          className="card-panel p-4"
          data-ocid={`dealer_ratings.review.item.${idx + 1}`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <StarDisplay rating={Number(r.rating)} />
              <span className="text-xs text-muted-foreground">
                {truncatePrincipal(r.reviewer)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatTs(r.timestamp)}
            </span>
          </div>
          {r.review && (
            <p className="text-sm text-foreground leading-relaxed">
              {r.review}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Rate Dealer Form ─────────────────────────────────────────────────────────

function RateDealerForm({ dealerName }: { dealerName: string }) {
  const { identity } = useInternetIdentity();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const submitMutation = useSubmitDealerRating();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !dealerName.trim()) return;
    try {
      await submitMutation.mutateAsync({ dealerName, rating, review });
      toast.success("Review submitted successfully!");
      setRating(0);
      setReview("");
    } catch {
      toast.error("Failed to submit review. Please try again.");
    }
  };

  if (!identity) {
    return (
      <div className="card-panel p-6 text-center border border-amber/20">
        <Star className="w-8 h-8 mx-auto mb-2 text-amber opacity-50" />
        <p className="text-sm text-foreground font-medium mb-1">
          Sign in to rate this dealer
        </p>
        <p className="text-xs text-muted-foreground">
          You must be signed in to submit a community rating.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-panel p-6 border border-amber/20"
    >
      <h3 className="text-sm font-semibold text-amber mb-4 flex items-center gap-2">
        <Star className="w-4 h-4" />
        Rate Your Experience
      </h3>

      <div className="space-y-4">
        <div>
          <p className="block text-xs text-muted-foreground mb-2">Rating *</p>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        <div>
          <label
            htmlFor="dealer-review"
            className="block text-xs text-muted-foreground mb-2"
          >
            Review (optional)
          </label>
          <Textarea
            id="dealer-review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this dealer…"
            rows={3}
            data-ocid="dealer_ratings.review.textarea"
            className="bg-background border-steel-border text-foreground placeholder:text-muted-foreground focus:border-amber resize-none"
          />
        </div>

        <Button
          type="submit"
          disabled={!rating || submitMutation.isPending}
          data-ocid="dealer_ratings.submit_button"
          className="w-full bg-amber hover:bg-amber/90 text-charcoal font-bold"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealerRatingsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeDealer, setActiveDealer] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) setActiveDealer(trimmed);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
            <Star className="w-6 h-6 text-amber" />
            Community Dealer Ratings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buyers rate their experience with specific dealers — transparent,
            community-sourced trust scores.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search dealer by name…"
              data-ocid="dealer_ratings.search_input"
              className="w-full pl-9 pr-3 py-2.5 bg-surface border border-steel-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber"
            />
          </div>
          <Button
            type="submit"
            disabled={!searchInput.trim()}
            className="bg-amber hover:bg-amber/90 text-charcoal font-bold px-5"
          >
            Look Up
          </Button>
        </form>

        {/* Results */}
        {activeDealer ? (
          <div className="space-y-6">
            {/* Aggregate */}
            <AggregatePanel dealerName={activeDealer} />

            {/* Rate form */}
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                Write a Review
              </h2>
              <RateDealerForm dealerName={activeDealer} />
            </div>

            {/* Reviews list */}
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                Community Reviews
              </h2>
              <ReviewList dealerName={activeDealer} />
            </div>
          </div>
        ) : (
          <div
            className="card-panel p-12 text-center"
            data-ocid="dealer_ratings.empty_state"
          >
            <Star className="w-12 h-12 mx-auto mb-3 opacity-20 text-amber" />
            <p className="text-base font-medium text-foreground mb-1">
              Search for a Dealer
            </p>
            <p className="text-sm text-muted-foreground">
              Enter a dealer name above to see community ratings and reviews, or
              submit your own experience.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
