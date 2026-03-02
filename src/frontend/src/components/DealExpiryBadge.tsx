import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Flame, Timer } from "lucide-react";
import React from "react";
import { useGetDealExpiryPrediction } from "../hooks/useQueries";

interface DealExpiryBadgeProps {
  listingId: string;
}

function DealExpiryBadgeInner({ listingId }: DealExpiryBadgeProps) {
  const { data: prediction, isLoading } = useGetDealExpiryPrediction(listingId);

  if (isLoading) {
    return <Skeleton className="h-5 w-14 rounded" />;
  }

  if (!prediction) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const urgency = prediction.urgency as string;
  const days = Number(prediction.estimatedDaysRemaining);

  let badgeClass = "bg-muted text-muted-foreground border-border";
  let Icon = Timer;

  if (urgency === "Hot") {
    badgeClass =
      "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30";
    Icon = Flame;
  } else if (urgency === "Active") {
    badgeClass =
      "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30";
    Icon = Clock;
  }

  const daysLabel = days === 1 ? "~1 day" : `~${days} days`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${badgeClass}`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span>{daysLabel}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-surface border border-steel-border text-foreground shadow-xl max-w-xs p-3"
        >
          <p className="text-xs font-semibold mb-0.5">
            {urgency === "Hot"
              ? "🔥 Hot Listing"
              : urgency === "Active"
                ? "⚡ Active Listing"
                : "❄️ Cooling Down"}
          </p>
          <p className="text-xs text-muted-foreground">
            Estimated time before this listing sells based on market velocity.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const DealExpiryBadge = React.memo(DealExpiryBadgeInner);
export default DealExpiryBadge;
