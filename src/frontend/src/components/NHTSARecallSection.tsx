import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, AlertTriangle, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NHTSARecall {
  NHTSAId: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  ReportReceivedDate: string;
}

interface NHTSASafetyResult {
  VehicleId: number;
  VehicleDescription: string;
  OverallRating: string;
}

interface NHTSARecallSectionProps {
  make: string;
  model: string;
  latestYear?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNHTSADate(raw: string): string {
  // NHTSA dates come as "/Date(1234567890000)/" or "YYYY-MM-DDTHH:mm:ss"
  const msMatch = raw.match(/\/Date\((\d+)\)\//);
  if (msMatch) {
    return new Date(parseInt(msMatch[1], 10)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  if (raw.includes('T')) {
    return new Date(raw).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return raw;
}

function StarRating({ rating }: { rating: string }) {
  const num = parseInt(rating, 10);
  if (isNaN(num)) {
    return <span className="text-muted-foreground text-sm">Not Rated</span>;
  }
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= num ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="ml-1.5 text-amber-400 font-semibold text-sm">{num}/5</span>
    </div>
  );
}

// ─── Recall Card ─────────────────────────────────────────────────────────────

function RecallCard({ recall }: { recall: NHTSARecall }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card-panel p-4 space-y-2 border border-red-500/20 bg-red-500/5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-amber-400 font-semibold text-sm leading-snug truncate" title={recall.Component}>
            {recall.Component || 'Unknown Component'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatNHTSADate(recall.ReportReceivedDate)} · ID: {recall.NHTSAId}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label={expanded ? 'Collapse recall details' : 'Expand recall details'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary always visible */}
      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
        {recall.Summary || '—'}
      </p>

      {/* Expanded details */}
      {expanded && (
        <div className="pt-2 space-y-2 border-t border-red-500/10">
          {recall.Consequence && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Consequence
              </span>
              <p className="text-sm text-foreground/80 mt-0.5">{recall.Consequence}</p>
            </div>
          )}
          {recall.Remedy && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Remedy
              </span>
              <p className="text-sm text-foreground/80 mt-0.5">{recall.Remedy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function NHTSARecallSection({ make, model, latestYear }: NHTSARecallSectionProps) {
  const [recalls, setRecalls] = useState<NHTSARecall[]>([]);
  const [safetyResults, setSafetyResults] = useState<NHTSASafetyResult[]>([]);
  const [recallsLoading, setRecallsLoading] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [recallsError, setRecallsError] = useState<string | null>(null);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch recalls
  useEffect(() => {
    if (!make || !model) return;
    setRecallsLoading(true);
    setRecallsError(null);
    setRecalls([]);

    const encodedMake = encodeURIComponent(make);
    const encodedModel = encodeURIComponent(model);

    fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodedMake}&model=${encodedModel}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setRecalls(Array.isArray(data.results) ? data.results : []);
      })
      .catch((err) => {
        setRecallsError('Unable to load recall data. NHTSA API may be temporarily unavailable.');
        console.error('NHTSA recalls fetch error:', err);
      })
      .finally(() => setRecallsLoading(false));
  }, [make, model]);

  // Fetch safety ratings when year is known
  useEffect(() => {
    if (!make || !model || !latestYear) return;
    setSafetyLoading(true);
    setSafetyError(null);
    setSafetyResults([]);

    const encodedMake = encodeURIComponent(make);
    const encodedModel = encodeURIComponent(model);

    fetch(
      `https://api.nhtsa.gov/SafetyRatings/modelyear/${latestYear}/make/${encodedMake}/model/${encodedModel}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSafetyResults(Array.isArray(data.Results) ? data.Results : []);
      })
      .catch((err) => {
        setSafetyError('Safety ratings unavailable.');
        console.error('NHTSA safety ratings fetch error:', err);
      })
      .finally(() => setSafetyLoading(false));
  }, [make, model, latestYear]);

  const hasRecalls = recalls.length > 0;
  const recallBadgeClass = hasRecalls
    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';

  return (
    <div className="card-panel p-6 space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasRecalls ? (
            <div className="p-2 rounded-lg bg-red-500/10">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recalls &amp; Safety</h2>
            <p className="text-xs text-muted-foreground">
              NHTSA data for {make} {model}{latestYear ? ` (${latestYear})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Recall count badge */}
          {!recallsLoading && !recallsError && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${recallBadgeClass}`}>
              {hasRecalls ? `${recalls.length} recall${recalls.length !== 1 ? 's' : ''}` : 'No open recalls'}
            </span>
          )}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? 'Expand section' : 'Collapse section'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Safety ratings strip */}
          {latestYear && (
            <div className="flex items-center gap-3 flex-wrap">
              {safetyLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : safetyError ? null : safetyResults.length > 0 ? (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-surface border border-steel-border">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Overall Safety Rating · {latestYear}</p>
                    <StarRating rating={safetyResults[0].OverallRating} />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Recalls content */}
          {recallsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['sk-1', 'sk-2', 'sk-3', 'sk-4'] as const).map((skKey) => (
                <div key={skKey} className="card-panel p-4 space-y-2 border border-steel-border">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : recallsError ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-400">{recallsError}</p>
            </div>
          ) : recalls.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-400">No open recalls found</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  NHTSA has no active recall records for {make} {model}.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recalls.map((recall) => (
                <RecallCard key={recall.NHTSAId} recall={recall} />
              ))}
            </div>
          )}

          {/* Data source note */}
          <p className="text-xs text-muted-foreground/60 text-right">
            Data provided by{' '}
            <a
              href="https://api.nhtsa.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-muted-foreground transition-colors"
            >
              NHTSA
            </a>
          </p>
        </>
      )}
    </div>
  );
}
