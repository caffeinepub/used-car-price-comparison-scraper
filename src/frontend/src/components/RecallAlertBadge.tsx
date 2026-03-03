import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink } from "lucide-react";
import React from "react";

interface RecallAlertBadgeProps {
  make: string;
  model: string;
  year: number;
}

interface NHTSARecall {
  Component: string;
  Consequence: string;
  Summary: string;
  NHTSACampaignNumber: string;
}

interface NHTSAResponse {
  Count: number;
  Results: NHTSARecall[];
}

function useNHTSARecalls(make: string, model: string, year: number) {
  return useQuery<NHTSAResponse>({
    queryKey: ["nhtsa-recalls", make, model, year],
    queryFn: async () => {
      const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("NHTSA API error");
      return res.json() as Promise<NHTSAResponse>;
    },
    enabled: !!make && !!model && year > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

function RecallAlertBadgeInner({ make, model, year }: RecallAlertBadgeProps) {
  const { data, isLoading } = useNHTSARecalls(make, model, year);

  if (isLoading || !data || data.Count === 0 || data.Results.length === 0) {
    return null;
  }

  const recalls = data.Results;
  const count = recalls.length;
  const nhtsaUrl = `https://www.nhtsa.gov/vehicle/${encodeURIComponent(make)}/${encodeURIComponent(model)}/${year}/recalls`;

  const truncate = (text: string, maxLen = 80) =>
    text && text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-ocid="recall_alert.badge"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30"
          title={`${count} open NHTSA recall${count !== 1 ? "s" : ""}`}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>
            {count} Recall{count !== 1 ? "s" : ""}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-ocid="recall_alert.popover"
        className="w-80 p-0 bg-white dark:bg-[oklch(0.17_0.02_260)] border border-red-200 dark:border-red-500/30 shadow-xl rounded-xl z-50"
        align="start"
        side="top"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Open NHTSA Recalls
            </p>
            <span className="ml-auto text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 rounded-full border border-red-200 dark:border-red-500/30">
              {count}
            </span>
          </div>
          <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
            {year} {make} {model}
          </p>
        </div>

        {/* Recall list */}
        <div className="py-2 px-1 max-h-60 overflow-y-auto">
          {recalls.slice(0, 3).map((recall, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static list order
              key={idx}
              className="px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/5 rounded-lg mx-1 transition-colors"
            >
              <p className="text-xs font-semibold text-foreground mb-0.5">
                {recall.Component || "Unknown Component"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {truncate(
                  recall.Consequence ||
                    recall.Summary ||
                    "No description available.",
                )}
              </p>
            </div>
          ))}
          {recalls.length > 3 && (
            <p className="text-xs text-muted-foreground px-3 py-1.5">
              +{recalls.length - 3} more recall
              {recalls.length - 3 !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Footer link */}
        <div className="px-4 py-2.5 border-t border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 rounded-b-xl">
          <a
            href={nhtsaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold hover:underline"
          >
            View all on NHTSA
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const RecallAlertBadge = React.memo(RecallAlertBadgeInner);
export default RecallAlertBadge;
