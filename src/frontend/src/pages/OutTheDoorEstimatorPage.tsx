import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calculator, DollarSign, RefreshCw, X } from "lucide-react";
import { useState } from "react";

const STATE_TAX_RATES: { label: string; value: string; rate: number }[] = [
  { label: "Alabama (AL) — 2%", value: "AL", rate: 0.02 },
  { label: "Alaska (AK) — 0%", value: "AK", rate: 0 },
  { label: "Arizona (AZ) — 5.6%", value: "AZ", rate: 0.056 },
  { label: "Arkansas (AR) — 6.5%", value: "AR", rate: 0.065 },
  { label: "California (CA) — 7.25%", value: "CA", rate: 0.0725 },
  { label: "Colorado (CO) — 2.9%", value: "CO", rate: 0.029 },
  { label: "Connecticut (CT) — 6.35%", value: "CT", rate: 0.0635 },
  { label: "Delaware (DE) — 0%", value: "DE", rate: 0 },
  { label: "Washington DC — 6%", value: "DC", rate: 0.06 },
  { label: "Florida (FL) — 6%", value: "FL", rate: 0.06 },
  { label: "Georgia (GA) — 7%", value: "GA", rate: 0.07 },
  { label: "Hawaii (HI) — 4%", value: "HI", rate: 0.04 },
  { label: "Idaho (ID) — 6%", value: "ID", rate: 0.06 },
  { label: "Illinois (IL) — 6.25%", value: "IL", rate: 0.0625 },
  { label: "Indiana (IN) — 7%", value: "IN", rate: 0.07 },
  { label: "Iowa (IA) — 5%", value: "IA", rate: 0.05 },
  { label: "Kansas (KS) — 7.3%", value: "KS", rate: 0.073 },
  { label: "Kentucky (KY) — 6%", value: "KY", rate: 0.06 },
  { label: "Louisiana (LA) — 4.45%", value: "LA", rate: 0.0445 },
  { label: "Maine (ME) — 5.5%", value: "ME", rate: 0.055 },
  { label: "Maryland (MD) — 6%", value: "MD", rate: 0.06 },
  { label: "Massachusetts (MA) — 6.25%", value: "MA", rate: 0.0625 },
  { label: "Michigan (MI) — 6%", value: "MI", rate: 0.06 },
  { label: "Minnesota (MN) — 6.5%", value: "MN", rate: 0.065 },
  { label: "Mississippi (MS) — 5%", value: "MS", rate: 0.05 },
  { label: "Missouri (MO) — 4.225%", value: "MO", rate: 0.04225 },
  { label: "Montana (MT) — 0%", value: "MT", rate: 0 },
  { label: "Nebraska (NE) — 5.5%", value: "NE", rate: 0.055 },
  { label: "Nevada (NV) — 6.85%", value: "NV", rate: 0.0685 },
  { label: "New Hampshire (NH) — 0%", value: "NH", rate: 0 },
  { label: "New Jersey (NJ) — 6.625%", value: "NJ", rate: 0.06625 },
  { label: "New Mexico (NM) — 4%", value: "NM", rate: 0.04 },
  { label: "New York (NY) — 4%", value: "NY", rate: 0.04 },
  { label: "North Carolina (NC) — 3%", value: "NC", rate: 0.03 },
  { label: "North Dakota (ND) — 5%", value: "ND", rate: 0.05 },
  { label: "Ohio (OH) — 5.75%", value: "OH", rate: 0.0575 },
  { label: "Oklahoma (OK) — 3.25%", value: "OK", rate: 0.0325 },
  { label: "Oregon (OR) — 0%", value: "OR", rate: 0 },
  { label: "Pennsylvania (PA) — 6%", value: "PA", rate: 0.06 },
  { label: "Rhode Island (RI) — 7%", value: "RI", rate: 0.07 },
  { label: "South Carolina (SC) — 5%", value: "SC", rate: 0.05 },
  { label: "South Dakota (SD) — 4%", value: "SD", rate: 0.04 },
  { label: "Tennessee (TN) — 7%", value: "TN", rate: 0.07 },
  { label: "Texas (TX) — 6.25%", value: "TX", rate: 0.0625 },
  { label: "Utah (UT) — 6.85%", value: "UT", rate: 0.0685 },
  { label: "Vermont (VT) — 6%", value: "VT", rate: 0.06 },
  { label: "Virginia (VA) — 4.15%", value: "VA", rate: 0.0415 },
  { label: "Washington (WA) — 6.5%", value: "WA", rate: 0.065 },
  { label: "West Virginia (WV) — 6%", value: "WV", rate: 0.06 },
  { label: "Wisconsin (WI) — 5%", value: "WI", rate: 0.05 },
  { label: "Wyoming (WY) — 4%", value: "WY", rate: 0.04 },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number,
): number {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);
}

interface Results {
  basePrice: number;
  salesTax: number;
  docFee: number;
  titleFee: number;
  regFee: number;
  total: number;
  amountFinanced: number;
  monthlyPayment: number;
  loanTerm: number;
  extraOverSticker: number;
}

export default function OutTheDoorEstimatorPage() {
  const navigate = useNavigate();

  const [vehiclePrice, setVehiclePrice] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [docFee, setDocFee] = useState("0");
  const [titleFee, setTitleFee] = useState("150");
  const [regFee, setRegFee] = useState("200");
  const [downPayment, setDownPayment] = useState("0");
  const [loanTerm, setLoanTerm] = useState(60);
  const [interestRate, setInterestRate] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    const price = Number.parseFloat(vehiclePrice);
    if (!price || price <= 0) {
      setError("Please enter a valid vehicle price.");
      return;
    }
    if (!stateCode) {
      setError("Please select a state.");
      return;
    }
    setError("");

    const taxRate =
      STATE_TAX_RATES.find((s) => s.value === stateCode)?.rate ?? 0;
    const salesTax = price * taxRate;
    const doc = Number.parseFloat(docFee) || 0;
    const title = Number.parseFloat(titleFee) || 0;
    const reg = Number.parseFloat(regFee) || 0;
    const total = price + salesTax + doc + title + reg;
    const down = Number.parseFloat(downPayment) || 0;
    const financed = Math.max(0, total - down);
    const rate = Number.parseFloat(interestRate) || 0;
    const monthly =
      financed > 0 ? calcMonthlyPayment(financed, rate, loanTerm) : 0;

    setResults({
      basePrice: price,
      salesTax,
      docFee: doc,
      titleFee: title,
      regFee: reg,
      total,
      amountFinanced: financed,
      monthlyPayment: monthly,
      loanTerm,
      extraOverSticker: total - price,
    });
  }

  function handleClear() {
    setVehiclePrice("");
    setStateCode("");
    setDocFee("0");
    setTitleFee("150");
    setRegFee("200");
    setDownPayment("0");
    setLoanTerm(60);
    setInterestRate("");
    setResults(null);
    setError("");
  }

  const goBack = () => navigate({ to: "/" });

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
          data-ocid="out_the_door.back.button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={goBack}
          className="text-muted-foreground hover:text-amber-400 transition-colors"
          data-ocid="out_the_door.close.button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <DollarSign className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Real Out-the-Door Price Estimator
            </h1>
            <p className="text-sm text-muted-foreground">
              See exactly what you'll pay — including all taxes and fees
            </p>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-foreground">
              Vehicle &amp; Financing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Vehicle price */}
            <div className="space-y-1.5">
              <Label className="text-foreground">Vehicle Price *</Label>
              <Input
                type="number"
                placeholder="e.g. 28500"
                value={vehiclePrice}
                onChange={(e) => setVehiclePrice(e.target.value)}
                className="bg-background border-border text-foreground"
                data-ocid="out_the_door.vehicle_price.input"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <Label className="text-foreground">State (for sales tax) *</Label>
              <Select value={stateCode} onValueChange={setStateCode}>
                <SelectTrigger
                  className="bg-background border-border text-foreground"
                  data-ocid="out_the_door.state.select"
                >
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent
                  className="bg-popover border-border max-h-64 z-50"
                  style={{ backgroundColor: "var(--popover)" }}
                >
                  {STATE_TAX_RATES.map((s) => (
                    <SelectItem
                      key={s.value}
                      value={s.value}
                      className="text-foreground hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fee row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs">Doc Fee ($)</Label>
                <Input
                  type="number"
                  value={docFee}
                  onChange={(e) => setDocFee(e.target.value)}
                  className="bg-background border-border text-foreground"
                  data-ocid="out_the_door.doc_fee.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs">Title Fee ($)</Label>
                <Input
                  type="number"
                  value={titleFee}
                  onChange={(e) => setTitleFee(e.target.value)}
                  className="bg-background border-border text-foreground"
                  data-ocid="out_the_door.title_fee.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs">Reg. Fee ($)</Label>
                <Input
                  type="number"
                  value={regFee}
                  onChange={(e) => setRegFee(e.target.value)}
                  className="bg-background border-border text-foreground"
                  data-ocid="out_the_door.reg_fee.input"
                />
              </div>
            </div>

            <hr className="border-border" />

            {/* Financing */}
            <div className="space-y-1.5">
              <Label className="text-foreground">Down Payment ($)</Label>
              <Input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                className="bg-background border-border text-foreground"
                data-ocid="out_the_door.down_payment.input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Loan Term</Label>
              <div className="flex gap-2 flex-wrap">
                {[36, 48, 60, 72].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setLoanTerm(m)}
                    className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                      loanTerm === m
                        ? "bg-amber-500 border-amber-500 text-black"
                        : "border-border text-muted-foreground hover:border-amber-500/50 hover:text-amber-400"
                    }`}
                    data-ocid={`out_the_door.loan_term_${m}.toggle`}
                  >
                    {m} mo
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Interest Rate (% APR)</Label>
              <Input
                type="number"
                placeholder="e.g. 6.9"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="bg-background border-border text-foreground"
                data-ocid="out_the_door.interest_rate.input"
              />
            </div>

            {error && (
              <p
                className="text-sm text-red-400"
                data-ocid="out_the_door.error_state"
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                onClick={handleCalculate}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                data-ocid="out_the_door.calculate.submit_button"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="border-border text-muted-foreground hover:text-foreground"
                data-ocid="out_the_door.clear.button"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div
            className="mt-6 space-y-4"
            data-ocid="out_the_door.success_state"
          >
            {/* Amber callout */}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3">
              <p className="text-sm text-amber-300 font-semibold">
                You'll pay {fmt(results.extraOverSticker)} more than the sticker
                price in taxes &amp; fees
              </p>
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground">
                  Price Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <LineItem label="Base Price" value={fmt(results.basePrice)} />
                <LineItem label="Sales Tax" value={fmt(results.salesTax)} sub />
                <LineItem label="Doc Fee" value={fmt(results.docFee)} sub />
                <LineItem label="Title Fee" value={fmt(results.titleFee)} sub />
                <LineItem
                  label="Registration Fee"
                  value={fmt(results.regFee)}
                  sub
                />
                <hr className="border-border" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">
                    Total Out-the-Door
                  </span>
                  <span className="font-bold text-lg text-amber-400">
                    {fmt(results.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {results.amountFinanced > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-foreground">
                    Monthly Payment Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <LineItem
                    label="Amount Financed"
                    value={fmt(results.amountFinanced)}
                  />
                  <LineItem
                    label="Loan Term"
                    value={`${results.loanTerm} months`}
                  />
                  <hr className="border-border" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">
                      Est. Monthly Payment
                    </span>
                    <span className="font-bold text-lg text-amber-400">
                      {fmt(results.monthlyPayment)}/mo
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LineItem({
  label,
  value,
  sub,
}: { label: string; value: string; sub?: boolean }) {
  return (
    <div
      className={`flex justify-between items-center ${
        sub ? "text-muted-foreground" : "text-foreground"
      }`}
    >
      <span className="text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
