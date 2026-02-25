import React from 'react';

interface Props {
  listings: any[];
  make: string;
  model: string;
  dealScores?: Record<string, string>;
}

export default function PriceStatisticsPanel({ listings, make, model, dealScores }: Props) {
  if (!listings || listings.length === 0) {
    return (
      <div className="card-panel p-6 text-center text-muted-foreground">
        No listings available for {make} {model}.
      </div>
    );
  }

  const prices = listings.map((l) => Number(l.price)).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  // Find cheapest source
  const sourceMap: Record<string, number[]> = {};
  listings.forEach((l) => {
    const src = l.source || 'Unknown';
    if (!sourceMap[src]) sourceMap[src] = [];
    sourceMap[src].push(Number(l.price));
  });
  const sourceAvgs = Object.entries(sourceMap).map(([src, ps]) => ({
    source: src,
    avg: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length),
  }));
  sourceAvgs.sort((a, b) => a.avg - b.avg);
  const cheapestSource = sourceAvgs[0];

  // Deal score summary
  const dealEntries = dealScores ? Object.entries(dealScores) : [];
  const goodDeals = dealEntries.filter(([, r]) => r === 'Good Deal');
  const fairDeals = dealEntries.filter(([, r]) => r === 'Fair');
  const overpriced = dealEntries.filter(([, r]) => r === 'Overpriced');

  const dealBadge = (rating: string) => {
    if (rating === 'Good Deal') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (rating === 'Overpriced') return 'bg-red-500/20 text-red-400 border border-red-500/30';
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  };

  return (
    <div className="card-panel p-6 space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        Statistics — {make} {model}
      </h2>

      {/* Price stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Min Price</div>
          <div className="text-lg font-bold text-emerald-400">{fmt(minPrice)}</div>
        </div>
        <div className="bg-surface rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Max Price</div>
          <div className="text-lg font-bold text-red-400">{fmt(maxPrice)}</div>
        </div>
        <div className="bg-surface rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Avg Price</div>
          <div className="text-lg font-bold text-amber-400">{fmt(avgPrice)}</div>
        </div>
        <div className="bg-surface rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Listings</div>
          <div className="text-lg font-bold text-foreground">{listings.length}</div>
        </div>
      </div>

      {/* Cheapest source */}
      {cheapestSource && (
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Cheapest Source</div>
          <div className="flex items-center gap-3 bg-surface rounded-lg p-3">
            <span className="text-foreground font-medium">{cheapestSource.source}</span>
            <span className="text-emerald-400 font-bold">{fmt(cheapestSource.avg)} avg</span>
          </div>
        </div>
      )}

      {/* Deal Scores */}
      {dealEntries.length > 0 && (
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Deal Scores</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {goodDeals.length} Good Deal{goodDeals.length !== 1 ? 's' : ''}
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {fairDeals.length} Fair
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
              {overpriced.length} Overpriced
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {dealEntries.map(([listingId, rating]) => {
              const listing = listings.find((l) => l.id === listingId);
              if (!listing) return null;
              return (
                <div key={listingId} className="flex items-center justify-between text-xs py-1 border-b border-steel-border/30">
                  <span className="text-muted-foreground">
                    {listing.year} {listing.make} {listing.model} {listing.trim || ''}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${dealBadge(rating)}`}>{rating}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
