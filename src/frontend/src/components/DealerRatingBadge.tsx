import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";
import { useGetAggregateDealerRating } from "../hooks/useQueries";

interface DealerRatingBadgeProps {
  dealerName: string;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <title>{filled ? "Filled star" : "Empty star"}</title>
      <polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.5,11 6,8.5 2.5,11 3.5,7 0.5,4.5 4.5,4.5" />
    </svg>
  );
}

function DealerRatingBadgeInner({ dealerName }: DealerRatingBadgeProps) {
  const { data: aggregate } = useGetAggregateDealerRating(
    dealerName?.trim() ?? "",
  );

  if (!aggregate || Number(aggregate.count) === 0 || !dealerName?.trim()) {
    return null;
  }

  const avg = aggregate.avgRating;
  const count = Number(aggregate.count);
  const displayAvg = avg.toFixed(1);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-400 hover:opacity-80 transition-opacity cursor-pointer"
            aria-label={`Dealer rating: ${displayAvg} out of 5 from ${count} review${count !== 1 ? "s" : ""}`}
          >
            <StarIcon filled={true} />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-0.5">
              {displayAvg}
            </span>
            <span className="text-xs text-muted-foreground ml-0.5">
              ({count})
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-surface border border-steel-border text-foreground shadow-xl p-2"
        >
          <p className="text-xs font-semibold">{dealerName}</p>
          <p className="text-xs text-muted-foreground">
            {displayAvg}/5 avg from {count} community review
            {count !== 1 ? "s" : ""}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const DealerRatingBadge = React.memo(DealerRatingBadgeInner);
export default DealerRatingBadge;
