import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  DollarSign,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const MILESTONES = [7, 14, 21, 30, 45, 60, 90, 120];

export default function DealerFloorPlanPage() {
  const navigate = useNavigate();

  const [vehicleCost, setVehicleCost] = useState("25000");
  const [rate, setRate] = useState("8");
  const [daysOnLot, setDaysOnLot] = useState("30");
  const [targetProfit, setTargetProfit] = useState("2500");

  const cost = Number.parseFloat(vehicleCost) || 0;
  const annualRate = Number.parseFloat(rate) || 0;
  const days = Number.parseInt(daysOnLot) || 0;
  const profit = Number.parseFloat(targetProfit) || 0;

  const dailyRate = (cost * (annualRate / 100)) / 365;
  const totalCarryingCost = dailyRate * days;
  const breakEvenPrice = cost + totalCarryingCost;
  const targetPrice = breakEvenPrice + profit;

  const chartData = useMemo(() => {
    const maxDays = Math.max(days + 30, 120);
    return Array.from({ length: maxDays + 1 }, (_, d) => ({
      day: d,
      carryingCost: dailyRate * d,
      totalCost: cost + dailyRate * d,
    }));
  }, [cost, dailyRate, days]);

  const milestoneData = MILESTONES.map((d) => ({
    days: d,
    carryingCost: dailyRate * d,
    totalCost: cost + dailyRate * d,
    breakEven: cost + dailyRate * d,
    targetSell: cost + dailyRate * d + profit,
  }));

  const urgency =
    days >= 90
      ? "critical"
      : days >= 45
        ? "warning"
        : days >= 21
          ? "caution"
          : "good";

  const urgencyConfig = {
    good: {
      label: "Good Standing",
      color: "text-green-400",
      bg: "bg-green-400/10 border-green-400/20",
    },
    caution: {
      label: "Monitor Closely",
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
    },
    warning: {
      label: "High Carrying Cost",
      color: "text-orange-400",
      bg: "bg-orange-400/10 border-orange-400/20",
    },
    critical: {
      label: "Liquidate Now",
      color: "text-red-400",
      bg: "bg-red-400/10 border-red-400/20",
    },
  };

  const urg = urgencyConfig[urgency];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-1.5 text-sm text-muted-text hover:text-foreground transition-colors"
            data-ocid="floor_plan.back.button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-steel-border text-muted-text hover:text-foreground hover:border-amber/40 transition-colors"
          data-ocid="floor_plan.close.button"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-amber" />
          <h1 className="text-xl font-bold text-foreground">
            Floor Plan Cost Calculator
          </h1>
        </div>
        <p className="text-sm text-muted-text">
          Calculate daily carrying costs, break-even price, and optimal sell
          timing for your inventory.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-steel-border rounded-xl p-4 space-y-2">
          <label
            htmlFor="vehicle-cost"
            className="text-xs font-semibold text-muted-text uppercase tracking-wider"
          >
            Vehicle Cost (Auction/Wholesale)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
            <input
              id="vehicle-cost"
              type="number"
              value={vehicleCost}
              onChange={(e) => setVehicleCost(e.target.value)}
              className="w-full bg-background border border-steel-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="25000"
              data-ocid="floor_plan.vehicle_cost.input"
            />
          </div>
        </div>

        <div className="bg-surface border border-steel-border rounded-xl p-4 space-y-2">
          <label
            htmlFor="floor-rate"
            className="text-xs font-semibold text-muted-text uppercase tracking-wider"
          >
            Floor Plan Rate (Annual %)
          </label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
            <input
              id="floor-rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              step="0.1"
              className="w-full bg-background border border-steel-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="8"
              data-ocid="floor_plan.rate.input"
            />
          </div>
        </div>

        <div className="bg-surface border border-steel-border rounded-xl p-4 space-y-2">
          <label
            htmlFor="days-on-lot"
            className="text-xs font-semibold text-muted-text uppercase tracking-wider"
          >
            Days on Lot
          </label>
          <input
            id="days-on-lot"
            type="number"
            value={daysOnLot}
            onChange={(e) => setDaysOnLot(e.target.value)}
            className="w-full bg-background border border-steel-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber"
            placeholder="30"
            data-ocid="floor_plan.days.input"
          />
        </div>

        <div className="bg-surface border border-steel-border rounded-xl p-4 space-y-2">
          <label
            htmlFor="target-profit"
            className="text-xs font-semibold text-muted-text uppercase tracking-wider"
          >
            Target Profit
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
            <input
              id="target-profit"
              type="number"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
              className="w-full bg-background border border-steel-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="2500"
              data-ocid="floor_plan.profit.input"
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-steel-border rounded-xl p-4">
          <p className="text-xs text-muted-text mb-1">Daily Carrying Cost</p>
          <p className="text-xl font-bold text-amber">{fmt(dailyRate)}</p>
          <p className="text-xs text-muted-text mt-1">per day</p>
        </div>
        <div className="bg-surface border border-steel-border rounded-xl p-4">
          <p className="text-xs text-muted-text mb-1">Total Carrying Cost</p>
          <p className="text-xl font-bold text-foreground">
            {fmt(totalCarryingCost)}
          </p>
          <p className="text-xs text-muted-text mt-1">after {days} days</p>
        </div>
        <div className="bg-surface border border-steel-border rounded-xl p-4">
          <p className="text-xs text-muted-text mb-1">Break-Even Price</p>
          <p className="text-xl font-bold text-foreground">
            {fmt(breakEvenPrice)}
          </p>
          <p className="text-xs text-muted-text mt-1">minimum to not lose</p>
        </div>
        <div className="bg-surface border border-steel-border rounded-xl p-4">
          <p className="text-xs text-muted-text mb-1">Target Sell Price</p>
          <p className="text-xl font-bold text-green-400">{fmt(targetPrice)}</p>
          <p className="text-xs text-muted-text mt-1">
            with {fmt(profit)} profit
          </p>
        </div>
      </div>

      {/* Urgency alert */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${urg.bg}`}>
        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${urg.color}`} />
        <div>
          <p className={`text-sm font-bold ${urg.color}`}>{urg.label}</p>
          <p className="text-xs text-muted-text mt-0.5">
            {urgency === "good" &&
              "This vehicle has low carrying cost so far. You have room to wait for the right buyer."}
            {urgency === "caution" &&
              `Carrying costs are accumulating. Consider reducing asking price by ${fmt(dailyRate * 7)} to move within the next week.`}
            {urgency === "warning" &&
              `High carrying cost of ${fmt(totalCarryingCost)} already accrued. Reduce price or wholesale immediately.`}
            {urgency === "critical" &&
              `You are losing ${fmt(dailyRate)}/day. Wholesale or deeply discount — remaining at list price is costing you money daily.`}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface border border-steel-border rounded-xl p-4">
        <h2 className="text-sm font-bold text-foreground mb-4">
          Cumulative Cost Over Time
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `${v}d`}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v) => `Day ${v}`}
              formatter={(v: number, name: string) => [
                fmt(v),
                name === "totalCost" ? "Total Cost" : "Carrying Cost",
              ]}
            />
            <ReferenceLine
              x={days}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{ value: "Today", fill: "#EF4444", fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="totalCost"
              stroke="#F59E0B"
              fill="url(#costGrad)"
              strokeWidth={2}
              name="totalCost"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Milestone table */}
      <div className="bg-surface border border-steel-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-steel-border">
          <h2 className="text-sm font-bold text-foreground">
            Milestone Projections
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            data-ocid="floor_plan.milestones.table"
          >
            <thead>
              <tr className="border-b border-steel-border">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-text uppercase tracking-wider">
                  Days
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-text uppercase tracking-wider">
                  Carrying Cost
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-text uppercase tracking-wider">
                  Break-Even
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-text uppercase tracking-wider">
                  Target Sell
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-text uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {milestoneData.map((row, i) => {
                const isPast = row.days <= days;
                return (
                  <tr
                    key={row.days}
                    data-ocid={`floor_plan.milestone.row.${i + 1}`}
                    className={`border-b border-steel-border/50 last:border-0 ${isPast ? "bg-amber/3" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      {row.days}d
                      {isPast && (
                        <span className="ml-2 text-xs text-amber font-normal">
                          (current)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-text">
                      {fmt(row.carryingCost)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-foreground">
                      {fmt(row.breakEven)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-green-400 font-semibold">
                      {fmt(row.targetSell)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.days <= 21
                            ? "bg-green-400/10 text-green-400"
                            : row.days <= 45
                              ? "bg-amber-400/10 text-amber-400"
                              : row.days <= 90
                                ? "bg-orange-400/10 text-orange-400"
                                : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {row.days <= 21
                          ? "Good"
                          : row.days <= 45
                            ? "Caution"
                            : row.days <= 90
                              ? "High"
                              : "Critical"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
