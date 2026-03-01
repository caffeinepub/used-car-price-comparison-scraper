import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowDownRight,
  Award,
  BarChart3,
  Search,
  TrendingDown,
} from "lucide-react";
import React, { useState } from "react";
import {
  useGetMarketOverview,
  useGetPriceDropListings,
} from "../hooks/useQueries";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyBigint(value: bigint): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key) => (
        <Skeleton key={key} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

export default function MarketOverviewPage() {
  const navigate = useNavigate();
  const { data: marketData, isLoading: marketLoading } = useGetMarketOverview();
  const { data: priceDrops, isLoading: dropsLoading } =
    useGetPriceDropListings();
  const [dropFilter, setDropFilter] = useState("");

  const filteredDrops = (priceDrops ?? []).filter((d) => {
    const q = dropFilter.toLowerCase();
    return (
      d.make.toLowerCase().includes(q) || d.model.toLowerCase().includes(q)
    );
  });

  const handleTrackedClick = (make: string, model: string) => {
    // Navigate to /compare and pass make/model via URL search params
    navigate({
      to: "/compare" as any,
      search: { make, model } as any,
    });
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Page Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-amber-400 tracking-wide">
            Market Overview
          </h1>
          <p className="mt-1 text-muted-text text-sm">
            Aggregate insights across all tracked makes and models
          </p>
        </div>

        {/* Most Tracked Models */}
        <section className="card-panel">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Most Tracked Models
            </h2>
          </div>
          {marketLoading ? (
            <SectionSkeleton />
          ) : !marketData || marketData.mostTracked.length === 0 ? (
            <p className="text-muted-text text-sm py-4 text-center">
              No market data available yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-steel-border hover:bg-transparent">
                  <TableHead className="text-muted-text w-12">#</TableHead>
                  <TableHead className="text-muted-text">Make</TableHead>
                  <TableHead className="text-muted-text">Model</TableHead>
                  <TableHead className="text-muted-text text-right">
                    Listings
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketData.mostTracked.map((item, idx) => (
                  <TableRow
                    key={`${item.make}-${item.model}`}
                    className="border-steel-border cursor-pointer hover:bg-amber-500/10 transition-colors"
                    onClick={() => handleTrackedClick(item.make, item.model)}
                  >
                    <TableCell className="text-muted-text font-mono text-sm">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {item.make}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {item.model}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 text-amber-400"
                      >
                        {Number(item.count)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {/* Biggest Price Drops (aggregate by make/model) */}
        <section className="card-panel">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Biggest Price Drops
            </h2>
            <span className="text-xs text-muted-text ml-1">
              (by make/model)
            </span>
          </div>
          {marketLoading ? (
            <SectionSkeleton />
          ) : !marketData || marketData.biggestPriceDrops.length === 0 ? (
            <p className="text-muted-text text-sm py-4 text-center">
              No market data available yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-steel-border hover:bg-transparent">
                  <TableHead className="text-muted-text">Make</TableHead>
                  <TableHead className="text-muted-text">Model</TableHead>
                  <TableHead className="text-muted-text text-right">
                    First Price
                  </TableHead>
                  <TableHead className="text-muted-text text-right">
                    Latest Price
                  </TableHead>
                  <TableHead className="text-muted-text text-right">
                    Drop
                  </TableHead>
                  <TableHead className="text-muted-text text-right">
                    Drop %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketData.biggestPriceDrops.map((drop) => (
                  <TableRow
                    key={`${drop.make}-${drop.model}`}
                    className="border-steel-border cursor-pointer hover:bg-amber-500/10 transition-colors"
                    onClick={() => handleTrackedClick(drop.make, drop.model)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {drop.make}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {drop.model}
                    </TableCell>
                    <TableCell className="text-right text-muted-text">
                      {formatCurrency(drop.firstPrice)}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatCurrency(drop.latestPrice)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-400 font-medium">
                      -{formatCurrency(drop.dropAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-400"
                      >
                        -{drop.dropPercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {/* Best Deals Right Now */}
        <section className="card-panel">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Best Deals Right Now
            </h2>
          </div>
          {marketLoading ? (
            <SectionSkeleton />
          ) : !marketData || marketData.bestDeals.length === 0 ? (
            <p className="text-muted-text text-sm py-4 text-center">
              No market data available yet
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketData.bestDeals
                .filter((d) => d.dealScore === "Good Deal")
                .map((deal) => (
                  <div
                    key={deal.listingId}
                    className="rounded-lg border border-steel-border bg-surface/60 p-4 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {deal.make} {deal.model}
                        </p>
                        <p className="text-2xl font-bold text-amber-400 mt-1">
                          {formatCurrencyBigint(deal.price)}
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shrink-0">
                        Good Deal
                      </Badge>
                    </div>
                  </div>
                ))}
              {marketData.bestDeals.filter((d) => d.dealScore === "Good Deal")
                .length === 0 && (
                <p className="text-muted-text text-sm py-4 col-span-full text-center">
                  No good deals detected yet
                </p>
              )}
            </div>
          )}
        </section>

        {/* Price Drops — Individual Listings */}
        <section className="card-panel">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownRight className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Price Drop Listings
            </h2>
            <span className="text-xs text-muted-text ml-1">
              (individual listings with price decreases)
            </span>
          </div>

          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text" />
            <Input
              placeholder="Filter by make or model…"
              value={dropFilter}
              onChange={(e) => setDropFilter(e.target.value)}
              className="pl-9 bg-surface border-steel-border text-foreground placeholder:text-muted-text"
            />
          </div>

          {dropsLoading ? (
            <SectionSkeleton />
          ) : filteredDrops.length === 0 ? (
            <p className="text-muted-text text-sm py-4 text-center">
              No price drops detected yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-steel-border hover:bg-transparent">
                    <TableHead className="text-muted-text">Make</TableHead>
                    <TableHead className="text-muted-text">Model</TableHead>
                    <TableHead className="text-muted-text">Year</TableHead>
                    <TableHead className="text-muted-text">Trim</TableHead>
                    <TableHead className="text-muted-text">Source</TableHead>
                    <TableHead className="text-muted-text text-right">
                      First Price
                    </TableHead>
                    <TableHead className="text-muted-text text-right">
                      Latest Price
                    </TableHead>
                    <TableHead className="text-muted-text text-right">
                      Drop
                    </TableHead>
                    <TableHead className="text-muted-text text-right">
                      Drop %
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrops.map((drop) => (
                    <TableRow
                      key={drop.id}
                      className="border-steel-border hover:bg-amber-500/5 transition-colors"
                    >
                      <TableCell className="font-medium text-foreground">
                        {drop.make}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {drop.model}
                      </TableCell>
                      <TableCell className="text-muted-text">
                        {Number(drop.year)}
                      </TableCell>
                      <TableCell className="text-muted-text">
                        {drop.trim || "—"}
                      </TableCell>
                      <TableCell className="text-muted-text">
                        {drop.source}
                      </TableCell>
                      <TableCell className="text-right text-muted-text">
                        {formatCurrency(drop.firstPrice)}
                      </TableCell>
                      <TableCell className="text-right text-foreground font-medium">
                        {formatCurrency(drop.latestPrice)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400 font-medium">
                        -{formatCurrency(drop.dropAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-emerald-400 font-semibold">
                          -{drop.dropPercent.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
