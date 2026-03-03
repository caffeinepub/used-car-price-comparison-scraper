import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface PriceHistoryEntry {
  price: bigint;
  timestamp: bigint;
}

interface CarListing {
  id: string;
  make: string;
  model: string;
  year: number | bigint;
  price: bigint;
  timestamp: bigint;
  priceHistory?: PriceHistoryEntry[];
  [key: string]: unknown;
}

interface PriceHistoryReplayModalProps {
  listing: CarListing;
  open: boolean;
  onClose: () => void;
}

interface TimelineStep {
  price: number;
  timestamp: number;
  label: string;
  change: number;
  changePct: number;
  isFirst: boolean;
  isCurrent: boolean;
}

function buildTimeline(listing: CarListing): TimelineStep[] {
  const history: PriceHistoryEntry[] = Array.isArray(listing.priceHistory)
    ? listing.priceHistory
    : [];

  // Combine history + current price, deduplicate by timestamp, sort oldest first
  const allEntries: PriceHistoryEntry[] = [
    ...history,
    { price: listing.price, timestamp: listing.timestamp },
  ].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  // Remove exact duplicates
  const deduplicated = allEntries.filter(
    (entry, idx, arr) =>
      idx === 0 || entry.timestamp !== arr[idx - 1].timestamp,
  );

  return deduplicated.map((entry, idx) => {
    const price = Number(entry.price);
    const prevPrice = idx > 0 ? Number(deduplicated[idx - 1].price) : price;
    const change = price - prevPrice;
    const changePct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
    const isFirst = idx === 0;
    const isCurrent = idx === deduplicated.length - 1;

    let label = "Price Drop";
    if (isFirst) label = "Initial Price";
    else if (isCurrent && deduplicated.length > 1) label = "Current Price";
    else if (change > 0) label = "Price Increase";
    else if (change < 0) label = "Price Drop";
    else label = "No Change";

    return {
      price,
      timestamp: Number(entry.timestamp) / 1_000_000,
      label,
      change,
      changePct,
      isFirst,
      isCurrent,
    };
  });
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PriceHistoryReplayModal({
  listing,
  open,
  onClose,
}: PriceHistoryReplayModalProps) {
  const timeline = buildTimeline(listing);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setIsPlaying(false);
    }
  }, [open]);

  // Auto-play logic
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying) return;

    intervalRef.current = setInterval(() => {
      setStep((prev) => {
        if (prev >= timeline.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, timeline.length]);

  const currentStep = timeline[step];

  const hasHistory = timeline.length > 1;

  const formatPrice = (p: number) =>
    `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg bg-background border border-steel-border"
        data-ocid="price_replay.modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <span className="text-amber">Price History</span>
            <span className="text-muted-foreground font-normal text-sm">
              {listing.year} {listing.make} {listing.model}
            </span>
          </DialogTitle>
        </DialogHeader>

        {!hasHistory ? (
          <div
            className="py-10 text-center text-muted-foreground text-sm"
            data-ocid="price_replay.empty_state"
          >
            <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No price changes recorded yet.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Timeline dots bar */}
            <div className="flex items-center gap-0 relative">
              <div className="absolute inset-y-1/2 left-2 right-2 h-px bg-steel-border -translate-y-1/2" />
              {timeline.map((t, idx) => (
                <button
                  key={`dot-${t.timestamp}-${idx}`}
                  type="button"
                  onClick={() => {
                    setStep(idx);
                    setIsPlaying(false);
                  }}
                  className="relative z-10 flex-1 flex justify-center"
                  aria-label={`Go to step ${idx + 1}: ${t.label}`}
                >
                  <span
                    className={`block rounded-full border-2 transition-all ${
                      idx === step
                        ? "w-4 h-4 bg-amber border-amber shadow-[0_0_8px_2px_rgba(245,158,11,0.4)]"
                        : idx < step
                          ? "w-2.5 h-2.5 bg-amber/60 border-amber/60"
                          : "w-2 h-2 bg-background border-steel-border"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Step counter */}
            <div className="text-xs text-muted-foreground text-center">
              Step {step + 1} of {timeline.length}
            </div>

            {/* Current step details */}
            {currentStep && (
              <div className="bg-surface rounded-xl border border-steel-border p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatDate(currentStep.timestamp)}
                    </p>
                    <p
                      className={`text-3xl font-bold font-display ${
                        currentStep.isCurrent ? "text-amber" : "text-foreground"
                      }`}
                    >
                      {formatPrice(currentStep.price)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                      currentStep.isFirst
                        ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30"
                        : currentStep.isCurrent
                          ? "bg-amber/10 text-amber border-amber/30"
                          : currentStep.change < 0
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30"
                            : currentStep.change > 0
                              ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30"
                              : "bg-surface text-muted-foreground border-steel-border"
                    }`}
                  >
                    {currentStep.label}
                  </span>
                </div>

                {!currentStep.isFirst && (
                  <div className="flex items-center gap-2 text-sm">
                    {currentStep.change < 0 ? (
                      <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : currentStep.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500 shrink-0" />
                    ) : null}
                    <span
                      className={
                        currentStep.change < 0
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : currentStep.change > 0
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : "text-muted-foreground"
                      }
                    >
                      {currentStep.change < 0 ? "" : "+"}
                      {formatPrice(currentStep.change)}{" "}
                      <span className="font-normal opacity-80">
                        ({currentStep.changePct > 0 ? "+" : ""}
                        {currentStep.changePct.toFixed(1)}%)
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      from previous
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                data-ocid="price_replay.prev_button"
                onClick={() => {
                  setStep((p) => Math.max(0, p - 1));
                  setIsPlaying(false);
                }}
                disabled={step === 0}
                className="p-2 rounded-lg border border-steel-border bg-surface text-muted-foreground hover:text-foreground hover:border-amber/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                data-ocid="price_replay.play_button"
                onClick={() => {
                  if (step >= timeline.length - 1) {
                    setStep(0);
                    setIsPlaying(true);
                  } else {
                    setIsPlaying((v) => !v);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber text-charcoal font-semibold text-sm hover:bg-amber/90 transition-colors"
                aria-label={isPlaying ? "Pause replay" : "Play replay"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isPlaying
                  ? "Pause"
                  : step >= timeline.length - 1
                    ? "Replay"
                    : "Play"}
              </button>

              <button
                type="button"
                data-ocid="price_replay.next_button"
                onClick={() => {
                  setStep((p) => Math.min(timeline.length - 1, p + 1));
                  setIsPlaying(false);
                }}
                disabled={step === timeline.length - 1}
                className="p-2 rounded-lg border border-steel-border bg-surface text-muted-foreground hover:text-foreground hover:border-amber/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
