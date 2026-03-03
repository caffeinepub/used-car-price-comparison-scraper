import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Fuel,
  LineChart,
  Shield,
  TrendingDown,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
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

// ─── TCO Calculation ──────────────────────────────────────────────────────────

const DEPRECIATION_RATES = [0.18, 0.15, 0.13, 0.11, 0.09];
const MAINTENANCE_COSTS = [500, 800, 1200, 1500, 2000];
const FUEL_COST_PER_GALLON = 3.5;
const AVG_MPG = 28;
const BASE_INSURANCE = 1400;

interface YearData {
  year: string;
  depreciation: number;
  fuel: number;
  insurance: number;
  maintenance: number;
  total: number;
}

function computeTCO(price: number, annualMiles: number): YearData[] {
  return DEPRECIATION_RATES.map((rate, i) => {
    const depreciation = Math.round(price * rate);
    const fuel = Math.round((annualMiles / AVG_MPG) * FUEL_COST_PER_GALLON);
    const insurance = Math.round(BASE_INSURANCE * 1.03 ** i);
    const maintenance = MAINTENANCE_COSTS[i];
    const total = depreciation + fuel + insurance + maintenance;
    return {
      year: `Year ${i + 1}`,
      depreciation,
      fuel,
      insurance,
      maintenance,
      total,
    };
  });
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + p.value, 0);
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 min-w-[180px]">
      <div className="font-bold text-foreground text-sm mb-2">{label}</div>
      {payload.map((p) => (
        <div
          key={p.name}
          className="flex justify-between items-center gap-4 text-xs py-0.5"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm inline-block"
              style={{ background: p.color }}
            />
            <span className="text-muted-foreground capitalize">{p.name}</span>
          </span>
          <span className="font-medium text-foreground">
            {fmtCurrency(p.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-border mt-2 pt-2 flex justify-between text-xs font-bold">
        <span className="text-foreground">Total</span>
        <span className="text-amber">{fmtCurrency(total)}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TCOTimelinePage() {
  const [make, setMake] = useState("Toyota");
  const [model, setModel] = useState("Camry");
  const [year, setYear] = useState(new Date().getFullYear() - 2);
  const [price, setPrice] = useState(25000);
  const [annualMiles, setAnnualMiles] = useState(12000);

  const tcoData = useMemo(
    () => computeTCO(price, annualMiles),
    [price, annualMiles],
  );

  const totalFiveYear = tcoData.reduce((sum, y) => sum + y.total, 0);
  const monthlyAvg = Math.round(totalFiveYear / 60);

  const totalDepreciation = tcoData.reduce((sum, y) => sum + y.depreciation, 0);
  const totalFuel = tcoData.reduce((sum, y) => sum + y.fuel, 0);
  const totalInsurance = tcoData.reduce((sum, y) => sum + y.insurance, 0);
  const totalMaintenance = tcoData.reduce((sum, y) => sum + y.maintenance, 0);

  const cumulative = tcoData.reduce<number[]>((acc, y) => {
    const prev = acc[acc.length - 1] ?? 0;
    acc.push(prev + y.total);
    return acc;
  }, []);

  const vehicleName = [year, make, model].filter(Boolean).join(" ");

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber/10 border border-amber/20 shrink-0">
          <LineChart className="w-6 h-6 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground uppercase">
            True Cost of Ownership
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            5-year total cost projection combining depreciation, fuel,
            insurance, and maintenance.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="tco-make"
                className="text-xs text-muted-foreground"
              >
                Make
              </label>
              <input
                id="tco-make"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                data-ocid="tco.make.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="tco-model"
                className="text-xs text-muted-foreground"
              >
                Model
              </label>
              <input
                id="tco-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                data-ocid="tco.model.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="tco-year"
                className="text-xs text-muted-foreground"
              >
                Year
              </label>
              <input
                id="tco-year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={1990}
                max={new Date().getFullYear() + 1}
                data-ocid="tco.year.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="tco-price"
                className="text-xs text-muted-foreground"
              >
                Purchase Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                  $
                </span>
                <input
                  id="tco-price"
                  type="number"
                  value={price}
                  onChange={(e) =>
                    setPrice(Math.max(1000, Number(e.target.value)))
                  }
                  min={1000}
                  data-ocid="tco.price.input"
                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="tco-miles"
                className="text-xs text-muted-foreground"
              >
                Miles/Year
              </label>
              <input
                id="tco-miles"
                type="number"
                value={annualMiles}
                onChange={(e) =>
                  setAnnualMiles(Math.max(1000, Number(e.target.value)))
                }
                min={1000}
                data-ocid="tco.miles.input"
                className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Banner */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        data-ocid="tco.card"
      >
        <Card className="bg-amber/10 border-amber/30 sm:col-span-1">
          <CardContent className="p-5 text-center">
            <DollarSign className="w-6 h-6 text-amber mx-auto mb-2" />
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              True 5-Year Cost
            </div>
            <div className="text-3xl font-bold text-amber font-display">
              {fmtCurrency(totalFiveYear + price)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Purchase + ownership costs
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-5 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Monthly Average
            </div>
            <div className="text-2xl font-bold text-foreground font-display">
              {fmtCurrency(monthlyAvg)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Ownership costs only
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-5 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Depreciation 5yr
            </div>
            <div className="text-2xl font-bold text-foreground font-display">
              {fmtCurrency(totalDepreciation)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((totalDepreciation / price) * 100)}% of purchase price
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stacked Bar Chart */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
            Annual Cost Breakdown — {vehicleName}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Stacked costs per year over 5 years
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-72" data-ocid="tco.chart_point">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tcoData}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--steel-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  formatter={(value) => (
                    <span className="text-muted-foreground capitalize">
                      {value}
                    </span>
                  )}
                />
                <Bar
                  dataKey="depreciation"
                  name="depreciation"
                  stackId="a"
                  fill="oklch(0.72 0.18 65)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="fuel"
                  name="fuel"
                  stackId="a"
                  fill="oklch(0.55 0.15 200)"
                />
                <Bar
                  dataKey="insurance"
                  name="insurance"
                  stackId="a"
                  fill="oklch(0.65 0.18 160)"
                />
                <Bar
                  dataKey="maintenance"
                  name="maintenance"
                  stackId="a"
                  fill="oklch(0.55 0.22 25)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Table */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold font-display uppercase tracking-wider text-foreground">
            Year-by-Year Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" data-ocid="tco.table">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-steel-border">
                  <th className="pb-2 pr-4 font-medium">Year</th>
                  <th className="pb-2 pr-4 font-medium">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Depreciation
                    </span>
                  </th>
                  <th className="pb-2 pr-4 font-medium">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3 h-3" />
                      Fuel
                    </span>
                  </th>
                  <th className="pb-2 pr-4 font-medium">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Insurance
                    </span>
                  </th>
                  <th className="pb-2 pr-4 font-medium">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      Maintenance
                    </span>
                  </th>
                  <th className="pb-2 pr-4 font-medium text-amber">
                    Annual Total
                  </th>
                  <th className="pb-2 font-medium text-muted-foreground">
                    Cumulative
                  </th>
                </tr>
              </thead>
              <tbody>
                {tcoData.map((row, i) => (
                  <tr
                    key={row.year}
                    data-ocid={`tco.row.${i + 1}`}
                    className="border-b border-steel-border/50 last:border-0 hover:bg-background/50 transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-bold text-foreground font-display">
                      {row.year}
                    </td>
                    <td className="py-2.5 pr-4 text-amber">
                      {fmtCurrency(row.depreciation)}
                    </td>
                    <td className="py-2.5 pr-4 text-blue-500 dark:text-blue-400">
                      {fmtCurrency(row.fuel)}
                    </td>
                    <td className="py-2.5 pr-4 text-emerald-600 dark:text-emerald-400">
                      {fmtCurrency(row.insurance)}
                    </td>
                    <td className="py-2.5 pr-4 text-red-500 dark:text-red-400">
                      {fmtCurrency(row.maintenance)}
                    </td>
                    <td className="py-2.5 pr-4 font-bold text-amber">
                      {fmtCurrency(row.total)}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {fmtCurrency(cumulative[i])}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-steel-border font-bold">
                  <td className="pt-3 pr-4 text-foreground font-display uppercase text-xs">
                    5-Year Total
                  </td>
                  <td className="pt-3 pr-4 text-amber">
                    {fmtCurrency(totalDepreciation)}
                  </td>
                  <td className="pt-3 pr-4 text-blue-500 dark:text-blue-400">
                    {fmtCurrency(totalFuel)}
                  </td>
                  <td className="pt-3 pr-4 text-emerald-600 dark:text-emerald-400">
                    {fmtCurrency(totalInsurance)}
                  </td>
                  <td className="pt-3 pr-4 text-red-500 dark:text-red-400">
                    {fmtCurrency(totalMaintenance)}
                  </td>
                  <td className="pt-3 pr-4 text-amber text-base">
                    {fmtCurrency(totalFiveYear)}
                  </td>
                  <td className="pt-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions Note */}
      <Card className="bg-surface border-steel-border border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Assumptions:</strong> Fuel cost{" "}
            {fmtCurrency(FUEL_COST_PER_GALLON)}/gal · Average {AVG_MPG} MPG ·
            Base insurance {fmtCurrency(BASE_INSURANCE)}/yr (+3%/yr) ·
            Maintenance based on typical service intervals. Depreciation uses
            standard industry rates (Year 1: 18%, Year 2: 15%, Year 3: 13%, Year
            4: 11%, Year 5: 9%). Actual costs will vary by region, driving
            habits, and vehicle condition.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
