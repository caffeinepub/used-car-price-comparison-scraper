import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  PlusCircle,
  Timer,
} from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useGetAllListings } from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function computeDaysOnLot(timestamp: bigint): number {
  const nowNs = Date.now() * 1_000_000;
  const ts = Number(timestamp);
  return Math.max(0, (nowNs - ts) / (1_000_000 * 86_400_000));
}

type StalenessLevel = "Fresh" | "Watch" | "Act Now" | "Urgent";

function getStaleness(days: number): StalenessLevel {
  if (days <= 14) return "Fresh";
  if (days <= 30) return "Watch";
  if (days <= 60) return "Act Now";
  return "Urgent";
}

function getDiscount(days: number): number {
  if (days <= 14) return 0;
  if (days <= 30) return 0.05;
  if (days <= 60) return 0.08;
  return 0.12;
}

function stalenessBadge(level: StalenessLevel) {
  const styles: Record<StalenessLevel, string> = {
    Fresh:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 border",
    Watch: "bg-amber/15 text-amber border-amber/30 border",
    "Act Now":
      "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 border",
    Urgent:
      "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 border",
  };
  return <Badge className={`${styles[level]} text-xs`}>{level}</Badge>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealerLotTrackerPage() {
  const { data: allListings = [], isLoading } = useGetAllListings();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | StalenessLevel>("All");

  const activeListings = useMemo(
    () => allListings.filter((l: any) => !l.archived),
    [allListings],
  );

  const enriched = useMemo(
    () =>
      activeListings.map((l: any) => {
        const days = computeDaysOnLot(BigInt(l.timestamp ?? 0));
        const staleness = getStaleness(days);
        const discountRate = getDiscount(days);
        const price = Number(l.price);
        const suggestedPrice = Math.round(price * (1 - discountRate));
        return { ...l, days, staleness, discountRate, suggestedPrice, price };
      }),
    [activeListings],
  );

  const sorted = useMemo(
    () => [...enriched].sort((a, b) => b.days - a.days),
    [enriched],
  );

  const filtered = useMemo(() => {
    let list = sorted;
    if (activeTab !== "All")
      list = list.filter((l) => l.staleness === activeTab);
    const q = search.toLowerCase();
    if (q)
      list = list.filter(
        (l) =>
          l.make?.toLowerCase().includes(q) ||
          l.model?.toLowerCase().includes(q) ||
          l.trim?.toLowerCase().includes(q),
      );
    return list;
  }, [sorted, activeTab, search]);

  // Summary stats
  const totalActive = enriched.length;
  const avgDays =
    enriched.length > 0
      ? enriched.reduce((s: number, l: any) => s + l.days, 0) / enriched.length
      : 0;
  const needsAction = enriched.filter((l) => l.days > 30).length;
  const potentialRevenue = enriched
    .filter((l) => l.discountRate > 0)
    .reduce((s: number, l: any) => s + l.suggestedPrice, 0);

  const TABS: Array<"All" | StalenessLevel> = [
    "All",
    "Fresh",
    "Watch",
    "Act Now",
    "Urgent",
  ];

  const tabCounts: Record<string, number> = {
    All: enriched.length,
    Fresh: enriched.filter((l) => l.staleness === "Fresh").length,
    Watch: enriched.filter((l) => l.staleness === "Watch").length,
    "Act Now": enriched.filter((l) => l.staleness === "Act Now").length,
    Urgent: enriched.filter((l) => l.staleness === "Urgent").length,
  };

  if (isLoading) {
    return (
      <div
        className="max-w-screen-xl mx-auto px-4 py-8"
        data-ocid="lot_tracker.loading_state"
      >
        <div className="space-y-4">
          {["s1", "s2", "s3", "s4", "s5"].map((s) => (
            <div
              key={s}
              className="h-12 bg-surface border border-steel-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 py-8 space-y-8"
      data-ocid="lot_tracker.page"
    >
      {/* Header */}
      <PageHeader
        title="Days-on-Lot Tracker"
        description="Flag stale inventory and get suggested discount amounts before listings go cold."
        icon={<Clock className="w-6 h-6" />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className="bg-surface border-steel-border"
          data-ocid="lot_tracker.summary.card"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-3.5 h-3.5 text-amber" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Active Inventory
              </p>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">
              {totalActive}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="w-3.5 h-3.5 text-amber" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Avg Days on Lot
              </p>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">
              {avgDays.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Needs Action
              </p>
            </div>
            <p className="text-2xl font-bold font-display text-orange-500 dark:text-orange-400">
              {needsAction}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              &gt;30 days on lot
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Revenue if Discounted
              </p>
            </div>
            <p className="text-xl font-bold font-display text-amber">
              {fmtCurrency(potentialRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {enriched.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="lot_tracker.empty_state"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-amber" />
          </div>
          <h3 className="text-lg font-bold text-foreground font-display mb-1">
            No inventory yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Add listings to track how long they've been on the lot and get
            suggested discount amounts.
          </p>
          <Link
            to="/add"
            className="px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-bold hover:bg-amber/90 transition-colors flex items-center gap-2"
            data-ocid="lot_tracker.add.link"
          >
            <PlusCircle className="w-4 h-4" />
            Add First Listing
          </Link>
        </div>
      )}

      {enriched.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make, model, trim…"
              data-ocid="lot_tracker.search_input"
              className="w-full sm:max-w-xs px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
            />
            <div
              className="flex flex-wrap gap-1.5"
              data-ocid="lot_tracker.filter.tab"
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    activeTab === tab
                      ? "bg-amber/10 text-amber border-amber/30"
                      : "border-steel-border text-muted-foreground hover:text-foreground hover:bg-surface"
                  }`}
                >
                  {tab}
                  <span className="ml-1.5 opacity-60">{tabCounts[tab]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div
            className="rounded-xl border border-steel-border overflow-hidden"
            data-ocid="lot_tracker.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-steel-border bg-surface hover:bg-surface">
                  <TableHead className="text-xs text-muted-foreground">
                    Vehicle
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Year
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Trim
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Current Price
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Days on Lot
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Discount
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Suggested Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((listing: any, idx: number) => (
                  <TableRow
                    key={listing.id ?? idx}
                    data-ocid={`lot_tracker.item.${idx + 1}`}
                    className="border-steel-border hover:bg-surface/50"
                  >
                    <TableCell className="font-medium">
                      <span className="text-amber font-bold">
                        {listing.make}
                      </span>{" "}
                      <span className="text-foreground">{listing.model}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {listing.year ? Number(listing.year) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {listing.trim || "—"}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {fmtCurrency(listing.price)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-bold font-display ${
                          listing.days > 60
                            ? "text-red-500 dark:text-red-400"
                            : listing.days > 30
                              ? "text-orange-500 dark:text-orange-400"
                              : listing.days > 14
                                ? "text-amber"
                                : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {listing.days.toFixed(0)}d
                      </span>
                    </TableCell>
                    <TableCell>{stalenessBadge(listing.staleness)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {listing.discountRate > 0
                        ? `${(listing.discountRate * 100).toFixed(0)}%`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {listing.discountRate > 0 ? (
                        <span className="font-bold text-amber">
                          {fmtCurrency(listing.suggestedPrice)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No change</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
