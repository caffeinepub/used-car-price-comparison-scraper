import React, { useState } from 'react';
import { useGetNearDuplicates, useMergeListings } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { GitMerge, CheckCircle2, AlertTriangle, Car } from 'lucide-react';

function formatPrice(price: bigint | number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(price));
}

function formatMileage(mileage: bigint | number): string {
  return new Intl.NumberFormat('en-US').format(Number(mileage)) + ' mi';
}

function formatDate(timestamp: bigint | number): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString();
}

interface ClusterCardProps {
  cluster: any[];
  clusterIndex: number;
}

function ClusterCard({ cluster, clusterIndex }: ClusterCardProps) {
  const [selectedKeepId, setSelectedKeepId] = useState<string>(cluster[0]?.id ?? '');
  const mergeMutation = useMergeListings();

  const handleMerge = async () => {
    const deleteIds = cluster.filter((l: any) => l.id !== selectedKeepId).map((l: any) => l.id);
    if (deleteIds.length === 0) return;

    try {
      const result = await mergeMutation.mutateAsync({ keepId: selectedKeepId, deleteIds });
      if (result) {
        toast.success(`Cluster ${clusterIndex + 1} merged successfully. ${deleteIds.length} duplicate(s) removed.`);
      } else {
        toast.error('Merge failed. The listing to keep may no longer exist.');
      }
    } catch {
      toast.error('Failed to merge listings. Please try again.');
    }
  };

  return (
    <div className="card-panel mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">
            Duplicate Cluster #{clusterIndex + 1}
          </span>
          <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-300">
            {cluster.length} matches
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={handleMerge}
          disabled={mergeMutation.isPending}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          {mergeMutation.isPending ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Merging...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <GitMerge className="w-4 h-4" />
              Merge
            </span>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Select which listing to keep. All others will be permanently deleted.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cluster.map((listing: any) => {
          const isSelected = listing.id === selectedKeepId;
          return (
            <button
              key={listing.id}
              onClick={() => setSelectedKeepId(listing.id)}
              className={`text-left rounded-lg border p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50'
                  : 'border-steel-border bg-surface hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold text-sm text-foreground">
                    {Number(listing.year)} {listing.make} {listing.model}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {listing.trim && (
                  <div className="flex justify-between">
                    <span>Trim</span>
                    <span className="text-foreground font-medium">{listing.trim}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Price</span>
                  <span className="text-amber-400 font-semibold">{formatPrice(listing.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mileage</span>
                  <span className="text-foreground">{formatMileage(listing.mileage)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Source</span>
                  <span className="text-foreground">{listing.source}</span>
                </div>
                {listing.dealerName && (
                  <div className="flex justify-between">
                    <span>Dealer</span>
                    <span className="text-foreground truncate max-w-[120px]">{listing.dealerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Condition</span>
                  <span className="text-foreground">{listing.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span>Added</span>
                  <span className="text-foreground">{formatDate(listing.timestamp)}</span>
                </div>
                {listing.listingUrl && (
                  <div className="pt-1">
                    <a
                      href={listing.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-amber-400 hover:text-amber-300 underline truncate block"
                    >
                      View listing ↗
                    </a>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-amber-500/30">
                  <span className="text-xs font-semibold text-amber-400">✓ Keep this listing</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DuplicateMergePage() {
  const { data: clusters, isLoading, error } = useGetNearDuplicates();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <GitMerge className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-foreground font-display tracking-wide">
            Duplicate Listings
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Review near-duplicate listings detected by the system. Select which listing to keep and merge to remove duplicates.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-panel">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-48 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card-panel text-center py-12">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-semibold">Failed to load duplicate listings</p>
          <p className="text-muted-foreground text-sm mt-1">Please try refreshing the page.</p>
        </div>
      )}

      {!isLoading && !error && clusters && (clusters as any[]).length === 0 && (
        <div className="card-panel text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No duplicate listings detected</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your listings are clean! The system checks for near-matches based on make, model, year, source, price (within 2%), and mileage (within 500 miles).
          </p>
        </div>
      )}

      {!isLoading && !error && clusters && (clusters as any[]).length > 0 && (
        <>
          <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              <span className="font-semibold">{(clusters as any[]).length} duplicate cluster{(clusters as any[]).length !== 1 ? 's' : ''} found.</span>{' '}
              Review each group and select which listing to keep before merging.
            </p>
          </div>
          {(clusters as any[]).map((cluster: any, index: number) => (
            <ClusterCard key={`cluster-${index}-${cluster[0]?.id}`} cluster={cluster} clusterIndex={index} />
          ))}
        </>
      )}
    </main>
  );
}
