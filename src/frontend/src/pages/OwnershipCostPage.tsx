import React, { useState, useEffect, useMemo } from 'react';
import { useSearch } from '@tanstack/react-router';
import {
  Calculator,
  Fuel,
  Wrench,
  Shield,
  CreditCard,
  DollarSign,
  TrendingUp,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FuelType = 'Gas' | 'Hybrid' | 'Electric' | 'Diesel';
type LoanTerm = 24 | 36 | 48 | 60 | 72 | 84;

interface CalcInputs {
  make: string;
  model: string;
  year: number;
  purchasePrice: number;
  currentMileage: number;
  fuelType: FuelType;
  annualMiles: number;
  loanAmount: number;
  loanRate: number;
  loanTerm: LoanTerm;
}

interface CalcResults {
  annualFuel: number;
  annualMaintenance: number;
  annualInsurance: number;
  monthlyLoan: number;
  totalMonthly: number;
  totalAnnual: number;
}

// ─── Calculations ──────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

function calcAnnualFuel(fuelType: FuelType, annualMiles: number): number {
  switch (fuelType) {
    case 'Gas':     return (annualMiles / 28) * 3.5;
    case 'Hybrid':  return (annualMiles / 45) * 3.5;
    case 'Electric': return (annualMiles / 3.5) * 0.14;
    case 'Diesel':  return (annualMiles / 35) * 4.0;
  }
}

function calcAnnualMaintenance(year: number, mileage: number): number {
  const age = CURRENT_YEAR - year;
  let base: number;
  if (age <= 3) base = 600;
  else if (age <= 7) base = 900;
  else if (age <= 12) base = 1300;
  else base = 1800;
  if (mileage > 100_000) base += 200;
  return base;
}

function calcAnnualInsurance(purchasePrice: number, fuelType: FuelType): number {
  let base = 1400;
  if (purchasePrice > 30_000) base += 200;
  else if (purchasePrice < 15_000) base -= 100;
  if (fuelType === 'Electric') base += 150;
  return base;
}

function calcMonthlyLoan(loanAmount: number, ratePercent: number, termMonths: number): number {
  if (loanAmount <= 0 || ratePercent <= 0) return 0;
  const r = ratePercent / 100 / 12;
  const n = termMonths;
  return (loanAmount * r) / (1 - Math.pow(1 + r, -n));
}

function calcAll(inputs: CalcInputs): CalcResults {
  const annualFuel = calcAnnualFuel(inputs.fuelType, inputs.annualMiles);
  const annualMaintenance = calcAnnualMaintenance(inputs.year, inputs.currentMileage);
  const annualInsurance = calcAnnualInsurance(inputs.purchasePrice, inputs.fuelType);
  const monthlyLoan = calcMonthlyLoan(inputs.loanAmount, inputs.loanRate, inputs.loanTerm);
  const annualLoan = monthlyLoan * 12;
  const totalAnnual = annualFuel + annualMaintenance + annualInsurance + annualLoan;
  const totalMonthly = totalAnnual / 12;

  return {
    annualFuel,
    annualMaintenance,
    annualInsurance,
    monthlyLoan,
    totalMonthly,
    totalAnnual,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

const fmtDec = (n: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ResultCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: 'amber' | 'emerald' | 'rose' | 'blue';
}

function ResultCard({ icon, label, value, sub, highlight }: ResultCardProps) {
  const colorMap = {
    amber:   { border: 'border-amber/30',   bg: 'bg-amber/5',   text: 'text-amber',           iconBg: 'bg-amber/10'   },
    emerald: { border: 'border-emerald/30', bg: 'bg-emerald/5', text: 'text-emerald',         iconBg: 'bg-emerald/10' },
    rose:    { border: 'border-rose-500/30', bg: 'bg-rose-500/5', text: 'text-rose-400',       iconBg: 'bg-rose-500/10' },
    blue:    { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400',       iconBg: 'bg-blue-500/10' },
  };
  const c = highlight ? colorMap[highlight] : { border: 'border-steel-border', bg: 'bg-surface', text: 'text-foreground', iconBg: 'bg-background/40' };

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-2 ${c.border} ${c.bg}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.iconBg}`}>
        <span className={c.text}>{icon}</span>
      </div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
      <div className={`text-2xl font-bold font-display tracking-tight ${c.text}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ─── Cost Breakdown Bar ───────────────────────────────────────────────────────

interface BreakdownSegment {
  label: string;
  value: number;
  color: string;
  bg: string;
}

interface CostBreakdownBarProps {
  segments: BreakdownSegment[];
  total: number;
}

function CostBreakdownBar({ segments, total }: CostBreakdownBarProps) {
  if (total <= 0) return null;

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-8 rounded-lg overflow-hidden w-full gap-px">
        {segments.map((seg) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={seg.label}
              style={{ width: `${pct}%` }}
              className={`${seg.bg} relative group transition-all duration-500 flex items-center justify-center`}
              title={`${seg.label}: ${fmt(seg.value)} (${pct.toFixed(1)}%)`}
            >
              {pct > 10 && (
                <span className="text-[10px] font-bold text-black/70 truncate px-1 hidden sm:block">
                  {pct.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {segments.map((seg) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={seg.label} className="flex items-center gap-2 text-xs">
              <span className={`w-3 h-3 rounded-sm shrink-0 ${seg.bg}`} />
              <div className="min-w-0">
                <div className="text-foreground font-medium truncate">{seg.label}</div>
                <div className="text-muted-foreground">{fmt(seg.value)} · {pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Multi-Year Table ─────────────────────────────────────────────────────────

interface MultiYearTableProps {
  purchasePrice: number;
  results: CalcResults;
}

function MultiYearTable({ purchasePrice, results }: MultiYearTableProps) {
  const rows = [1, 3, 5].map((years) => {
    const operatingCost = results.totalAnnual * years;
    const totalCost = purchasePrice + operatingCost;
    return { years, operatingCost, totalCost };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-steel-border">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Horizon</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Price</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cumulative Operating</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cost of Ownership</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ years, operatingCost, totalCost }) => (
            <tr key={years} className="border-b border-steel-border/40 hover:bg-surface/50 transition-colors">
              <td className="px-4 py-3 font-semibold text-foreground">
                {years} {years === 1 ? 'Year' : 'Years'}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">{fmt(purchasePrice)}</td>
              <td className="px-4 py-3 text-right text-amber font-medium">{fmt(operatingCost)}</td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-foreground text-base">{fmt(totalCost)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  sublabel?: string;
  htmlFor: string;
  children: React.ReactNode;
}

function InputField({ label, sublabel, htmlFor, children }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
        {sublabel && <span className="ml-1 normal-case font-normal text-muted-foreground/60">({sublabel})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OwnershipCostPage() {
  const search = useSearch({ strict: false }) as Record<string, string>;

  const [inputs, setInputs] = useState<CalcInputs>({
    make:           search.make  ?? 'Toyota',
    model:          search.model ?? 'Camry',
    year:           search.year  ? Number(search.year)  : CURRENT_YEAR - 3,
    purchasePrice:  search.price ? Number(search.price) : 25000,
    currentMileage: search.mileage ? Number(search.mileage) : 50000,
    fuelType:       'Gas',
    annualMiles:    12000,
    loanAmount:     20000,
    loanRate:       6.5,
    loanTerm:       60,
  });

  // Re-apply query params if they change (e.g. navigating from a listing)
  useEffect(() => {
    setInputs((prev) => ({
      ...prev,
      ...(search.make   ? { make: search.make }                     : {}),
      ...(search.model  ? { model: search.model }                   : {}),
      ...(search.year   ? { year: Number(search.year) }             : {}),
      ...(search.price  ? { purchasePrice: Number(search.price) }   : {}),
      ...(search.mileage ? { currentMileage: Number(search.mileage) } : {}),
    }));
  }, [search.make, search.model, search.year, search.price, search.mileage]);

  const set = <K extends keyof CalcInputs>(key: K, value: CalcInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const results = useMemo(() => calcAll(inputs), [inputs]);

  const breakdownSegments: BreakdownSegment[] = [
    { label: 'Fuel',        value: results.annualFuel,        color: 'text-amber',    bg: 'bg-amber' },
    { label: 'Maintenance', value: results.annualMaintenance, color: 'text-blue-400', bg: 'bg-blue-500' },
    { label: 'Insurance',   value: results.annualInsurance,   color: 'text-emerald',  bg: 'bg-emerald' },
    { label: 'Loan',        value: results.monthlyLoan * 12,  color: 'text-rose-400', bg: 'bg-rose-500' },
  ];

  const annualOperating = results.annualFuel + results.annualMaintenance + results.annualInsurance;

  const LOAN_TERMS: LoanTerm[] = [24, 36, 48, 60, 72, 84];
  const FUEL_TYPES: FuelType[] = ['Gas', 'Hybrid', 'Electric', 'Diesel'];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber/10 border border-amber/20">
          <Calculator className="w-5 h-5 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground uppercase">
            Ownership Cost Calculator
          </h1>
          <p className="text-sm text-muted-foreground">
            Estimate total annual and multi-year costs for any vehicle
          </p>
        </div>
      </div>

      {/* Pre-fill notice when arriving from a listing */}
      {(search.make || search.model) && (
        <div className="flex items-start gap-2 rounded-lg bg-amber/5 border border-amber/20 px-4 py-3">
          <Info className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pre-filled from listing:{' '}
            <span className="text-amber font-medium">
              {[search.year, search.make, search.model].filter(Boolean).join(' ')}
            </span>
            {search.price && <span> · {fmt(Number(search.price))}</span>}
            {search.mileage && <span> · {Number(search.mileage).toLocaleString()} mi</span>}
            . Adjust any field below to refine your estimate.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 items-start">

        {/* ── Inputs Panel ── */}
        <div className="space-y-5">

          {/* Vehicle Info */}
          <section className="bg-surface border border-steel-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-steel-border/60">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber">Vehicle</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField label="Make" htmlFor="oc-make">
                <input
                  id="oc-make"
                  type="text"
                  value={inputs.make}
                  onChange={(e) => set('make', e.target.value)}
                  placeholder="Toyota"
                  className={inputCls}
                />
              </InputField>
              <InputField label="Model" htmlFor="oc-model">
                <input
                  id="oc-model"
                  type="text"
                  value={inputs.model}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder="Camry"
                  className={inputCls}
                />
              </InputField>
              <InputField label="Year" htmlFor="oc-year">
                <input
                  id="oc-year"
                  type="number"
                  value={inputs.year}
                  onChange={(e) => set('year', Number(e.target.value))}
                  min={1990}
                  max={CURRENT_YEAR + 1}
                  className={inputCls}
                />
              </InputField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Purchase Price" sublabel="$" htmlFor="oc-price">
                <input
                  id="oc-price"
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => set('purchasePrice', Number(e.target.value))}
                  min={0}
                  step={500}
                  className={inputCls}
                />
              </InputField>
              <InputField label="Current Mileage" sublabel="miles" htmlFor="oc-mileage">
                <input
                  id="oc-mileage"
                  type="number"
                  value={inputs.currentMileage}
                  onChange={(e) => set('currentMileage', Number(e.target.value))}
                  min={0}
                  step={1000}
                  className={inputCls}
                />
              </InputField>
            </div>
          </section>

          {/* Usage */}
          <section className="bg-surface border border-steel-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-steel-border/60">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber">Usage</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Fuel Type" htmlFor="oc-fuel-type">
                <select
                  id="oc-fuel-type"
                  value={inputs.fuelType}
                  onChange={(e) => set('fuelType', e.target.value as FuelType)}
                  className={inputCls}
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </InputField>
              <InputField label="Annual Miles Driven" sublabel="miles/yr" htmlFor="oc-annual-miles">
                <input
                  id="oc-annual-miles"
                  type="number"
                  value={inputs.annualMiles}
                  onChange={(e) => set('annualMiles', Number(e.target.value))}
                  min={1000}
                  step={1000}
                  className={inputCls}
                />
              </InputField>
            </div>
          </section>

          {/* Financing */}
          <section className="bg-surface border border-steel-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-steel-border/60">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber">Financing</span>
              <span className="text-xs text-muted-foreground ml-auto">Set loan amount to 0 if paying cash</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField label="Loan Amount" sublabel="$" htmlFor="oc-loan-amount">
                <input
                  id="oc-loan-amount"
                  type="number"
                  value={inputs.loanAmount}
                  onChange={(e) => set('loanAmount', Number(e.target.value))}
                  min={0}
                  step={500}
                  className={inputCls}
                />
              </InputField>
              <InputField label="Interest Rate" sublabel="% APR" htmlFor="oc-loan-rate">
                <input
                  id="oc-loan-rate"
                  type="number"
                  value={inputs.loanRate}
                  onChange={(e) => set('loanRate', Number(e.target.value))}
                  min={0}
                  max={30}
                  step={0.1}
                  className={inputCls}
                />
              </InputField>
              <InputField label="Loan Term" sublabel="months" htmlFor="oc-loan-term">
                <select
                  id="oc-loan-term"
                  value={inputs.loanTerm}
                  onChange={(e) => set('loanTerm', Number(e.target.value) as LoanTerm)}
                  className={inputCls}
                >
                  {LOAN_TERMS.map((t) => (
                    <option key={t} value={t}>{t} months ({(t / 12).toFixed(1)} yrs)</option>
                  ))}
                </select>
              </InputField>
            </div>
          </section>

          {/* Assumptions reference */}
          <div className="rounded-lg bg-background/60 border border-steel-border/50 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assumptions Used</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>Gas: 28 MPG @ $3.50/gal</span>
              <span>Hybrid: 45 MPG @ $3.50/gal</span>
              <span>Electric: 3.5 mi/kWh @ $0.14/kWh</span>
              <span>Diesel: 35 MPG @ $4.00/gal</span>
              <span>Maintenance: age & mileage based</span>
              <span>Insurance: base $1,400/yr ± adjustments</span>
            </div>
          </div>
        </div>

        {/* ── Results Column ── */}
        <div className="space-y-5 xl:sticky xl:top-20">

          {/* Summary Result Cards */}
          <div className="grid grid-cols-2 gap-3">
            <ResultCard
              icon={<Fuel className="w-4 h-4" />}
              label="Annual Fuel"
              value={fmt(results.annualFuel)}
              sub={`${inputs.fuelType} · ${inputs.annualMiles.toLocaleString()} mi/yr`}
              highlight="amber"
            />
            <ResultCard
              icon={<Wrench className="w-4 h-4" />}
              label="Annual Maintenance"
              value={fmt(results.annualMaintenance)}
              sub={`${CURRENT_YEAR - inputs.year} yr old vehicle`}
              highlight="blue"
            />
            <ResultCard
              icon={<Shield className="w-4 h-4" />}
              label="Annual Insurance"
              value={fmt(results.annualInsurance)}
              sub="Est. national avg"
              highlight="emerald"
            />
            <ResultCard
              icon={<CreditCard className="w-4 h-4" />}
              label="Monthly Loan"
              value={fmtDec(results.monthlyLoan)}
              sub={inputs.loanAmount > 0 ? `${inputs.loanTerm}mo @ ${inputs.loanRate}%` : 'No financing'}
              highlight="rose"
            />
          </div>

          {/* Total Summary Card */}
          <div className="bg-surface border border-amber/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber">Cost Summary</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Operating (excl. loan)</span>
                <span className="text-sm font-medium text-foreground">{fmt(annualOperating)}/yr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Annual Loan Payments</span>
                <span className="text-sm font-medium text-foreground">{fmt(results.monthlyLoan * 12)}/yr</span>
              </div>
              <div className="border-t border-steel-border/60 pt-2 mt-2 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-foreground">Total Monthly</span>
                <span className="text-2xl font-bold font-display text-amber">{fmtDec(results.totalMonthly)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-foreground">Total Annual</span>
                <span className="text-xl font-bold font-display text-amber">{fmt(results.totalAnnual)}</span>
              </div>
            </div>
          </div>

          {/* Mobile-only: quick note */}
          <p className="text-xs text-muted-foreground xl:hidden">
            Scroll down for multi-year breakdown and cost chart.
          </p>
        </div>
      </div>

      {/* Cost Breakdown Bar */}
      <section className="bg-surface border border-steel-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber" />
          <h2 className="text-sm font-semibold font-display uppercase tracking-wide text-foreground">
            Annual Cost Breakdown
          </h2>
          <span className="ml-auto text-xs text-muted-foreground">
            Total: {fmt(results.totalAnnual)}/yr
          </span>
        </div>
        <CostBreakdownBar segments={breakdownSegments} total={results.totalAnnual} />
      </section>

      {/* Multi-Year Table */}
      <section className="bg-surface border border-steel-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-steel-border flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber" />
          <h2 className="text-sm font-semibold font-display uppercase tracking-wide text-foreground">
            Multi-Year Total Cost of Ownership
          </h2>
        </div>
        <MultiYearTable purchasePrice={inputs.purchasePrice} results={results} />
        <div className="px-5 py-3 border-t border-steel-border/50 bg-background/30">
          <p className="text-xs text-muted-foreground italic">
            * Operating costs include fuel, maintenance, insurance, and loan payments.
            Depreciation and taxes are not included.
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg bg-background/60 border border-steel-border/40 px-4 py-3">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="font-medium text-foreground">Disclaimer:</strong> Estimates are approximate and based on national averages.
          Actual fuel economy, insurance premiums, and maintenance costs vary by driver behavior, location, insurer, and vehicle condition.
          This calculator is for planning purposes only.
        </p>
      </div>

    </div>
  );
}
