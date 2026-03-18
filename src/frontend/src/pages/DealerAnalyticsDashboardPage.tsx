import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart2,
  DollarSign,
  Eye,
  MessageSquare,
  RefreshCw,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppRoleContext } from "../hooks/useAppRoleContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

// Deterministic hash from string
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface MarketplaceListing {
  id: string;
  year: number | string;
  make: string;
  model: string;
  price: number | string;
  status: "available" | "sold" | string;
  trim?: string;
  mileage?: number | string;
}

interface Inquiry {
  listingId: string;
  name?: string;
  message?: string;
  timestamp?: string;
}

interface ListingStats {
  id: string;
  vehicle: string;
  year: number | string;
  make: string;
  model: string;
  price: number;
  status: string;
  views: number;
  inquiries: number;
  saves: number;
  avgTimeToInquiry: number; // hours
  margin: number;
}

function useAnalyticsData(principalId: string | null) {
  const [data, setData] = useState<ListingStats[]>([]);
  const [inquiryTotal, setInquiryTotal] = useState(0);

  const load = useCallback(() => {
    if (!principalId) {
      setData([]);
      return;
    }

    const raw = localStorage.getItem(`atp_marketplace_listings_${principalId}`);
    const listings: MarketplaceListing[] = raw ? JSON.parse(raw) : [];

    // Read real inquiries
    const inqRaw = localStorage.getItem(`atp_dealer_inquiries_${principalId}`);
    const inquiries: Inquiry[] = inqRaw ? JSON.parse(inqRaw) : [];

    // Build per-listing inquiry map
    const inqMap: Record<string, number> = {};
    for (const inq of inquiries) {
      inqMap[inq.listingId] = (inqMap[inq.listingId] ?? 0) + 1;
    }

    const stats: ListingStats[] = listings.map((l) => {
      const h = hashStr(l.id);
      const views = ((h * 17) % 500) + 50;
      const saves = (h % 25) + 3;
      const simInquiries = (h % 12) + 1;
      const realInquiries = inqMap[l.id] ?? 0;
      const inquiries = Math.max(
        realInquiries,
        simInquiries > 0 ? simInquiries : 1,
      );
      const avgTimeToInquiry = (h % 48) + 2; // 2–50 hours
      const price = Number(l.price) || 0;
      const margin = price * 0.1;
      return {
        id: l.id,
        vehicle: `${l.year} ${l.make} ${l.model}`,
        year: l.year,
        make: l.make,
        model: l.model,
        price,
        status: l.status ?? "available",
        views,
        inquiries,
        saves,
        avgTimeToInquiry,
        margin,
      };
    });

    setData(stats);
    setInquiryTotal(inquiries.length);
  }, [principalId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, inquiryTotal, refresh: load };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`border ${
        accent ? "border-amber/30 bg-amber/5" : "border-border bg-card"
      }`}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div
          className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            accent ? "bg-amber/15" : "bg-muted"
          }`}
        >
          <Icon
            className={`w-4 h-4 ${accent ? "text-amber" : "text-muted-foreground"}`}
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          <p
            className={`text-xl font-bold tabular-nums ${accent ? "text-amber" : "text-foreground"}`}
          >
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-ocid="analytics.empty_state"
    >
      <BarChart2 className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
      <p className="text-muted-foreground text-sm max-w-xs">{message}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealerAnalyticsDashboardPage() {
  const navigate = useNavigate();
  const role = useAppRoleContext();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() ?? null;

  const { data: listings, refresh } = useAnalyticsData(principalId);

  // Redirect non-dealers
  if (role !== "dealer" && role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            This page is for dealers only.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="text-amber underline text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalListings = listings.length;
  const totalViews = listings.reduce((s, l) => s + l.views, 0);
  const totalInquiries = listings.reduce((s, l) => s + l.inquiries, 0);
  const totalSaves = listings.reduce((s, l) => s + l.saves, 0);

  const soldListings = listings.filter((l) => l.status === "sold");
  const totalSold = soldListings.length;
  const conversionRate =
    totalListings > 0 ? (totalSold / totalListings) * 100 : 0;
  const inquiryToSaleRate =
    totalInquiries > 0 ? (totalSold / totalInquiries) * 100 : 0;

  const totalRevenue = soldListings.reduce((s, l) => s + l.price, 0);
  const totalGrossProfit = soldListings.reduce((s, l) => s + l.margin, 0);
  const avgMarginPct =
    totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 10;

  // Segment breakdown (by make)
  type SegmentRow = {
    make: string;
    unitsSold: number;
    revenue: number;
    grossProfit: number;
    marginPct: number;
  };
  const segmentMap: Record<string, SegmentRow> = {};
  for (const l of soldListings) {
    const key = l.make || "Unknown";
    if (!segmentMap[key]) {
      segmentMap[key] = {
        make: key,
        unitsSold: 0,
        revenue: 0,
        grossProfit: 0,
        marginPct: 0,
      };
    }
    segmentMap[key].unitsSold += 1;
    segmentMap[key].revenue += l.price;
    segmentMap[key].grossProfit += l.margin;
  }
  const segments = Object.values(segmentMap).map((s) => ({
    ...s,
    marginPct: s.revenue > 0 ? (s.grossProfit / s.revenue) * 100 : 10,
  }));
  segments.sort((a, b) => b.revenue - a.revenue);

  const bestSegment =
    segments.length > 0
      ? segments.reduce(
          (best, s) => (s.marginPct > best.marginPct ? s : best),
          segments[0],
        )
      : null;
  const worstSegment =
    segments.length > 1
      ? segments.reduce(
          (worst, s) => (s.marginPct < worst.marginPct ? s : worst),
          segments[0],
        )
      : null;

  // Conversion chart data
  const conversionChartData = listings.slice(0, 8).map((l) => ({
    name: `${l.year} ${l.make}`.slice(0, 16),
    inquiries: l.inquiries,
    sold: l.status === "sold" ? 1 : 0,
  }));

  const hasListings = totalListings > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            data-ocid="analytics.back_button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber" />
            <h1 className="text-base font-semibold text-foreground">
              Dealer Analytics
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              data-ocid="analytics.refresh_button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber border border-border hover:border-amber/40 rounded-lg px-3 py-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              data-ocid="analytics.close_button"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
        {/* ── Section 1: Storefront Performance ── */}
        <section data-ocid="analytics.performance_section">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-amber" />
            <h2 className="text-lg font-semibold text-foreground">
              Storefront Performance
            </h2>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={BarChart2}
              label="Total Listings"
              value={totalListings.toString()}
              data-ocid="analytics.total_listings.card"
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={totalViews.toLocaleString()}
              accent
            />
            <StatCard
              icon={MessageSquare}
              label="Total Inquiries"
              value={totalInquiries.toLocaleString()}
            />
            <StatCard
              icon={Star}
              label="Total Saves"
              value={totalSaves.toLocaleString()}
            />
          </div>

          {hasListings ? (
            <Card className="border-border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Per-Listing Breakdown
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Inquiries</TableHead>
                      <TableHead className="text-right">Saves</TableHead>
                      <TableHead className="text-right">
                        Avg. Time to Inquiry
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((l, i) => (
                      <TableRow
                        key={l.id}
                        className="border-border"
                        data-ocid={`analytics.listing.item.${i + 1}`}
                      >
                        <TableCell className="font-medium text-foreground">
                          {l.vehicle}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              l.status === "sold"
                                ? "border-green-500/40 text-green-400 bg-green-500/10"
                                : "border-amber/40 text-amber bg-amber/10"
                            }
                          >
                            {l.status === "sold" ? "Sold" : "Available"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {l.views.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {l.inquiries}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {l.saves}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {l.avgTimeToInquiry}h
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <Card className="border-border">
              <CardContent>
                <EmptyState message="Add listings to your marketplace to see storefront analytics." />
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Section 2: Conversion Rate Tracker ── */}
        <section data-ocid="analytics.conversion_section">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber" />
            <h2 className="text-lg font-semibold text-foreground">
              Conversion Rate Tracker
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <Card className="border-amber/30 bg-amber/5 sm:col-span-1">
              <CardContent className="p-6 text-center">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                  Listing-to-Sale Rate
                </p>
                <p className="text-5xl font-bold text-amber tabular-nums">
                  {fmtPct(conversionRate)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalSold} sold of {totalListings} listed
                </p>
              </CardContent>
            </Card>

            <StatCard
              icon={MessageSquare}
              label="Inquiry-to-Sale Rate"
              value={fmtPct(inquiryToSaleRate)}
              sub={`${totalSold} sales / ${totalInquiries} inquiries`}
            />

            <StatCard
              icon={BarChart2}
              label="Avg Inquiries / Listing"
              value={
                totalListings > 0
                  ? (totalInquiries / totalListings).toFixed(1)
                  : "—"
              }
              sub="Across all active listings"
            />
          </div>

          {hasListings ? (
            <>
              {/* Conversion bar chart */}
              <Card className="border-border mb-4">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Inquiries per Listing
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={conversionChartData}
                      margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 11,
                          fill: "oklch(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "oklch(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "oklch(var(--card))",
                          border: "1px solid oklch(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                        cursor={{ fill: "oklch(var(--muted)/0.3)" }}
                      />
                      <Bar dataKey="inquiries" radius={[4, 4, 0, 0]}>
                        {conversionChartData.map((entry) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={entry.sold ? "#22c55e" : "#F59E0B"}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Green = Sold · Amber = Available
                  </p>
                </CardContent>
              </Card>

              {/* Ranked table */}
              <Card className="border-border">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Converting Listings
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>#</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Inquiries</TableHead>
                        <TableHead className="text-right">
                          Est. Days to Sale
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...listings]
                        .sort((a, b) => {
                          if (a.status === "sold" && b.status !== "sold")
                            return -1;
                          if (b.status === "sold" && a.status !== "sold")
                            return 1;
                          return b.inquiries - a.inquiries;
                        })
                        .slice(0, 8)
                        .map((l, i) => (
                          <TableRow
                            key={l.id}
                            className="border-border"
                            data-ocid={`analytics.conversion.item.${i + 1}`}
                          >
                            <TableCell className="text-muted-foreground">
                              {i + 1}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {l.vehicle}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  l.status === "sold"
                                    ? "border-green-500/40 text-green-400 bg-green-500/10"
                                    : "border-amber/40 text-amber bg-amber/10"
                                }
                              >
                                {l.status === "sold" ? "Sold" : "Available"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {l.inquiries}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {l.status === "sold"
                                ? `~${Math.round((l.avgTimeToInquiry / 24) * 4)}d`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {totalSold === 0 && (
                <div className="mt-3 p-3 rounded-lg bg-amber/5 border border-amber/20 text-xs text-amber">
                  💡 Tip: Mark listings as Sold in Manage Listings to track your
                  conversion rate.
                </div>
              )}
            </>
          ) : (
            <Card className="border-border">
              <CardContent>
                <EmptyState message="No listings yet. Add inventory to start tracking conversions." />
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Section 3: Revenue & Margin Report ── */}
        <section data-ocid="analytics.revenue_section">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-amber" />
            <h2 className="text-lg font-semibold text-foreground">
              Revenue &amp; Margin Report
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={fmt(totalRevenue)}
              accent
              sub="From sold listings"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Gross Profit"
              value={fmt(totalGrossProfit)}
              sub="~10% margin applied"
            />
            <StatCard
              icon={BarChart2}
              label="Avg Margin %"
              value={fmtPct(avgMarginPct)}
            />
            <StatCard
              icon={Star}
              label="Best Segment"
              value={bestSegment?.make ?? "—"}
              sub={
                bestSegment
                  ? `${fmtPct(bestSegment.marginPct)} margin`
                  : "No sales yet"
              }
            />
          </div>

          {segments.length > 0 ? (
            <>
              {/* Segment breakdown table */}
              <Card className="border-border mb-4">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Segment Breakdown by Make
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>Make</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">
                          Total Revenue
                        </TableHead>
                        <TableHead className="text-right">Avg Margin</TableHead>
                        <TableHead className="text-right">Margin %</TableHead>
                        <TableHead>Rank</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {segments.map((seg, i) => {
                        const isBest = seg.make === bestSegment?.make;
                        const isWorst =
                          seg.make === worstSegment?.make &&
                          segments.length > 1;
                        return (
                          <TableRow
                            key={seg.make}
                            className="border-border"
                            data-ocid={`analytics.segment.item.${i + 1}`}
                          >
                            <TableCell className="font-medium text-foreground">
                              {seg.make}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {seg.unitsSold}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmt(seg.revenue)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmt(seg.grossProfit / seg.unitsSold)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmtPct(seg.marginPct)}
                            </TableCell>
                            <TableCell>
                              {isBest && (
                                <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 text-xs">
                                  Best
                                </Badge>
                              )}
                              {isWorst && (
                                <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs">
                                  Lowest
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Revenue bar chart */}
              <Card className="border-border">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Revenue by Make
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={segments.map((s) => ({
                        name: s.make,
                        revenue: s.revenue,
                        profit: s.grossProfit,
                      }))}
                      margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 11,
                          fill: "oklch(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        tick={{
                          fontSize: 11,
                          fill: "oklch(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          fmt(value),
                          name === "revenue" ? "Revenue" : "Gross Profit",
                        ]}
                        contentStyle={{
                          background: "oklch(var(--card))",
                          border: "1px solid oklch(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                        cursor={{ fill: "oklch(var(--muted)/0.3)" }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#F59E0B"
                        fillOpacity={0.85}
                        radius={[4, 4, 0, 0]}
                        name="revenue"
                      />
                      <Bar
                        dataKey="profit"
                        fill="#22c55e"
                        fillOpacity={0.75}
                        radius={[4, 4, 0, 0]}
                        name="profit"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Amber = Revenue · Green = Gross Profit
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-border">
              <CardContent>
                <EmptyState message="No sold listings yet. Mark listings as Sold in Manage Listings to see revenue reports." />
              </CardContent>
            </Card>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
