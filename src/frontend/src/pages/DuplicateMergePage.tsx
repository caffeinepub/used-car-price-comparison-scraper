import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  GitMerge,
  CheckCircle2,
  Copy,
  ExternalLink,
  Car,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  make: string;
  model: string;
  year: bigint | number;
  mileage: bigint | number;
  price: bigint | number;
  trim: string;
  condition: string;
  dealerName: string;
  source: string;
  listingUrl: string;
  archived: boolean;
  timestamp: bigint | number;
}

type DuplicateCluster = Listing[];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useNearDuplicates() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DuplicateCluster[]>({
    queryKey: ['nearDuplicates'],
    queryFn: async () => {
      if (!actor) return [];
      // Try the most likely method names
      const a = actor as any;
      if (typeof a.getNearDuplicates === 'function') {
        return a.getNearDuplicates();
      }
      if (typeof a.getDuplicateClusters === 'function') {
        return a.getDuplicateClusters();
      }
      if (typeof a.getNearDuplicateClusters === 'function') {
        return a.getNearDuplicateClusters();
      }
      // Fallback: compute client-side from all listings
      if (typeof a.getAllListings === 'function') {
        const all: Listing[] = await a.getAllListings();
        return computeClientSideDuplicates(all.filter((l) => !l.archived));
      }
      return [];
    },
    enabled: !!actor && !actorFetching,
  });
}

function useMergeListings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keepId, deleteIds }: { keepId: string; deleteIds: string[] }) => {
      const a = actor as any;
      if (typeof a.mergeListings === 'function') {
        return a.mergeListings(keepId, deleteIds);
      }
      if (typeof a.mergeDuplicateListings === 'function') {
        return a.mergeDuplicateListings(keepId, deleteIds);
      }
      // Fallback: delete the discards individually
      if (typeof a.deleteListing === 'function') {
        for (const id of deleteIds) {
          await a.deleteListing(id);
        }
        return;
      }
      throw new Error('No merge or delete method found on actor');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nearDuplicates'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['allListings'] });
      toast.success('Listings merged successfully');
    },
    onError: (err: any) => {
      toast.error(`Merge failed: ${err?.message ?? 'Unknown error'}`);
    },
  });
}

// ─── Client-side duplicate detection ─────────────────────────────────────────

function computeClientSideDuplicates(listings: Listing[]): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < listings.length; i++) {
    if (visited.has(listings[i].id)) continue;
    const cluster: Listing[] = [listings[i]];
    for (let j = i + 1; j < listings.length; j++) {
      if (visited.has(listings[j].id)) continue;
      if (areSimilar(listings[i], listings[j])) {
        cluster.push(listings[j]);
        visited.add(listings[j].id);
      }
    }
    if (cluster.length > 1) {
      visited.add(listings[i].id);
      clusters.push(cluster);
    }
  }
  return clusters;
}

function areSimilar(a: Listing, b: Listing): boolean {
  const sameBase =
    a.make.toLowerCase() === b.make.toLowerCase() &&
    a.model.toLowerCase() === b.model.toLowerCase() &&
    Number(a.year) === Number(b.year);
  if (!sameBase) return false;

  const priceDiff = Math.abs(Number(a.price) - Number(b.price));
  const avgPrice = (Number(a.price) + Number(b.price)) / 2;
  const priceSimilar = avgPrice === 0 || priceDiff / avgPrice < 0.05;

  const mileageDiff = Math.abs(Number(a.mileage) - Number(b.mileage));
  const mileageSimilar = mileageDiff < 2000;

  return priceSimilar && mileageSimilar;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: bigint | number, style: 'currency' | 'decimal' = 'decimal'): string {
  const num = Number(n);
  if (style === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  }
  return new Intl.NumberFormat('en-US').format(num);
}

function completenessScore(l: Listing): number {
  let score = 0;
  if (l.trim) score++;
  if (l.condition) score++;
  if (l.dealerName) score++;
  if (l.source) score++;
  if (l.listingUrl) score++;
  return score;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: Listing;
  isKeep: boolean;
  onSelect: () => void;
}

function ListingCard({ listing, isKeep, onSelect }: ListingCardProps) {
  const score = completenessScore(listing);

  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 select-none
        ${isKeep
          ? 'border-amber bg-amber/5 shadow-amber-glow ring-1 ring-amber/40'
          : 'border-steel-border bg-surface hover:border-amber/40 hover:bg-amber/5'
        }`}
    >
      {/* Keep badge */}
      {isKeep && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-amber text-charcoal text-xs font-bold px-2 py-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Keep
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mt-1">
        <div>
          <p className="font-bold text-foreground text-base leading-tight">
            {listing.year} {listing.make} {listing.model}
          </p>
          {listing.trim && (
            <p className="text-xs text-muted-text mt-0.5">{listing.trim}</p>
          )}
        </div>
        <p className="text-lg font-bold text-amber shrink-0">{fmt(listing.price, 'currency')}</p>
      </div>

      <Separator className="bg-steel-border/50" />

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-muted-text">Mileage</span>
          <p className="text-foreground font-medium">{fmt(listing.mileage)} mi</p>
        </div>
        <div>
          <span className="text-muted-text">Condition</span>
          <p className="text-foreground font-medium capitalize">{listing.condition || '—'}</p>
        </div>
        <div>
          <span className="text-muted-text">Source</span>
          <p className="text-foreground font-medium">{listing.source || '—'}</p>
        </div>
        <div>
          <span className="text-muted-text">Dealer</span>
          <p className="text-foreground font-medium truncate">{listing.dealerName || '—'}</p>
        </div>
      </div>

      {/* URL */}
      {listing.listingUrl && (
        <a
          href={listing.listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-amber hover:text-amber/80 truncate mt-1"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate">{listing.listingUrl}</span>
        </a>
      )}

      {/* Completeness */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-4 rounded-full ${i < score ? 'bg-amber' : 'bg-steel-border'}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-text">{score}/5 fields</span>
      </div>

      {/* Select indicator */}
      <div className={`absolute bottom-3 right-3 w-4 h-4 rounded-full border-2 transition-colors
        ${isKeep ? 'border-amber bg-amber' : 'border-steel-border bg-transparent'}`}
      >
        {isKeep && <div className="w-full h-full rounded-full bg-charcoal scale-50" />}
      </div>
    </div>
  );
}

// ─── Cluster Card ─────────────────────────────────────────────────────────────

interface ClusterCardProps {
  cluster: DuplicateCluster;
  index: number;
  onMerged: (ids: string[]) => void;
}

function ClusterCard({ cluster, index, onMerged }: ClusterCardProps) {
  // Default: keep the listing with highest completeness score
  const defaultKeep = cluster.reduce((best, l) =>
    completenessScore(l) >= completenessScore(best) ? l : best
  );
  const [keepId, setKeepId] = useState<string>(defaultKeep.id);
  const mergeMutation = useMergeListings();

  const discardIds = cluster.filter((l) => l.id !== keepId).map((l) => l.id);

  const handleMerge = () => {
    mergeMutation.mutate(
      { keepId, deleteIds: discardIds },
      {
        onSuccess: () => {
          onMerged(cluster.map((l) => l.id));
        },
      }
    );
  };

  const representative = cluster[0];

  return (
    <Card className="bg-surface border-steel-border shadow-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-steel-border/50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center">
              <Copy className="w-4 h-4 text-amber" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Cluster #{index + 1} — {representative.year} {representative.make} {representative.model}
              </CardTitle>
              <p className="text-xs text-muted-text mt-0.5">
                {cluster.length} near-duplicate listings detected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber/30 text-amber text-xs">
              {cluster.length} duplicates
            </Badge>
            <Button
              size="sm"
              onClick={handleMerge}
              disabled={mergeMutation.isPending}
              className="bg-amber hover:bg-amber/90 text-charcoal font-bold text-xs h-8 px-3 flex items-center gap-1.5"
            >
              {mergeMutation.isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
                  Merging…
                </>
              ) : (
                <>
                  <GitMerge className="w-3.5 h-3.5" />
                  Merge
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <p className="text-xs text-muted-text mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber/70" />
          Click a card to select which listing to keep. All others will be removed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cluster.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isKeep={listing.id === keepId}
              onSelect={() => setKeepId(listing.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <Card key={i} className="bg-surface border-steel-border">
          <CardHeader className="pb-3 border-b border-steel-border/50">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2].map((j) => (
                <div key={j} className="rounded-xl border border-steel-border p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">No duplicate listings detected</h3>
      <p className="text-muted-text text-sm max-w-sm">
        Your listings look clean! We scan for near-identical make, model, year, price, and mileage
        combinations to surface potential duplicates.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DuplicateMergePage() {
  const { data: clusters = [], isLoading, isError } = useNearDuplicates();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleClusters = clusters.filter(
    (cluster) => !cluster.some((l) => dismissedIds.has(l.id))
  );

  const handleMerged = (ids: string[]) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Duplicate Merge</h1>
              <p className="text-sm text-muted-text">
                Review and merge near-duplicate listings to keep your data clean
              </p>
            </div>
          </div>

          {!isLoading && !isError && visibleClusters.length > 0 && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <Badge className="bg-amber/10 text-amber border border-amber/20 text-xs px-3 py-1">
                {visibleClusters.length} cluster{visibleClusters.length !== 1 ? 's' : ''} found
              </Badge>
              <Badge className="bg-surface text-muted-text border border-steel-border text-xs px-3 py-1">
                {visibleClusters.reduce((sum, c) => sum + c.length, 0)} total listings
              </Badge>
              <span className="text-xs text-muted-text">
                Select which listing to keep in each cluster, then click Merge.
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Failed to load duplicates</h3>
            <p className="text-muted-text text-sm">Please refresh the page and try again.</p>
          </div>
        ) : visibleClusters.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {visibleClusters.map((cluster, index) => (
              <ClusterCard
                key={cluster.map((l) => l.id).join('-')}
                cluster={cluster}
                index={index}
                onMerged={handleMerged}
              />
            ))}
          </div>
        )}

        {/* Dismiss info */}
        {dismissedIds.size > 0 && (
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-text">
            <Trash2 className="w-3.5 h-3.5" />
            {dismissedIds.size} listing{dismissedIds.size !== 1 ? 's' : ''} merged this session
          </div>
        )}
      </div>
    </main>
  );
}
