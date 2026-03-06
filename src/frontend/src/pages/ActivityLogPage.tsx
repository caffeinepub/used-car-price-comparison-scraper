import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Archive,
  ArchiveRestore,
  ClipboardList,
  Edit3,
  GitMerge,
  Layers,
  Search,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useActivityLog } from "../hooks/useQueries";

interface ActivityLogEntry {
  id: bigint;
  action: string;
  listingId?: bigint | null;
  affectedIds: bigint[];
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  principal: { toString(): string };
  timestamp: bigint;
}

function formatRelativeTime(timestampNs: bigint): string {
  const ms = Number(timestampNs) / 1_000_000;
  const now = Date.now();
  const diffMs = now - ms;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(ms).toLocaleDateString();
}

function formatFullDate(timestampNs: bigint): string {
  const ms = Number(timestampNs) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function abbreviatePrincipal(principal: { toString(): string }): string {
  const str = principal.toString();
  if (str.length <= 10) return str;
  return `${str.slice(0, 5)}...${str.slice(-5)}`;
}

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  badgeClass: string;
}

function getActionConfig(action: string): ActionConfig {
  switch (action) {
    case "edit":
      return {
        label: "Listing Edited",
        icon: <Edit3 className="w-4 h-4" />,
        color: "text-amber-600 dark:text-amber-400",
        badgeClass:
          "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30",
      };
    case "archive":
      return {
        label: "Listing Archived",
        icon: <Archive className="w-4 h-4" />,
        color: "text-muted-foreground",
        badgeClass: "bg-muted text-muted-foreground border-border",
      };
    case "unarchive":
      return {
        label: "Listing Unarchived",
        icon: <ArchiveRestore className="w-4 h-4" />,
        color: "text-emerald-700 dark:text-emerald-400",
        badgeClass:
          "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30",
      };
    case "delete":
      return {
        label: "Listings Deleted",
        icon: <Trash2 className="w-4 h-4" />,
        color: "text-red-700 dark:text-red-400",
        badgeClass:
          "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30",
      };
    case "merge":
      return {
        label: "Listings Merged",
        icon: <GitMerge className="w-4 h-4" />,
        color: "text-purple-700 dark:text-purple-400",
        badgeClass:
          "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30",
      };
    case "bulk_edit":
      return {
        label: "Bulk Field Updated",
        icon: <Layers className="w-4 h-4" />,
        color: "text-amber-600 dark:text-amber-400",
        badgeClass:
          "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30",
      };
    default:
      return {
        label: action.charAt(0).toUpperCase() + action.slice(1),
        icon: <Activity className="w-4 h-4" />,
        color: "text-muted-foreground",
        badgeClass: "bg-muted text-muted-foreground border-border",
      };
  }
}

function ActivityLogSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
        <div
          key={key}
          className="flex gap-4 p-4 rounded-lg bg-surface border border-steel-border"
        >
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function ActivityLogEntryCard({ entry }: { entry: ActivityLogEntry }) {
  const config = getActionConfig(entry.action);
  const relTime = formatRelativeTime(entry.timestamp);
  const fullDate = formatFullDate(entry.timestamp);

  const affectedIdsDisplay =
    entry.affectedIds.length > 0
      ? entry.affectedIds
          .slice(0, 5)
          .map((id) => `#${id}`)
          .join(", ") +
        (entry.affectedIds.length > 5
          ? ` +${entry.affectedIds.length - 5} more`
          : "")
      : entry.listingId != null
        ? `#${entry.listingId}`
        : null;

  return (
    <div className="flex gap-4 p-4 rounded-lg bg-surface border border-steel-border hover:border-amber-400/40 transition-colors">
      <div className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded border ${config.badgeClass}`}
          >
            {config.label}
          </span>
          {affectedIdsDisplay && (
            <span className="text-xs text-muted-foreground font-mono">
              {affectedIdsDisplay}
            </span>
          )}
        </div>

        {entry.fieldChanged && (
          <div className="text-xs text-muted-foreground mt-1">
            <span className="text-foreground/70 font-medium">
              {entry.fieldChanged}:
            </span>{" "}
            {entry.oldValue && (
              <>
                <span className="line-through text-red-600/70 dark:text-red-400/70">
                  {entry.oldValue}
                </span>
                <span className="mx-1 text-muted-foreground">→</span>
              </>
            )}
            {entry.newValue && (
              <span className="text-emerald-700/80 dark:text-emerald-400/80">
                {entry.newValue}
              </span>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-1 font-mono">
          by {abbreviatePrincipal(entry.principal)}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span
          className="text-xs text-muted-foreground cursor-default"
          title={fullDate}
        >
          {relTime}
        </span>
      </div>
    </div>
  );
}

export default function ActivityLogPage() {
  const { data: entries, isLoading } = useActivityLog(100);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!entries) return [];
    if (!search.trim()) return entries as ActivityLogEntry[];
    const q = search.toLowerCase();
    return (entries as ActivityLogEntry[]).filter((e) => {
      const actionLabel = getActionConfig(e.action).label.toLowerCase();
      const ids = [
        ...(e.listingId != null ? [e.listingId.toString()] : []),
        ...e.affectedIds.map((id) => id.toString()),
      ];
      return (
        actionLabel.includes(q) ||
        e.action.toLowerCase().includes(q) ||
        ids.some((id) => id.includes(q)) ||
        (e.fieldChanged?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [entries, search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title="Activity Log"
          description="History of all changes made to listings"
          icon={<ClipboardList className="w-6 h-6" />}
        />

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by action type or listing ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface border-steel-border text-foreground placeholder:text-muted-foreground focus:border-amber-400/50"
          />
        </div>

        {isLoading ? (
          <ActivityLogSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
            <p className="text-lg font-medium text-foreground mb-1">
              {search ? "No matching entries" : "No activity recorded yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Changes to listings will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              {search ? " matching your filter" : ""}
            </p>
            {filtered.map((entry) => (
              <ActivityLogEntryCard key={Number(entry.id)} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
