import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck } from "lucide-react";
import React from "react";
import { useGetConfidenceScore } from "../hooks/useQueries";

interface ConfidenceScoreBadgeProps {
  listingId: string;
}

function ConfidenceScoreBadgeInner({ listingId }: ConfidenceScoreBadgeProps) {
  const { data: scoreRaw, isLoading } = useGetConfidenceScore(listingId);

  if (isLoading) {
    return (
      <Skeleton
        className="h-5 w-12 rounded"
        data-ocid="confidence_score.loading_state"
      />
    );
  }

  if (scoreRaw === null || scoreRaw === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const score = Number(scoreRaw);

  let badgeClass: string;
  let label: string;
  if (score >= 70) {
    badgeClass =
      "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30";
    label = "High";
  } else if (score >= 40) {
    badgeClass =
      "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30";
    label = "Medium";
  } else {
    badgeClass =
      "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30";
    label = "Low";
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-ocid="confidence_score.badge"
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${badgeClass}`}
          >
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>{score}%</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-surface border border-steel-border text-foreground shadow-xl max-w-xs p-3"
        >
          <p className="text-xs font-semibold mb-0.5">
            Data Confidence: {label} ({score}/100)
          </p>
          <p className="text-xs text-muted-foreground">
            Data completeness score: {score}/100. Higher scores mean more
            complete listing data.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const ConfidenceScoreBadge = React.memo(ConfidenceScoreBadgeInner);
export default ConfidenceScoreBadge;
