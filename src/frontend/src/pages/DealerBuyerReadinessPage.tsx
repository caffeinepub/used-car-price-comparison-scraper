import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Minus,
  Snowflake,
  Target,
  ThermometerSun,
  TrendingDown,
  X,
} from "lucide-react";
import { useState } from "react";

interface VehicleEntry {
  id: string;
  make: string;
  model: string;
  year: number;
  askingPrice: number;
  marketAvg: number;
  daysListed: number;
  priceDrops: number;
  alertCount: number;
  watchlistCount: number;
}

const SAMPLE_DATA: VehicleEntry[] = [
  {
    id: "1",
    make: "Toyota",
    model: "Camry",
    year: 2021,
    askingPrice: 24500,
    marketAvg: 26000,
    daysListed: 12,
    priceDrops: 1,
    alertCount: 3,
    watchlistCount: 5,
  },
  {
    id: "2",
    make: "Ford",
    model: "F-150",
    year: 2020,
    askingPrice: 38000,
    marketAvg: 36000,
    daysListed: 45,
    priceDrops: 3,
    alertCount: 8,
    watchlistCount: 12,
  },
  {
    id: "3",
    make: "Honda",
    model: "Civic",
    year: 2022,
    askingPrice: 22000,
    marketAvg: 21500,
    daysListed: 5,
    priceDrops: 0,
    alertCount: 1,
    watchlistCount: 2,
  },
  {
    id: "4",
    make: "Chevrolet",
    model: "Tahoe",
    year: 2019,
    askingPrice: 42000,
    marketAvg: 39000,
    daysListed: 72,
    priceDrops: 5,
    alertCount: 14,
    watchlistCount: 18,
  },
  {
    id: "5",
    make: "Tesla",
    model: "Model 3",
    year: 2022,
    askingPrice: 35000,
    marketAvg: 36500,
    daysListed: 8,
    priceDrops: 0,
    alertCount: 6,
    watchlistCount: 9,
  },
  {
    id: "6",
    make: "Ram",
    model: "1500",
    year: 2021,
    askingPrice: 44000,
    marketAvg: 41000,
    daysListed: 55,
    priceDrops: 2,
    alertCount: 4,
    watchlistCount: 6,
  },
  {
    id: "7",
    make: "Honda",
    model: "Pilot",
    year: 2020,
    askingPrice: 32000,
    marketAvg: 31000,
    daysListed: 30,
    priceDrops: 1,
    alertCount: 2,
    watchlistCount: 4,
  },
];

function calcReadiness(v: VehicleEntry): number {
  let score = 0;
  // Price vs market: below market = higher readiness
  const priceDiff = ((v.marketAvg - v.askingPrice) / v.marketAvg) * 100;
  score += Math.min(Math.max(priceDiff * 3, -20), 30);
  // Days on lot (longer = more desperate buyers or stale)
  if (v.daysListed <= 14) score += 10;
  else if (v.daysListed <= 30) score += 20;
  else if (v.daysListed <= 60) score += 15;
  else score += 5;
  // Price drops signal motivated seller
  score += Math.min(v.priceDrops * 8, 24);
  // Alert/watchlist activity
  score += Math.min(v.alertCount * 2, 16);
  score += Math.min(v.watchlistCount * 1.5, 15);

  return Math.round(Math.min(Math.max(score, 0), 100));
}

function getStatus(score: number): {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
} {
  if (score >= 70)
    return {
      label: "Hot",
      icon: Flame,
      color: "text-red-400",
      bg: "bg-red-400/10 border-red-400/30",
    };
  if (score >= 40)
    return {
      label: "Warm",
      icon: ThermometerSun,
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/30",
    };
  return {
    label: "Cold",
    icon: Snowflake,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
  };
}

function getAction(v: VehicleEntry, score: number): string {
  const priceDiff = ((v.marketAvg - v.askingPrice) / v.marketAvg) * 100;
  if (score >= 70 && priceDiff >= 3)
    return "Already well-priced. Highlight in featured listings.";
  if (score >= 70 && priceDiff < 0)
    return `Drop price ${Math.abs(Math.round(priceDiff)).toFixed(0)}% to ${(v.askingPrice * 0.97).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} to convert.`;
  if (score >= 40 && v.daysListed > 30)
    return "Reduce price by 3-5% — buyers are watching but not converting.";
  if (score >= 40) return "Add to email blast for active alert subscribers.";
  if (v.daysListed > 60)
    return "Consider wholesaling — floor plan cost exceeding profit potential.";
  return "Boost visibility with featured placement or paid promotion.";
}

type SortKey = "readiness" | "days" | "price" | "activity";

import type React from "react";

export default function DealerBuyerReadinessPage() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("readiness");
  const [sortAsc, setSortAsc] = useState(false);

  const enriched = SAMPLE_DATA.map((v) => ({
    ...v,
    readiness: calcReadiness(v),
    status: getStatus(calcReadiness(v)),
    action: getAction(v, calcReadiness(v)),
  })).sort((a, b) => {
    let av = 0;
    let bv = 0;
    if (sortKey === "readiness") {
      av = a.readiness;
      bv = b.readiness;
    }
    if (sortKey === "days") {
      av = a.daysListed;
      bv = b.daysListed;
    }
    if (sortKey === "price") {
      av = a.askingPrice;
      bv = b.askingPrice;
    }
    if (sortKey === "activity") {
      av = a.alertCount + a.watchlistCount;
      bv = b.alertCount + b.watchlistCount;
    }
    return sortAsc ? av - bv : bv - av;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <Minus className="w-3 h-3 opacity-30" />;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const hotCount = enriched.filter((e) => e.status.label === "Hot").length;
  const warmCount = enriched.filter((e) => e.status.label === "Warm").length;
  const coldCount = enriched.filter((e) => e.status.label === "Cold").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1.5 text-sm text-muted-text hover:text-foreground transition-colors"
          data-ocid="buyer_readiness.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-steel-border text-muted-text hover:text-foreground hover:border-amber/40 transition-colors"
          data-ocid="buyer_readiness.close.button"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-amber" />
          <h1 className="text-xl font-bold text-foreground">
            Buyer Readiness Score
          </h1>
        </div>
        <p className="text-sm text-muted-text">
          Scores how close each vehicle is to being purchased based on price
          position, days listed, price drops, alert activity, and watchlist
          engagement.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
          <Flame className="w-7 h-7 text-red-400" />
          <div className="flex flex-col items-center text-center w-full">
            <p className="text-2xl font-bold text-red-400">{hotCount}</p>
            <p className="text-xs text-muted-text">Hot — Ready to Buy</p>
          </div>
        </div>
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
          <ThermometerSun className="w-7 h-7 text-amber-400" />
          <div className="flex flex-col items-center text-center w-full">
            <p className="text-2xl font-bold text-amber-400">{warmCount}</p>
            <p className="text-xs text-muted-text">Warm — Considering</p>
          </div>
        </div>
        <div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
          <Snowflake className="w-7 h-7 text-blue-400" />
          <div className="flex flex-col items-center text-center w-full">
            <p className="text-2xl font-bold text-blue-400">{coldCount}</p>
            <p className="text-xs text-muted-text">Cold — Low Intent</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-steel-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="buyer_readiness.table">
            <thead>
              <tr className="border-b border-steel-border bg-background/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-text uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-text uppercase tracking-wider">
                  <button
                    type="button"
                    className="flex items-center gap-1 mx-auto"
                    onClick={() => handleSort("readiness")}
                    data-ocid="buyer_readiness.sort_readiness.button"
                  >
                    Readiness <SortIcon k="readiness" />
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-text uppercase tracking-wider hidden sm:table-cell">
                  <button
                    type="button"
                    className="flex items-center gap-1 mx-auto"
                    onClick={() => handleSort("days")}
                    data-ocid="buyer_readiness.sort_days.button"
                  >
                    Days Listed <SortIcon k="days" />
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-text uppercase tracking-wider hidden md:table-cell">
                  <button
                    type="button"
                    className="flex items-center gap-1 mx-auto"
                    onClick={() => handleSort("price")}
                    data-ocid="buyer_readiness.sort_price.button"
                  >
                    Price vs Mkt <SortIcon k="price" />
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-text uppercase tracking-wider hidden lg:table-cell">
                  <button
                    type="button"
                    className="flex items-center gap-1 mx-auto"
                    onClick={() => handleSort("activity")}
                    data-ocid="buyer_readiness.sort_activity.button"
                  >
                    Activity <SortIcon k="activity" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-text uppercase tracking-wider">
                  Recommended Action
                </th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((v, i) => {
                const Icon = v.status.icon;
                const priceDiff = v.marketAvg - v.askingPrice;
                const pricePct = ((priceDiff / v.marketAvg) * 100).toFixed(1);
                return (
                  <tr
                    key={v.id}
                    data-ocid={`buyer_readiness.row.${i + 1}`}
                    className="border-b border-steel-border/50 last:border-0 hover:bg-surface/50 transition-colors"
                  >
                    {/* Vehicle */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-xs text-muted-text">
                        {v.askingPrice.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </td>

                    {/* Readiness gauge */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${v.status.bg} ${v.status.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {v.status.label}
                          </span>
                        </div>
                        <div className="w-full max-w-[80px]">
                          <div className="h-1.5 bg-steel-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                v.readiness >= 70
                                  ? "bg-red-400"
                                  : v.readiness >= 40
                                    ? "bg-amber-400"
                                    : "bg-blue-400"
                              }`}
                              style={{ width: `${v.readiness}%` }}
                            />
                          </div>
                          <p
                            className={`text-xs font-bold text-center mt-0.5 ${v.status.color}`}
                          >
                            {v.readiness}/100
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Days */}
                    <td className="px-4 py-3 hidden sm:table-cell text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-text" />
                        <span
                          className={`font-semibold ${v.daysListed > 60 ? "text-red-400" : v.daysListed > 30 ? "text-amber-400" : "text-foreground"}`}
                        >
                          {v.daysListed}d
                        </span>
                      </div>
                      {v.priceDrops > 0 && (
                        <div className="flex items-center justify-center gap-0.5 mt-0.5">
                          <TrendingDown className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400">
                            {v.priceDrops} drops
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Price vs market */}
                    <td className="px-4 py-3 hidden md:table-cell text-center">
                      <span
                        className={`text-sm font-bold ${priceDiff >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {priceDiff >= 0 ? "-" : "+"}
                        {Math.abs(Number(pricePct))}%
                      </span>
                      <p className="text-xs text-muted-text">
                        {priceDiff >= 0 ? "below market" : "above market"}
                      </p>
                    </td>

                    {/* Activity */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-muted-text">
                          <Bell className="w-3.5 h-3.5" />
                          <span className="font-semibold text-foreground">
                            {v.alertCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-text">
                          <Target className="w-3.5 h-3.5" />
                          <span className="font-semibold text-foreground">
                            {v.watchlistCount}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-xs text-muted-text leading-relaxed">
                        {v.action}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-surface border border-steel-border rounded-xl p-4">
        <h2 className="text-xs font-bold text-muted-text uppercase tracking-wider mb-3">
          How Readiness is Calculated
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-muted-text">
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 text-amber mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground">Price vs Market</strong> —
              Below market price signals buyer readiness and deal urgency.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground">Days Listed</strong> — 21-60
              day window is peak buyer urgency; too long = stale.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 text-amber mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground">Price Drops</strong> — Each
              drop signals seller motivation and attracts buyer attention.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Bell className="w-4 h-4 text-amber mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground">
                Alert & Watchlist Activity
              </strong>{" "}
              — High engagement = buyers are tracking and close to acting.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
