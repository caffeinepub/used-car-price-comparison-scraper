import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  LayoutGrid,
  Minus,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SegmentEntry {
  segment: string;
  count: number;
}

// Regional demand benchmarks (% of total demand)
const DEMAND_BENCHMARKS: Record<string, number> = {
  "SUV / Crossover": 34,
  "Truck / Pickup": 22,
  Sedan: 18,
  "Coupe / Sports": 8,
  Minivan: 5,
  "Electric / Hybrid": 7,
  Luxury: 6,
};

const SEGMENT_OPTIONS = Object.keys(DEMAND_BENCHMARKS);

const RECOMMENDATIONS: Record<string, { over: string; under: string }> = {
  "SUV / Crossover": {
    over: "SUVs are in high demand — good! But too many could signal pricing pressure. Consider spread across multiple price tiers.",
    under:
      "SUVs are the #1 demanded segment. Source more immediately from auction.",
  },
  "Truck / Pickup": {
    over: "Truck market is stable but large inventory may sit longer. Prioritize late-model, low-mileage units.",
    under:
      "Trucks have strong demand year-round. Actively source work trucks and crew cabs.",
  },
  Sedan: {
    over: "Sedan demand is declining. Liquidate slower-moving units via wholesale to free up floor plan.",
    under:
      "Some sedan demand still exists for budget buyers. 1-2 units in your price range is sufficient.",
  },
  "Coupe / Sports": {
    over: "Sports cars appeal to a niche. More than 10% of lot can slow turnover significantly.",
    under:
      "A few coupes can attract weekend browsers and convert impulse buyers.",
  },
  Minivan: {
    over: "Minivan demand is very seasonal. Discount aggressively in off-season or trade them out.",
    under:
      "Minivans sell well to family buyers in spring/summer. Source 1-2 in Q1.",
  },
  "Electric / Hybrid": {
    over: "EV demand is growing but requires buyer education. Ensure staff is trained on charging, range, incentives.",
    under:
      "EV/hybrid demand is rising fast. Even one certified EV can attract new demographics.",
  },
  Luxury: {
    over: "Luxury units carry high floor plan costs. Faster turnover is critical — price aggressively vs market.",
    under:
      "One or two luxury units can improve lot prestige and average ticket value.",
  },
};

export default function DealerLotOptimizerPage() {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<SegmentEntry[]>([
    { segment: "SUV / Crossover", count: 8 },
    { segment: "Truck / Pickup", count: 6 },
    { segment: "Sedan", count: 10 },
    { segment: "Coupe / Sports", count: 3 },
    { segment: "Minivan", count: 2 },
    { segment: "Electric / Hybrid", count: 1 },
  ]);

  const totalUnits = inventory.reduce((s, e) => s + e.count, 0);

  const inventoryMap: Record<string, number> = {};
  for (const e of inventory) {
    inventoryMap[e.segment] = (inventoryMap[e.segment] || 0) + e.count;
  }

  const inventoryPct: Record<string, number> = {};
  for (const seg of SEGMENT_OPTIONS) {
    inventoryPct[seg] =
      totalUnits > 0
        ? Math.round(((inventoryMap[seg] || 0) / totalUnits) * 100)
        : 0;
  }

  const chartData = SEGMENT_OPTIONS.map((seg) => ({
    name: seg.length > 14 ? `${seg.slice(0, 14)}…` : seg,
    fullName: seg,
    "Your Lot %": inventoryPct[seg] || 0,
    "Market Demand %": DEMAND_BENCHMARKS[seg] || 0,
  }));

  const segments = SEGMENT_OPTIONS.map((seg) => {
    const inv = inventoryPct[seg] || 0;
    const demand = DEMAND_BENCHMARKS[seg] || 0;
    const diff = inv - demand;
    return { seg, inv, demand, diff };
  });

  const overweight = segments
    .filter((s) => s.diff >= 5)
    .sort((a, b) => b.diff - a.diff);
  const underweight = segments
    .filter((s) => s.diff <= -5)
    .sort((a, b) => a.diff - b.diff);
  const balanced = segments.filter((s) => s.diff > -5 && s.diff < 5);

  const updateCount = (seg: string, delta: number) => {
    setInventory((prev) => {
      const existing = prev.find((e) => e.segment === seg);
      if (existing) {
        const next = Math.max(0, existing.count + delta);
        if (next === 0) return prev.filter((e) => e.segment !== seg);
        return prev.map((e) => (e.segment === seg ? { ...e, count: next } : e));
      }
      if (delta > 0) return [...prev, { segment: seg, count: 1 }];
      return prev;
    });
  };

  const removeSegment = (seg: string) => {
    setInventory((prev) => prev.filter((e) => e.segment !== seg));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1.5 text-sm text-muted-text hover:text-foreground transition-colors"
          data-ocid="lot_optimizer.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-steel-border text-muted-text hover:text-foreground hover:border-amber/40 transition-colors"
          data-ocid="lot_optimizer.close.button"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LayoutGrid className="w-5 h-5 text-amber" />
          <h1 className="text-xl font-bold text-foreground">
            Lot Composition Optimizer
          </h1>
        </div>
        <p className="text-sm text-muted-text">
          Compare your current inventory mix against regional market demand to
          identify gaps and over-stocked segments.
        </p>
      </div>

      {/* Inventory editor */}
      <div className="bg-surface border border-steel-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">
            Your Current Inventory
          </h2>
          <span className="text-xs text-muted-text">
            {totalUnits} total units
          </span>
        </div>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          data-ocid="lot_optimizer.inventory.table"
        >
          {SEGMENT_OPTIONS.map((seg, i) => {
            const count = inventoryMap[seg] || 0;
            return (
              <div
                key={seg}
                data-ocid={`lot_optimizer.segment.row.${i + 1}`}
                className="flex items-center gap-3 p-3 bg-background rounded-lg border border-steel-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {seg}
                  </p>
                  <p className="text-xs text-muted-text">
                    {count} units · {inventoryPct[seg] || 0}% of lot
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCount(seg, -1)}
                    className="w-7 h-7 rounded-md border border-steel-border flex items-center justify-center text-muted-text hover:text-foreground hover:border-amber/40 transition-colors"
                    data-ocid={`lot_optimizer.decrement.button.${i + 1}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold text-foreground w-6 text-center">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCount(seg, 1)}
                    className="w-7 h-7 rounded-md border border-steel-border flex items-center justify-center text-muted-text hover:text-foreground hover:border-amber/40 transition-colors"
                    data-ocid={`lot_optimizer.increment.button.${i + 1}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  {count > 0 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(seg)}
                      className="w-7 h-7 rounded-md border border-steel-border flex items-center justify-center text-muted-text hover:text-red-400 hover:border-red-400/40 transition-colors"
                      data-ocid={`lot_optimizer.remove.button.${i + 1}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison chart */}
      <div className="bg-surface border border-steel-border rounded-xl p-4">
        <h2 className="text-sm font-bold text-foreground mb-4">
          Inventory vs. Market Demand (%)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `${v}%`}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullName ?? ""
              }
              formatter={(v: number, name: string) => [`${v}%`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Your Lot %" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="Market Demand %"
              fill="#6366F1"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overweight */}
        {overweight.length > 0 && (
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-red-400">
                Overweight ({overweight.length})
              </h2>
            </div>
            <div className="space-y-3">
              {overweight.map((s, i) => (
                <div
                  key={s.seg}
                  data-ocid={`lot_optimizer.overweight.card.${i + 1}`}
                  className="bg-red-400/5 border border-red-400/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-foreground">{s.seg}</p>
                    <span className="text-xs font-bold text-red-400">
                      +{s.diff}% over
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-text mb-2">
                    <span>
                      Lot: <strong className="text-foreground">{s.inv}%</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Demand:{" "}
                      <strong className="text-foreground">{s.demand}%</strong>
                    </span>
                  </div>
                  <p className="text-xs text-muted-text leading-relaxed">
                    {RECOMMENDATIONS[s.seg]?.over ??
                      "Consider liquidating excess inventory via wholesale."}
                  </p>
                  <div className="mt-2 px-2 py-1 rounded-md bg-red-400/10 text-red-400 text-xs font-semibold inline-block">
                    Action: Liquidate / Discount
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Underweight */}
        {underweight.length > 0 && (
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-bold text-green-400">
                Underweight ({underweight.length})
              </h2>
            </div>
            <div className="space-y-3">
              {underweight.map((s, i) => (
                <div
                  key={s.seg}
                  data-ocid={`lot_optimizer.underweight.card.${i + 1}`}
                  className="bg-green-400/5 border border-green-400/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-foreground">{s.seg}</p>
                    <span className="text-xs font-bold text-green-400">
                      {s.diff}% under
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-text mb-2">
                    <span>
                      Lot: <strong className="text-foreground">{s.inv}%</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Demand:{" "}
                      <strong className="text-foreground">{s.demand}%</strong>
                    </span>
                  </div>
                  <p className="text-xs text-muted-text leading-relaxed">
                    {RECOMMENDATIONS[s.seg]?.under ??
                      "Source more of this segment at auction to capture demand."}
                  </p>
                  <div className="mt-2 px-2 py-1 rounded-md bg-green-400/10 text-green-400 text-xs font-semibold inline-block">
                    Action: Source More
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Balanced */}
        {balanced.length > 0 && (
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-4 h-4 text-amber" />
              <h2 className="text-sm font-bold text-amber">
                Balanced ({balanced.length})
              </h2>
            </div>
            <div className="space-y-3">
              {balanced.map((s, i) => (
                <div
                  key={s.seg}
                  data-ocid={`lot_optimizer.balanced.card.${i + 1}`}
                  className="bg-amber/5 border border-amber/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-foreground">{s.seg}</p>
                    <span className="text-xs font-bold text-amber">
                      {s.diff > 0
                        ? `+${s.diff}%`
                        : s.diff === 0
                          ? "±0%"
                          : `${s.diff}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-text mb-2">
                    <span>
                      Lot: <strong className="text-foreground">{s.inv}%</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Demand:{" "}
                      <strong className="text-foreground">{s.demand}%</strong>
                    </span>
                  </div>
                  <div className="mt-1 px-2 py-1 rounded-md bg-amber/10 text-amber text-xs font-semibold inline-block">
                    Action: Maintain
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
