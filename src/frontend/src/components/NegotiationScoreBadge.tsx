import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingDown } from "lucide-react";
import React from "react";
import { useGetNegotiationScore } from "../hooks/useQueries";

interface NegotiationScoreBadgeProps {
  listingId: string;
}

function NegotiationScoreBadgeInner({ listingId }: NegotiationScoreBadgeProps) {
  const { data: score, isLoading } = useGetNegotiationScore(listingId);

  if (isLoading) {
    return <Skeleton className="h-5 w-16 rounded" />;
  }

  if (!score) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const numScore = Number(score.score);
  const label = score.scoreLabel as string;
  const factors = score.factors as string[];

  let badgeClass = "bg-muted text-muted-foreground border-border";
  if (label === "High") {
    badgeClass =
      "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30";
  } else if (label === "Medium") {
    badgeClass =
      "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30";
  } else if (label === "Low") {
    badgeClass =
      "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30";
  }

  const labelText =
    label === "High"
      ? "High Wiggle Room"
      : label === "Medium"
        ? "Some Room"
        : "Little Room";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${badgeClass}`}
          >
            <TrendingDown className="w-3 h-3 shrink-0" />
            <span>{numScore}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-surface border border-steel-border text-foreground shadow-xl max-w-xs p-3"
        >
          <div className="mb-1.5">
            <span
              className={`text-xs font-semibold ${badgeClass.split(" ")[1]}`}
            >
              {labelText}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              (Score: {numScore}/100)
            </span>
          </div>
          {factors.length > 0 && (
            <ul className="space-y-0.5">
              {factors.map((f, i) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: static factors list
                  key={i}
                  className="text-xs text-muted-foreground flex items-start gap-1"
                >
                  <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-current opacity-50 translate-y-1" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const NegotiationScoreBadge = React.memo(NegotiationScoreBadgeInner);
export default NegotiationScoreBadge;
