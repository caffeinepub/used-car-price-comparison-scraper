import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit2,
  LayoutDashboard,
  Minus,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
// Local type definition (matches backend PrivateNote)
interface PrivateNote {
  id: string;
  text: string;
  lastUpdated: bigint;
}
import ColumnCustomizationPanel from "../components/ColumnCustomizationPanel";
import ConfidenceScoreBadge from "../components/ConfidenceScoreBadge";
import DealExpiryBadge from "../components/DealExpiryBadge";
import DealerRatingBadge from "../components/DealerRatingBadge";
import ExportFilterPanel from "../components/ExportFilterPanel";
import ListingNoteButton from "../components/ListingNoteButton";
import NegotiationScoreBadge from "../components/NegotiationScoreBadge";
import OnboardingEmptyState from "../components/OnboardingEmptyState";
import PaginationControls from "../components/PaginationControls";
import PriceHistoryReplayModal from "../components/PriceHistoryReplayModal";
import RecallAlertBadge from "../components/RecallAlertBadge";
import StaleListingReminderPanel from "../components/StaleListingReminderPanel";
import { useActor } from "../hooks/useActor";
import { useColumnPreferences } from "../hooks/useColumnPreferences";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddDashboardWidget,
  useArchiveListing,
  useBulkArchiveByAge,
  useDashboardWidgets,
  useDeleteListing,
  useGetAllListings,
  useGetDashboardStats,
  useGetDealScores,
  useGetDistinctMakes,
  useGetDistinctModels,
  useGetPriceTrend,
  useGetStaleListings,
  useRemoveDashboardWidget,
  useUpdateListing,
} from "../hooks/useQueries";
import type { DashboardWidget } from "../hooks/useQueries";

// ─── Widget Card ──────────────────────────────────────────────────────────────

interface WidgetCardProps {
  widget: DashboardWidget;
  listings: any[];
  onRemove: (id: bigint) => void;
  isRemoving: boolean;
}

function WidgetCard({
  widget,
  listings,
  onRemove,
  isRemoving,
}: WidgetCardProps) {
  const widgetListings = listings.filter(
    (l) => l.make === widget.make && l.model === widget.model && !l.archived,
  );

  const avgPrice =
    widgetListings.length > 0
      ? Math.round(
          widgetListings.reduce(
            (sum: number, l: any) => sum + Number(l.price),
            0,
          ) / widgetListings.length,
        )
      : 0;

  const goodDeals = widgetListings.filter((l: any) => {
    if (avgPrice === 0) return false;
    return Number(l.price) < avgPrice * 0.9;
  }).length;

  const { data: trend } = useGetPriceTrend(widget.make, widget.model);

  const trendIcon =
    trend === "up" ? (
      <TrendingUp className="w-3.5 h-3.5 text-red-400" />
    ) : trend === "down" ? (
      <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <Minus className="w-3.5 h-3.5 text-amber-400" />
    );

  const trendLabel =
    trend === "up"
      ? "Trending Up"
      : trend === "down"
        ? "Trending Down"
        : "Stable";

  const trendColor =
    trend === "up"
      ? "text-red-700 dark:text-red-400"
      : trend === "down"
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-amber-700 dark:text-amber-400";

  return (
    <div className="card-panel p-4 relative group">
      <button
        type="button"
        onClick={() => onRemove(widget.id)}
        disabled={isRemoving}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-surface border border-steel-border text-muted-foreground hover:text-red-400 hover:border-red-400/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs disabled:opacity-50"
        title="Remove widget"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="mb-3 pr-6">
        <div className="font-semibold text-foreground text-sm">
          {widget.make} {widget.model}
        </div>
        {widget.customLabel && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            {widget.customLabel}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-background rounded-lg p-2 border border-steel-border/50">
          <div className="text-muted-foreground mb-0.5">Avg Price</div>
          <div className="font-semibold text-foreground">
            {avgPrice > 0 ? `$${avgPrice.toLocaleString()}` : "—"}
          </div>
        </div>
        <div className="bg-background rounded-lg p-2 border border-steel-border/50">
          <div className="text-muted-foreground mb-0.5">Listings</div>
          <div className="font-semibold text-foreground">
            {widgetListings.length}
          </div>
        </div>
        <div className="bg-background rounded-lg p-2 border border-steel-border/50">
          <div className="text-muted-foreground mb-0.5">Good Deals</div>
          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
            {goodDeals}
          </div>
        </div>
        <div className="bg-background rounded-lg p-2 border border-steel-border/50">
          <div className="text-muted-foreground mb-0.5">Trend</div>
          <div
            className={`font-semibold flex items-center gap-1 ${trendColor}`}
          >
            {trendIcon}
            <span>{trendLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Widget Form ──────────────────────────────────────────────────────────

interface AddWidgetFormProps {
  onAdd: (make: string, model: string, customLabel?: string) => void;
  isAdding: boolean;
  onCancel: () => void;
}

function AddWidgetForm({ onAdd, isAdding, onCancel }: AddWidgetFormProps) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [label, setLabel] = useState("");

  const { data: makes = [] } = useGetDistinctMakes();
  const { data: models = [] } = useGetDistinctModels(make);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model) return;
    onAdd(make, model, label || undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card-panel p-4 border-amber-500/30 border"
    >
      <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3">
        Add Widget
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label
            htmlFor="widget-make"
            className="block text-xs text-muted-foreground mb-1"
          >
            Make *
          </label>
          <select
            id="widget-make"
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
            required
            className="w-full bg-surface border border-steel-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-amber-500"
          >
            <option value="">Select make…</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="widget-model"
            className="block text-xs text-muted-foreground mb-1"
          >
            Model *
          </label>
          <select
            id="widget-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
            disabled={!make}
            className="w-full bg-surface border border-steel-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-amber-500 disabled:opacity-50"
          >
            <option value="">Select model…</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="widget-label"
            className="block text-xs text-muted-foreground mb-1"
          >
            Label (optional)
          </label>
          <input
            id="widget-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Daily Driver"
            className="w-full bg-surface border border-steel-border rounded-lg px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!make || !model || isAdding}
          className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isAdding && (
            <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          )}
          Add Widget
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-steel-border text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── My Widgets Section ───────────────────────────────────────────────────────

interface MyWidgetsSectionProps {
  listings: any[];
}

function MyWidgetsSection({ listings }: MyWidgetsSectionProps) {
  const { identity } = useInternetIdentity();
  const [showAddForm, setShowAddForm] = useState(false);
  const [limitWarning, setLimitWarning] = useState(false);

  const { data: widgets = [], isLoading } = useDashboardWidgets();
  const addWidget = useAddDashboardWidget();
  const removeWidget = useRemoveDashboardWidget();

  if (!identity) return null;

  const handleAdd = async (
    make: string,
    model: string,
    customLabel?: string,
  ) => {
    const result = await addWidget.mutateAsync({ make, model, customLabel });
    if (result === BigInt(0)) {
      setLimitWarning(true);
      setTimeout(() => setLimitWarning(false), 5000);
    } else {
      setShowAddForm(false);
    }
  };

  const handleRemove = (id: bigint) => {
    removeWidget.mutate(id);
  };

  return (
    <div className="card-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-foreground">My Widgets</h2>
          {widgets.length > 0 && (
            <span className="text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-steel-border">
              {widgets.length}/8
            </span>
          )}
        </div>
        {!showAddForm && widgets.length < 8 && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Widget
          </button>
        )}
      </div>

      {limitWarning && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Widget limit reached — remove an existing widget to add a new one.
        </div>
      )}

      {showAddForm && (
        <div className="mb-4">
          <AddWidgetForm
            onAdd={handleAdd}
            isAdding={addWidget.isPending}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && widgets.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No widgets yet — add a make/model card to track it here.
        </div>
      )}

      {!isLoading && widgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {widgets.map((widget) => (
            <WidgetCard
              key={String(widget.id)}
              widget={widget}
              listings={listings}
              onRemove={handleRemove}
              isRemoving={removeWidget.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

type SortField =
  | "make"
  | "model"
  | "year"
  | "price"
  | "mileage"
  | "timestamp"
  | "source"
  | "condition";
type SortDirection = "asc" | "desc";

interface EditState {
  id: string;
  field: string;
  value: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor } = useActor();

  const { data: allListings = [], isLoading: listingsLoading } =
    useGetAllListings();
  const { data: stats } = useGetDashboardStats();
  const { data: staleListings = [] } = useGetStaleListings(30);

  const deleteListing = useDeleteListing();
  const updateListing = useUpdateListing();
  const archiveListing = useArchiveListing();
  const bulkArchiveByAge = useBulkArchiveByAge();

  // ── Private notes state ───────────────────────────────────────────────────
  const [notesMap, setNotesMap] = useState<Map<string, PrivateNote>>(new Map());

  useEffect(() => {
    if (!identity || !actor) return;
    let cancelled = false;
    (actor as any)
      .getAllPrivateNotes()
      .then((notes) => {
        if (cancelled) return;
        setNotesMap(new Map(notes.map((n) => [n.id, n])));
      })
      .catch(() => {
        /* silent — notes are non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, [identity, actor]);

  const handleNoteChange = useCallback(
    (listingId: string, note: PrivateNote | null) => {
      setNotesMap((prev) => {
        const next = new Map(prev);
        if (note === null) {
          next.delete(listingId);
        } else {
          next.set(listingId, note);
        }
        return next;
      });
    },
    [],
  );

  const {
    columns,
    hiddenKeys,
    visibleColumns,
    toggleColumn,
    moveColumn,
    reorderColumns,
  } = useColumnPreferences();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMake, setFilterMake] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showBulkArchiveDialog, setShowBulkArchiveDialog] = useState(false);
  const [bulkArchiveDays, setBulkArchiveDays] = useState(90);
  const [staleReminderDismissed, setStaleReminderDismissed] = useState(false);
  const [replayListing, setReplayListing] = useState<any>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        document.getElementById("dashboard-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeListings = allListings.filter((l: any) => !l.archived);
  const archivedListings = allListings.filter((l: any) => l.archived);
  const displayListings = showArchived ? archivedListings : activeListings;

  const makes = Array.from(
    new Set(allListings.map((l: any) => l.make)),
  ).sort() as string[];
  const models = Array.from(
    new Set(
      allListings
        .filter((l: any) => !filterMake || l.make === filterMake)
        .map((l: any) => l.model),
    ),
  ).sort() as string[];
  const conditions = Array.from(
    new Set(allListings.map((l: any) => l.condition).filter(Boolean)),
  ).sort() as string[];
  const sources = Array.from(
    new Set(allListings.map((l: any) => l.source).filter(Boolean)),
  ).sort() as string[];

  const filtered = displayListings.filter((l: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      l.make?.toLowerCase().includes(q) ||
      l.model?.toLowerCase().includes(q) ||
      l.trim?.toLowerCase().includes(q) ||
      l.dealerName?.toLowerCase().includes(q) ||
      l.source?.toLowerCase().includes(q);
    const matchesMake = !filterMake || l.make === filterMake;
    const matchesModel = !filterModel || l.model === filterModel;
    const matchesCondition =
      !filterCondition || l.condition === filterCondition;
    const matchesSource = !filterSource || l.source === filterSource;
    return (
      matchesSearch &&
      matchesMake &&
      matchesModel &&
      matchesCondition &&
      matchesSource
    );
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (sortField === "timestamp") {
      aVal = Number(a.timestamp);
      bVal = Number(b.timestamp);
    } else if (
      sortField === "price" ||
      sortField === "mileage" ||
      sortField === "year"
    ) {
      aVal = Number(aVal);
      bVal = Number(bVal);
    } else {
      aVal = String(aVal ?? "").toLowerCase();
      bVal = String(bVal ?? "").toLowerCase();
    }
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  );

  const pageIds = paginated.map((l: any) => l.id);
  const { data: dealScores = [] } = useGetDealScores(pageIds);

  const getDealScore = (id: string) =>
    (dealScores as any[]).find((d: any) => d.listingId === id);

  // Build a set of visible column keys for fast lookup
  const visibleColumnKeys = new Set(visibleColumns.map((c) => c.key));
  const isVisible = (key: string) => visibleColumnKeys.has(key);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((l: any) => l.id)));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    await deleteListing.mutateAsync(id);
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteListing.mutateAsync(id);
    }
    setSelectedIds(new Set());
  };

  const handleArchive = async (id: string) => {
    await archiveListing.mutateAsync(id);
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const handleEditSave = async () => {
    if (!editState) return;
    const numericFields = ["price", "mileage", "year"];
    await updateListing.mutateAsync({
      id: editState.id,
      updates: {
        [editState.field]: numericFields.includes(editState.field)
          ? Number(editState.value)
          : editState.value,
      },
    });
    setEditState(null);
  };

  const handleBulkArchiveByAge = async () => {
    await bulkArchiveByAge.mutateAsync(bulkArchiveDays);
    setShowBulkArchiveDialog(false);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 text-amber-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-amber-400" />
    );
  };

  const formatTimestamp = (ts: any) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDealBadge = (id: string) => {
    const ds = getDealScore(id);
    if (!ds) return null;
    const rating = ds.dealRating as string;
    const colorMap: Record<string, string> = {
      great:
        "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30",
      good: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30",
      fair: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/30",
      poor: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30",
    };
    const cls =
      colorMap[rating.toLowerCase()] ??
      "bg-surface text-muted-foreground border-steel-border";
    return (
      <span
        className={`text-xs px-1.5 py-0.5 rounded border font-medium capitalize ${cls}`}
      >
        {rating}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-screen-2xl mx-auto px-4 py-8 space-y-6">
        {/* Stale Listing Reminder */}
        {!staleReminderDismissed && (staleListings as any[]).length > 0 && (
          <StaleListingReminderPanel
            staleListings={staleListings as any[]}
            onDismissAll={() => setStaleReminderDismissed(true)}
          />
        )}

        {/* My Widgets */}
        <MyWidgetsSection listings={allListings as any[]} />

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-panel p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Listings
              </div>
              <div className="text-3xl font-bold text-foreground font-display">
                {Number(stats.totalListings).toLocaleString()}
              </div>
            </div>
            <div className="card-panel p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Average Price
              </div>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-400 font-display">
                $
                {Number(stats.averagePrice).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div className="card-panel p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Added This Week
              </div>
              <div className="text-3xl font-bold text-foreground font-display">
                {Number(stats.listingsThisWeek).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="dashboard-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search listings… (Ctrl+F)"
              className="w-full pl-9 pr-3 py-2 bg-surface border border-steel-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Make filter */}
          <select
            value={filterMake}
            onChange={(e) => {
              setFilterMake(e.target.value);
              setFilterModel("");
              setCurrentPage(1);
            }}
            className="bg-surface border border-steel-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500"
          >
            <option value="">All Makes</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Model filter */}
          <select
            value={filterModel}
            onChange={(e) => {
              setFilterModel(e.target.value);
              setCurrentPage(1);
            }}
            disabled={!filterMake}
            className="bg-surface border border-steel-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500 disabled:opacity-50"
          >
            <option value="">All Models</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Condition filter */}
          <select
            value={filterCondition}
            onChange={(e) => {
              setFilterCondition(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-steel-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500"
          >
            <option value="">All Conditions</option>
            {conditions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Source filter */}
          <select
            value={filterSource}
            onChange={(e) => {
              setFilterSource(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-steel-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Archived toggle */}
          <button
            type="button"
            onClick={() => {
              setShowArchived((v) => !v);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              showArchived
                ? "bg-amber-100 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/50 text-amber-700 dark:text-amber-400"
                : "bg-surface border-steel-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {showArchived ? "Archived" : "Active"}
          </button>

          {/* Bulk archive by age */}
          <button
            type="button"
            onClick={() => setShowBulkArchiveDialog(true)}
            className="px-3 py-2 rounded-lg border border-steel-border bg-surface text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Archive className="w-4 h-4" />
            Archive Old
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={() => setShowExportPanel(true)}
            className="px-3 py-2 rounded-lg border border-steel-border bg-surface text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Column customization */}
          <ColumnCustomizationPanel
            columns={columns}
            hiddenKeys={hiddenKeys}
            onToggle={toggleColumn}
            onMove={moveColumn}
            onReorder={reorderColumns}
          />

          {/* Add listing */}
          <button
            type="button"
            onClick={() => navigate({ to: "/add" })}
            className="px-3 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Listing
          </button>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30">
            <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={deleteListing.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 text-sm hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        {listingsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 &&
          !searchQuery &&
          !filterMake &&
          !filterModel &&
          !filterCondition &&
          !filterSource &&
          !showArchived ? (
          <OnboardingEmptyState />
        ) : (
          <>
            <div className="card-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-steel-border text-muted-foreground">
                      <th className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.size === paginated.length &&
                            paginated.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-steel-border"
                        />
                      </th>
                      {isVisible("make") && (
                        <th
                          className="text-left px-3 py-3 cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort("make")}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSort("make")
                          }
                          scope="col"
                        >
                          <span className="flex items-center gap-1">
                            Make <SortIcon field="make" />
                          </span>
                        </th>
                      )}
                      {isVisible("model") && (
                        <th
                          className="text-left px-3 py-3 cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort("model")}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSort("model")
                          }
                          scope="col"
                        >
                          <span className="flex items-center gap-1">
                            Model <SortIcon field="model" />
                          </span>
                        </th>
                      )}
                      {isVisible("year") && (
                        <th
                          className="text-left px-3 py-3 cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort("year")}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSort("year")
                          }
                          scope="col"
                        >
                          <span className="flex items-center gap-1">
                            Year <SortIcon field="year" />
                          </span>
                        </th>
                      )}
                      {isVisible("price") && (
                        <th
                          className="text-left px-3 py-3 cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort("price")}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSort("price")
                          }
                          scope="col"
                        >
                          <span className="flex items-center gap-1">
                            Price <SortIcon field="price" />
                          </span>
                        </th>
                      )}
                      {isVisible("mileage") && (
                        <th
                          className="text-left px-3 py-3 cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort("mileage")}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSort("mileage")
                          }
                          scope="col"
                        >
                          <span className="flex items-center gap-1">
                            Mileage <SortIcon field="mileage" />
                          </span>
                        </th>
                      )}
                      {isVisible("trim") && (
                        <th className="text-left px-3 py-3">Trim</th>
                      )}
                      {isVisible("condition") && (
                        <th
                          className="text-left px-3 py-3 cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort("condition")}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSort("condition")
                          }
                          scope="col"
                        >
                          <span className="flex items-center gap-1">
                            Condition <SortIcon field="condition" />
                          </span>
                        </th>
                      )}
                      {isVisible("source") && (
                        <th
                          className="text-left px-3 py-3 cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort("source")}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSort("source")
                          }
                          scope="col"
                        >
                          <span className="flex items-center gap-1">
                            Source <SortIcon field="source" />
                          </span>
                        </th>
                      )}
                      {isVisible("dealerName") && (
                        <th className="text-left px-3 py-3">Dealer</th>
                      )}
                      {isVisible("timestamp") && (
                        <th
                          className="text-left px-3 py-3 cursor-pointer hover:text-foreground transition-colors select-none"
                          onClick={() => handleSort("timestamp")}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSort("timestamp")
                          }
                          scope="col"
                        >
                          <span className="flex items-center gap-1">
                            Date <SortIcon field="timestamp" />
                          </span>
                        </th>
                      )}
                      {isVisible("deal") && (
                        <th className="text-left px-3 py-3">Deal</th>
                      )}
                      {isVisible("negotiation") && (
                        <th className="text-left px-3 py-3">Negotiation</th>
                      )}
                      {isVisible("expiry") && (
                        <th className="text-left px-3 py-3">Expiry</th>
                      )}
                      {isVisible("confidence") && (
                        <th className="text-left px-3 py-3">Confidence</th>
                      )}
                      {isVisible("recalls") && (
                        <th className="text-left px-3 py-3">Recalls</th>
                      )}
                      <th className="text-left px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td
                          colSpan={20}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No listings match your filters.
                        </td>
                      </tr>
                    ) : (
                      paginated.map((listing: any) => {
                        // Capture a non-null snapshot for use inside this row's handlers
                        const currentEdit =
                          editState?.id === listing.id ? editState : null;
                        return (
                          <tr
                            key={listing.id}
                            className={`border-b border-steel-border/40 hover:bg-surface/50 transition-colors ${
                              selectedIds.has(listing.id)
                                ? "bg-amber-500/5"
                                : ""
                            }`}
                          >
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(listing.id)}
                                onChange={() => handleSelect(listing.id)}
                                className="rounded border-steel-border"
                              />
                            </td>
                            {isVisible("make") && (
                              <td className="px-3 py-3 font-medium text-foreground">
                                {currentEdit?.field === "make" ? (
                                  <input
                                    value={currentEdit.value}
                                    onChange={(e) =>
                                      setEditState({
                                        id: listing.id,
                                        field: "make",
                                        value: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleEditSave();
                                      if (e.key === "Escape")
                                        setEditState(null);
                                    }}
                                    className="w-full bg-background border border-amber-500 rounded px-2 py-0.5 text-sm focus:outline-none"
                                  />
                                ) : (
                                  listing.make
                                )}
                              </td>
                            )}
                            {isVisible("model") && (
                              <td className="px-3 py-3 text-foreground">
                                {currentEdit?.field === "model" ? (
                                  <input
                                    value={currentEdit.value}
                                    onChange={(e) =>
                                      setEditState({
                                        id: listing.id,
                                        field: "model",
                                        value: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleEditSave();
                                      if (e.key === "Escape")
                                        setEditState(null);
                                    }}
                                    className="w-full bg-background border border-amber-500 rounded px-2 py-0.5 text-sm focus:outline-none"
                                  />
                                ) : (
                                  listing.model
                                )}
                              </td>
                            )}
                            {isVisible("year") && (
                              <td className="px-3 py-3 text-muted-foreground">
                                {currentEdit?.field === "year" ? (
                                  <input
                                    type="number"
                                    value={currentEdit.value}
                                    onChange={(e) =>
                                      setEditState({
                                        id: listing.id,
                                        field: "year",
                                        value: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleEditSave();
                                      if (e.key === "Escape")
                                        setEditState(null);
                                    }}
                                    className="w-20 bg-background border border-amber-500 rounded px-2 py-0.5 text-sm focus:outline-none"
                                  />
                                ) : (
                                  String(listing.year)
                                )}
                              </td>
                            )}
                            {isVisible("price") && (
                              <td className="px-3 py-3 text-amber-600 dark:text-amber-400 font-semibold">
                                {currentEdit?.field === "price" ? (
                                  <input
                                    type="number"
                                    value={currentEdit.value}
                                    onChange={(e) =>
                                      setEditState({
                                        id: listing.id,
                                        field: "price",
                                        value: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleEditSave();
                                      if (e.key === "Escape")
                                        setEditState(null);
                                    }}
                                    className="w-28 bg-background border border-amber-500 rounded px-2 py-0.5 text-sm focus:outline-none"
                                  />
                                ) : (
                                  `$${Number(listing.price).toLocaleString()}`
                                )}
                              </td>
                            )}
                            {isVisible("mileage") && (
                              <td className="px-3 py-3 text-muted-foreground">
                                {currentEdit?.field === "mileage" ? (
                                  <input
                                    type="number"
                                    value={currentEdit.value}
                                    onChange={(e) =>
                                      setEditState({
                                        id: listing.id,
                                        field: "mileage",
                                        value: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleEditSave();
                                      if (e.key === "Escape")
                                        setEditState(null);
                                    }}
                                    className="w-28 bg-background border border-amber-500 rounded px-2 py-0.5 text-sm focus:outline-none"
                                  />
                                ) : (
                                  Number(listing.mileage).toLocaleString()
                                )}
                              </td>
                            )}
                            {isVisible("trim") && (
                              <td className="px-3 py-3 text-muted-foreground">
                                {listing.trim || "—"}
                              </td>
                            )}
                            {isVisible("condition") && (
                              <td className="px-3 py-3 text-muted-foreground capitalize">
                                {listing.condition || "—"}
                              </td>
                            )}
                            {isVisible("source") && (
                              <td className="px-3 py-3 text-muted-foreground">
                                {listing.source || "—"}
                              </td>
                            )}
                            {isVisible("dealerName") && (
                              <td className="px-3 py-3 text-muted-foreground">
                                <div className="flex flex-col gap-0.5">
                                  <span>{listing.dealerName || "—"}</span>
                                  {listing.dealerName && (
                                    <DealerRatingBadge
                                      dealerName={listing.dealerName}
                                    />
                                  )}
                                </div>
                              </td>
                            )}
                            {isVisible("timestamp") && (
                              <td className="px-3 py-3 text-muted-foreground text-xs">
                                {formatTimestamp(listing.timestamp)}
                              </td>
                            )}
                            {isVisible("deal") && (
                              <td className="px-3 py-3">
                                {getDealBadge(listing.id)}
                              </td>
                            )}
                            {isVisible("negotiation") && (
                              <td
                                className="px-3 py-3"
                                data-ocid={`dashboard.negotiation_score_cell.${paginated.indexOf(listing) + 1}`}
                              >
                                <NegotiationScoreBadge listingId={listing.id} />
                              </td>
                            )}
                            {isVisible("expiry") && (
                              <td
                                className="px-3 py-3"
                                data-ocid={`dashboard.expiry_prediction_cell.${paginated.indexOf(listing) + 1}`}
                              >
                                <DealExpiryBadge listingId={listing.id} />
                              </td>
                            )}
                            {isVisible("confidence") && (
                              <td
                                className="px-3 py-3"
                                data-ocid={`dashboard.confidence_score_cell.${paginated.indexOf(listing) + 1}`}
                              >
                                <ConfidenceScoreBadge listingId={listing.id} />
                              </td>
                            )}
                            {isVisible("recalls") && (
                              <td
                                className="px-3 py-3"
                                data-ocid={`dashboard.recall_alert_cell.${paginated.indexOf(listing) + 1}`}
                              >
                                <RecallAlertBadge
                                  make={listing.make ?? ""}
                                  model={listing.model ?? ""}
                                  year={Number(listing.year) ?? 0}
                                />
                              </td>
                            )}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                {currentEdit ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={handleEditSave}
                                      disabled={updateListing.isPending}
                                      className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-50"
                                      title="Save"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditState(null)}
                                      className="p-1.5 rounded hover:bg-surface text-muted-foreground transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditState({
                                          id: listing.id,
                                          field: "price",
                                          value: String(listing.price),
                                        })
                                      }
                                      className="p-1.5 rounded hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
                                      title="Edit price"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    {!listing.archived && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleArchive(listing.id)
                                        }
                                        disabled={archiveListing.isPending}
                                        className="p-1.5 rounded hover:bg-amber-500/20 text-muted-foreground hover:text-amber-400 transition-colors disabled:opacity-50"
                                        title="Archive"
                                      >
                                        <Archive className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(listing.id)}
                                      disabled={deleteListing.isPending}
                                      className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <Link
                                      to="/ownership-cost"
                                      search={{
                                        make: listing.make,
                                        model: listing.model,
                                        year: String(listing.year),
                                        price: String(listing.price),
                                        mileage: String(listing.mileage),
                                      }}
                                      className="p-1.5 rounded hover:bg-amber-500/20 text-muted-foreground hover:text-amber-400 transition-colors"
                                      title="Calc ownership cost"
                                    >
                                      <Calculator className="w-3.5 h-3.5" />
                                    </Link>
                                    <ListingNoteButton
                                      listingId={listing.id}
                                      note={notesMap.get(listing.id) ?? null}
                                      isAuthenticated={Boolean(identity)}
                                      onNoteChange={handleNoteChange}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setReplayListing(listing)}
                                      className="p-1.5 rounded hover:bg-amber-500/20 text-muted-foreground hover:text-amber-400 transition-colors"
                                      title="Price history replay"
                                      data-ocid={`dashboard.price_replay.${paginated.indexOf(listing) + 1}.button`}
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <PaginationControls
              currentPage={safePage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              totalRows={sorted.length}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(n) => {
                setRowsPerPage(n);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Export Panel */}
      {showExportPanel && (
        <ExportFilterPanel onClose={() => setShowExportPanel(false)} />
      )}

      {/* Price History Replay Modal */}
      {replayListing && (
        <PriceHistoryReplayModal
          listing={replayListing}
          open={Boolean(replayListing)}
          onClose={() => setReplayListing(null)}
        />
      )}

      {/* Bulk Archive Dialog */}
      <AlertDialog
        open={showBulkArchiveDialog}
        onOpenChange={setShowBulkArchiveDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Old Listings</AlertDialogTitle>
            <AlertDialogDescription>
              Archive all active listings older than the specified number of
              days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label
              htmlFor="bulk-archive-days"
              className="block text-sm text-muted-foreground mb-2"
            >
              Days old threshold
            </label>
            <input
              id="bulk-archive-days"
              type="number"
              min={1}
              value={bulkArchiveDays}
              onChange={(e) => setBulkArchiveDays(Number(e.target.value))}
              className="w-full bg-surface border border-steel-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-amber-500"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkArchiveByAge}
              disabled={bulkArchiveByAge.isPending}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {bulkArchiveByAge.isPending ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
