import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "@tanstack/react-router";
import { AlertCircle, BookmarkX, Car, Eye } from "lucide-react";
import React from "react";
import { useSharedWatchlist } from "../hooks/useQueries";

function SharedWatchlistSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
        <div
          key={key}
          className="p-4 rounded-lg bg-surface border border-steel-border space-y-3"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export default function SharedWatchlistPage() {
  const { token } = useParams({ strict: false }) as { token: string };
  const { data, isLoading, isFetched } = useSharedWatchlist(token ?? "");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-amber/10 border border-amber/20">
            <Eye className="w-6 h-6 text-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-rajdhani tracking-wide">
              Shared Watchlist
            </h1>
            <p className="text-sm text-muted-text">
              Read-only view of a shared car watchlist
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <SharedWatchlistSkeleton />
        ) : !token || (isFetched && data === null) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4 opacity-60" />
            <p className="text-lg font-semibold text-foreground mb-1">
              Watchlist not found
            </p>
            <p className="text-sm text-muted-text">
              This link may be invalid or the watchlist no longer exists.
            </p>
          </div>
        ) : isFetched && Array.isArray(data) && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookmarkX className="w-12 h-12 text-muted-text mb-4 opacity-40" />
            <p className="text-lg font-semibold text-foreground mb-1">
              This watchlist has no entries yet
            </p>
            <p className="text-sm text-muted-text">
              The owner hasn't added any cars to their watchlist.
            </p>
          </div>
        ) : Array.isArray(data) ? (
          <>
            <p className="text-xs text-muted-text mb-4">
              {data.length} {data.length === 1 ? "car" : "cars"} on this
              watchlist
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((entry) => (
                <div
                  key={Number(entry.id)}
                  className="p-4 rounded-lg bg-surface border border-steel-border hover:border-amber/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-amber/10 border border-amber/20 shrink-0">
                      <Car className="w-4 h-4 text-amber" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-tight">
                        {entry.make} {entry.model}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-muted-text mt-1 line-clamp-2">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
