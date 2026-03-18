import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, RefreshCw, Search, X } from "lucide-react";
import { useState } from "react";
import { ALL_MAKES, CAR_MAKES_MODELS } from "../data/carMakesModels";

const CURRENT_YEAR = new Date().getFullYear();

const YEARS: string[] = Array.from(
  { length: CURRENT_YEAR - 1990 + 1 },
  (_, i) => String(CURRENT_YEAR - i),
);

type RiskTier = "Low Risk" | "Moderate" | "High Risk" | "Critical";

interface CategoryCount {
  Engine: number;
  Transmission: number;
  Brakes: number;
  Electrical: number;
  Safety: number;
  Other: number;
}

interface AnalysisResult {
  score: number;
  tier: RiskTier;
  complaintCount: number;
  recallCount: number;
  categories: CategoryCount;
  make: string;
  model: string;
  year: number;
}

function calcScore(complaints: number, recalls: number): number {
  let pts = 0;
  if (complaints >= 1 && complaints <= 10) pts += 15;
  else if (complaints >= 11 && complaints <= 30) pts += 30;
  else if (complaints >= 31 && complaints <= 100) pts += 50;
  else if (complaints > 100) pts += 65;

  if (recalls >= 1 && recalls <= 2) pts += 10;
  else if (recalls >= 3 && recalls <= 5) pts += 20;
  else if (recalls >= 6) pts += 35;

  return Math.min(100, pts);
}

function getTier(score: number): RiskTier {
  if (score <= 25) return "Low Risk";
  if (score <= 50) return "Moderate";
  if (score <= 75) return "High Risk";
  return "Critical";
}

function tierColor(tier: RiskTier) {
  switch (tier) {
    case "Low Risk":
      return {
        ring: "border-emerald-500",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    case "Moderate":
      return {
        ring: "border-amber-500",
        text: "text-amber-400",
        bg: "bg-amber-500/10",
      };
    case "High Risk":
      return {
        ring: "border-orange-500",
        text: "text-orange-400",
        bg: "bg-orange-500/10",
      };
    case "Critical":
      return {
        ring: "border-red-500",
        text: "text-red-400",
        bg: "bg-red-500/10",
      };
  }
}

function tierRecommendation(tier: RiskTier): string {
  switch (tier) {
    case "Low Risk":
      return "This vehicle has minimal complaint and recall history. It's a strong candidate — proceed with confidence and a standard pre-purchase inspection.";
    case "Moderate":
      return "This vehicle has a moderate number of complaints or recalls. Request a full vehicle history report and have a trusted mechanic inspect it before purchase.";
    case "High Risk":
      return "Significant complaint or recall history detected. Verify all recalls have been completed, budget for potential repairs, and negotiate the price down to account for reliability risk.";
    case "Critical":
      return "Critical risk level. This vehicle has a high volume of known issues. We strongly recommend considering an alternative vehicle or having a specialist inspection before any commitment.";
  }
}

function bucketCategory(
  complaints: { components?: string; summary?: string }[],
): CategoryCount {
  const cats: CategoryCount = {
    Engine: 0,
    Transmission: 0,
    Brakes: 0,
    Electrical: 0,
    Safety: 0,
    Other: 0,
  };
  for (const c of complaints) {
    const text = `${c.components ?? ""} ${c.summary ?? ""}`.toLowerCase();
    if (/engine|powertrain|oil|coolant|timing|cylinder|fuel pump/.test(text))
      cats.Engine++;
    else if (/transmission|gear|shift|clutch|torque/.test(text))
      cats.Transmission++;
    else if (/brake|abs|stopping|caliper/.test(text)) cats.Brakes++;
    else if (
      /electric|battery|wiring|module|sensor|display|infotainment/.test(text)
    )
      cats.Electrical++;
    else if (/airbag|seatbelt|crash|fire|rollover|safety/.test(text))
      cats.Safety++;
    else cats.Other++;
  }
  return cats;
}

export default function LemonRiskScorePage() {
  const navigate = useNavigate();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [noData, setNoData] = useState(false);
  const [error, setError] = useState("");

  function handleMakeChange(value: string) {
    setMake(value);
    setModel("");
  }

  async function handleAnalyze() {
    const y = Number.parseInt(year);
    if (!make) {
      setError("Please select a make.");
      return;
    }
    if (!model) {
      setError("Please select a model.");
      return;
    }
    if (!year || y < 1990) {
      setError(`Please select a year between 1990 and ${CURRENT_YEAR}.`);
      return;
    }
    setError("");
    setResult(null);
    setNoData(false);
    setLoading(true);

    try {
      const encodedMake = encodeURIComponent(make);
      const encodedModel = encodeURIComponent(model);

      const [complaintsRes, recallsRes] = await Promise.all([
        fetch(
          `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodedMake}&model=${encodedModel}&modelYear=${y}`,
        ),
        fetch(
          `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodedMake}&model=${encodedModel}&modelYear=${y}`,
        ),
      ]);

      const complaintsData = await complaintsRes.json();
      const recallsData = await recallsRes.json();

      const complaintList = complaintsData?.results ?? [];
      const recallList = recallsData?.results ?? [];

      if (complaintList.length === 0 && recallList.length === 0) {
        setNoData(true);
        setLoading(false);
        return;
      }

      const score = calcScore(complaintList.length, recallList.length);
      setResult({
        score,
        tier: getTier(score),
        complaintCount: complaintList.length,
        recallCount: recallList.length,
        categories: bucketCategory(complaintList),
        make,
        model,
        year: y,
      });
    } catch (_e) {
      setNoData(true);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMake("");
    setModel("");
    setYear("");
    setResult(null);
    setNoData(false);
    setError("");
  }

  const goBack = () => navigate({ to: "/" });

  const colors = result ? tierColor(result.tier) : null;
  const maxCategory = result
    ? Math.max(...Object.values(result.categories), 1)
    : 1;

  const availableModels = make ? (CAR_MAKES_MODELS[make] ?? []) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
          data-ocid="lemon_risk.back.button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={goBack}
          className="text-muted-foreground hover:text-amber-400 transition-colors"
          data-ocid="lemon_risk.close.button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Lemon Risk Score
            </h1>
            <p className="text-sm text-muted-foreground">
              NHTSA complaint &amp; recall analysis before you buy
            </p>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-foreground">
              Vehicle Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-foreground">Make *</Label>
              <Select value={make} onValueChange={handleMakeChange}>
                <SelectTrigger
                  className="bg-background border-border text-foreground"
                  data-ocid="lemon_risk.make.select"
                >
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent
                  className="bg-popover border-border max-h-64 z-50"
                  style={{ backgroundColor: "var(--popover)" }}
                >
                  {ALL_MAKES.map((m) => (
                    <SelectItem
                      key={m}
                      value={m}
                      className="text-foreground hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Model *</Label>
              <Select value={model} onValueChange={setModel} disabled={!make}>
                <SelectTrigger
                  className="bg-background border-border text-foreground"
                  data-ocid="lemon_risk.model.select"
                >
                  <SelectValue
                    placeholder={make ? "Select model" : "Select make first"}
                  />
                </SelectTrigger>
                <SelectContent
                  className="bg-popover border-border max-h-64 z-50"
                  style={{ backgroundColor: "var(--popover)" }}
                >
                  {availableModels.map((m) => (
                    <SelectItem
                      key={m}
                      value={m}
                      className="text-foreground hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Year *</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger
                  className="bg-background border-border text-foreground"
                  data-ocid="lemon_risk.year.select"
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent
                  className="bg-popover border-border max-h-64 z-50"
                  style={{ backgroundColor: "var(--popover)" }}
                >
                  {YEARS.map((y) => (
                    <SelectItem
                      key={y}
                      value={y}
                      className="text-foreground hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p
                className="text-sm text-red-400"
                data-ocid="lemon_risk.error_state"
              >
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                data-ocid="lemon_risk.analyze.submit_button"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="border-border text-muted-foreground hover:text-foreground"
                data-ocid="lemon_risk.clear.button"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* No data */}
        {noData && (
          <div
            className="mt-6 rounded-lg border border-border bg-card px-5 py-6 text-center"
            data-ocid="lemon_risk.empty_state"
          >
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-medium text-foreground">
              No NHTSA data found for this vehicle
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting the make, model, or year. Not all vehicles have
              NHTSA records.
            </p>
          </div>
        )}

        {/* Results */}
        {result && colors && (
          <div className="mt-6 space-y-4" data-ocid="lemon_risk.success_state">
            {/* Score circle */}
            <Card className={`border-2 ${colors.ring} bg-card`}>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-28 h-28 rounded-full border-4 ${colors.ring} ${colors.bg} flex flex-col items-center justify-center`}
                  >
                    <span className={`text-3xl font-black ${colors.text}`}>
                      {result.score}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                  <span className={`text-xl font-bold ${colors.text}`}>
                    {result.tier}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {result.year} {result.make} {result.model}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="rounded-lg bg-background/60 border border-border p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {result.complaintCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      NHTSA Complaints
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/60 border border-border p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {result.recallCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Safety Recalls
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <div
              className={`rounded-lg border ${colors.ring} ${colors.bg} px-4 py-3`}
            >
              <p className={`text-sm font-semibold ${colors.text} mb-1`}>
                Recommendation
              </p>
              <p className="text-sm text-foreground">
                {tierRecommendation(result.tier)}
              </p>
            </div>

            {/* Category breakdown */}
            {result.complaintCount > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-foreground">
                    Complaint Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(
                    Object.entries(result.categories) as [
                      keyof CategoryCount,
                      number,
                    ][]
                  ).map(([cat, count]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="text-foreground font-medium">
                          {count}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${(count / maxCategory) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
