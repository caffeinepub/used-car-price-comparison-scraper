import React, { useState } from 'react';
import { Clock, Archive, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useArchiveListing } from '../hooks/useQueries';

interface StaleListingReminderPanelProps {
  staleListings: any[];
  onDismissAll: () => void;
}

export default function StaleListingReminderPanel({ staleListings, onDismissAll }: StaleListingReminderPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const archiveListing = useArchiveListing();

  const visible = staleListings.filter((l) => !dismissed.has(l.id));

  const handleKeep = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const handleArchive = async (id: string) => {
    await archiveListing.mutateAsync(id);
    setDismissed((prev) => new Set([...prev, id]));
  };

  const getAge = (ts: bigint | number) => {
    const ms = Number(ts) / 1_000_000;
    const days = Math.floor((Date.now() - ms) / 86_400_000);
    return days;
  };

  if (visible.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">
            {visible.length} Stale Listing{visible.length !== 1 ? 's' : ''} (30+ days old)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDismissAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-surface"
          >
            Dismiss All
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="divide-y divide-amber-500/10 max-h-64 overflow-y-auto">
          {visible.map((listing) => {
            const age = getAge(listing.timestamp);
            return (
              <div key={listing.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <span className="text-foreground font-medium">
                      {listing.year} {listing.make} {listing.model}
                    </span>
                    {listing.trim && (
                      <span className="text-muted-foreground ml-1">{listing.trim}</span>
                    )}
                  </div>
                  <span className="text-amber-400 text-xs shrink-0">{age}d old</span>
                  <span className="text-muted-foreground text-xs shrink-0">
                    ${Number(listing.price).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => handleKeep(listing.id)}
                    className="text-xs px-2 py-1 rounded border border-steel-border text-muted-foreground hover:text-foreground hover:border-amber-500/50 transition-colors"
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => handleArchive(listing.id)}
                    disabled={archiveListing.isPending}
                    className="text-xs px-2 py-1 rounded border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Archive className="w-3 h-3" />
                    Archive
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
