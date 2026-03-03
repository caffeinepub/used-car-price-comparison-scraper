import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ClipboardCopy,
  MessageSquare,
  RefreshCw,
  Shield,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGetNegotiationScore } from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLocalScore(
  daysListed: number,
  priceDropPct: number,
): {
  label: "Strong" | "Good" | "Fair" | "Weak";
  score: number;
  discountRoom: number;
} {
  let baseRoom = 0;
  let score = 0;
  if (daysListed >= 60) {
    baseRoom = 11;
    score = 90;
  } else if (daysListed >= 31) {
    baseRoom = 6;
    score = 70;
  } else if (daysListed >= 15) {
    baseRoom = 4;
    score = 50;
  } else {
    baseRoom = 1.5;
    score = 25;
  }

  let extra = 0;
  if (priceDropPct >= 10) extra = 6;
  else if (priceDropPct >= 5) extra = 4;
  else if (priceDropPct >= 1) extra = 2;

  const discountRoom = baseRoom + extra;
  const finalScore = Math.min(score + (extra / 6) * 20, 99);

  let label: "Strong" | "Good" | "Fair" | "Weak" = "Weak";
  if (finalScore >= 80) label = "Strong";
  else if (finalScore >= 60) label = "Good";
  else if (finalScore >= 40) label = "Fair";

  return { label, score: Math.round(finalScore), discountRoom };
}

function scoreLabelColor(label: string) {
  if (label === "Strong")
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  if (label === "Good") return "bg-amber/15 text-amber border-amber/30";
  if (label === "Fair")
    return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
  return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Script Step Card ─────────────────────────────────────────────────────────

interface StepCardProps {
  step: number;
  title: string;
  icon: React.ElementType;
  script: string;
  tip: string;
  ocidBase: string;
}

function ScriptStepCard({
  step,
  title,
  icon: Icon,
  script,
  tip,
  ocidBase,
}: StepCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast.success("Script copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — please copy manually.");
    }
  };

  return (
    <Card className="bg-surface border-steel-border relative overflow-hidden">
      {/* Step accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber rounded-l-xl" />
      <CardHeader className="pb-3 pl-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center shrink-0">
              <span className="text-amber font-bold text-xs font-display">
                {step}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-amber" />
              <CardTitle className="text-sm font-bold text-foreground font-display uppercase tracking-wider">
                {title}
              </CardTitle>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            data-ocid={`${ocidBase}.button`}
            className="h-7 px-2.5 text-xs border-steel-border hover:border-amber/40 hover:text-amber text-muted-foreground gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <ClipboardCopy className="w-3 h-3" /> Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pl-6 space-y-3">
        <blockquote className="bg-background border border-steel-border rounded-lg p-3 text-sm text-foreground italic leading-relaxed">
          "{script}"
        </blockquote>
        <p className="text-xs text-muted-foreground flex gap-1.5 items-start">
          <AlertTriangle className="w-3.5 h-3.5 text-amber shrink-0 mt-0.5" />
          {tip}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NegotiationCoachPage() {
  const [listingId, setListingId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [daysListed, setDaysListed] = useState(30);
  const [priceDropPct, setPriceDropPct] = useState(5);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [currentPrice, setCurrentPrice] = useState(25000);

  const { data: backendScore, isLoading: scoreLoading } =
    useGetNegotiationScore(submittedId, !!submittedId);

  const localScore = computeLocalScore(daysListed, priceDropPct);

  // Derive the active score — backend wins if available
  const activeLabel = backendScore?.scoreLabel ?? localScore.label;
  const activeScore = backendScore
    ? Number(backendScore.score)
    : localScore.score;
  const activeFactors: string[] = backendScore?.factors ?? [];
  const discountRoom = localScore.discountRoom;

  const suggestedOffer =
    Math.round((currentPrice * (1 - discountRoom / 100)) / 100) * 100;
  const walkAwayPrice =
    Math.round((currentPrice * (1 - (discountRoom * 0.6) / 100)) / 100) * 100;

  const vehicleName = [make, model].filter(Boolean).join(" ") || "this vehicle";

  const steps = [
    {
      step: 1,
      title: "Opening Offer",
      icon: MessageSquare,
      script: `"I've been looking at the market, and I see this ${vehicleName} has been listed for about ${daysListed} day${daysListed !== 1 ? "s" : ""}. Based on comparable listings, I'd like to start at ${fmtCurrency(suggestedOffer)}. That reflects the time it's been available and current market conditions."`,
      tip: `Your opening offer of ${fmtCurrency(suggestedOffer)} gives you ~${discountRoom.toFixed(0)}% discount room. Stay calm and let silence work in your favor after you make the offer.`,
      ocidBase: "negotiation.step1.copy",
    },
    {
      step: 2,
      title: "Counter Strategy",
      icon: TrendingDown,
      script: `"I understand you need to make margin on this deal, and I respect that. But the data shows similar ${vehicleName} models are moving at lower prices right now. Could you meet me at ${fmtCurrency(Math.round((suggestedOffer + currentPrice) / 2 / 100) * 100)}? I'm ready to sign today if we can get close."`,
      tip: "If they counter at asking price, don't panic. Say 'I appreciate that, let me think on it' — then re-offer halfway between your number and theirs.",
      ocidBase: "negotiation.step2.copy",
    },
    {
      step: 3,
      title: "Walkaway Point",
      icon: Shield,
      script: `"I've enjoyed working with you and I really like this car. My absolute ceiling is ${fmtCurrency(walkAwayPrice)} — that's where the numbers work for me. If that's not feasible, I'll need to look at other options I have lined up. What can you do to make this work?"`,
      tip: `If they can't hit ${fmtCurrency(walkAwayPrice)}, be prepared to walk. This is the most powerful tactic — many deals close when the buyer stands up to leave.`,
      ocidBase: "negotiation.step3.copy",
    },
    {
      step: 4,
      title: "Closing Phrases",
      icon: Zap,
      script: `"Let's make this happen today. I have financing pre-approved and I'm ready to take delivery. If you can confirm ${fmtCurrency(suggestedOffer)}, I'll sign the paperwork right now — no back and forth, no waiting. What do you say?"`,
      tip: "Urgency phrases like 'ready today' and 'sign now' give the dealer a reason to move. They'd rather close now than risk you leaving and not returning.",
      ocidBase: "negotiation.step4.copy",
    },
  ];

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (listingId.trim()) setSubmittedId(listingId.trim());
  };

  const handleReset = () => {
    setListingId("");
    setSubmittedId("");
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber/10 border border-amber/20 shrink-0">
          <MessageSquare className="w-6 h-6 text-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-foreground uppercase">
            Negotiation Coach
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step-by-step scripts tailored to your leverage level — based on how
            long the car's been listed and how much the price has dropped.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Listing ID Lookup */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Listing Lookup (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="listing-id"
                    className="text-xs text-muted-foreground"
                  >
                    Listing ID
                  </label>
                  <input
                    id="listing-id"
                    type="text"
                    value={listingId}
                    onChange={(e) => setListingId(e.target.value)}
                    placeholder="e.g. listing-001"
                    data-ocid="negotiation.input"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!listingId.trim() || scoreLoading}
                    data-ocid="negotiation.primary_button"
                    className="flex-1 bg-amber hover:bg-amber/90 text-zinc-900 font-bold text-xs"
                  >
                    {scoreLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                        Loading…
                      </>
                    ) : (
                      <>Look Up</>
                    )}
                  </Button>
                  {submittedId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleReset}
                      data-ocid="negotiation.secondary_button"
                      className="px-2.5 border-steel-border hover:border-amber/40"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {submittedId && backendScore === null && !scoreLoading && (
                  <p
                    className="text-xs text-muted-foreground bg-background border border-steel-border rounded-lg p-2"
                    data-ocid="negotiation.error_state"
                  >
                    No score data for this listing ID. Using your manual inputs
                    below.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Manual Inputs */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Manual Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Make/Model */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="neg-make"
                    className="text-xs text-muted-foreground"
                  >
                    Make
                  </label>
                  <input
                    id="neg-make"
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Toyota"
                    data-ocid="negotiation.make.input"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="neg-model"
                    className="text-xs text-muted-foreground"
                  >
                    Model
                  </label>
                  <input
                    id="neg-model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Camry"
                    data-ocid="negotiation.model.input"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>
              </div>

              {/* Current Price */}
              <div className="space-y-1.5">
                <label
                  htmlFor="neg-price"
                  className="text-xs text-muted-foreground"
                >
                  Asking Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    id="neg-price"
                    type="number"
                    value={currentPrice}
                    onChange={(e) =>
                      setCurrentPrice(Math.max(1000, Number(e.target.value)))
                    }
                    min={1000}
                    max={500000}
                    data-ocid="negotiation.price.input"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-background border border-steel-border text-foreground text-sm focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>
              </div>

              {/* Days Listed Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Days Listed
                  </span>
                  <span className="text-xs font-bold text-foreground font-display">
                    {daysListed} days
                  </span>
                </div>
                <Slider
                  value={[daysListed]}
                  onValueChange={([v]) => setDaysListed(v)}
                  min={0}
                  max={365}
                  step={1}
                  aria-label="Days listed"
                  data-ocid="negotiation.days.toggle"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>365</span>
                </div>
              </div>

              {/* Price Drop Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Price Drop
                  </span>
                  <span className="text-xs font-bold text-foreground font-display">
                    {priceDropPct}%
                  </span>
                </div>
                <Slider
                  value={[priceDropPct]}
                  onValueChange={([v]) => setPriceDropPct(v)}
                  min={0}
                  max={50}
                  step={0.5}
                  aria-label="Price drop percentage"
                  data-ocid="negotiation.price_drop.toggle"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Score + Scripts ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Leverage Score Banner */}
          <Card
            className={`border ${scoreLabelColor(activeLabel)} bg-transparent`}
            data-ocid="negotiation.card"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg
                      viewBox="0 0 36 36"
                      className="w-full h-full -rotate-90"
                      aria-hidden="true"
                      role="presentation"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity="0.15"
                        strokeWidth="3.8"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        strokeWidth="3.8"
                        strokeDasharray={`${activeScore} 100`}
                        strokeLinecap="round"
                        className="text-amber"
                        stroke="currentColor"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-display text-foreground">
                      {activeScore}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Leverage Score
                    </div>
                    <Badge
                      className={`${scoreLabelColor(activeLabel)} border text-sm font-bold px-3 py-1`}
                    >
                      {activeLabel} Leverage
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-xs text-muted-foreground">
                    Suggested Opening Offer
                  </div>
                  <div className="text-2xl font-bold text-amber font-display">
                    {fmtCurrency(suggestedOffer)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ~{discountRoom.toFixed(0)}% below asking
                  </div>
                </div>
              </div>

              {/* Factors */}
              {activeFactors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-1">
                  {activeFactors.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <ChevronRight className="w-3 h-3 text-amber shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leverage Tiers Reference */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              {
                label: "Weak",
                range: "0–14 days",
                color: "text-red-500 dark:text-red-400",
                bg: "bg-red-500/10 border-red-500/20",
              },
              {
                label: "Fair",
                range: "15–30 days",
                color: "text-orange-500 dark:text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                label: "Good",
                range: "31–60 days",
                color: "text-amber",
                bg: "bg-amber/10 border-amber/20",
              },
              {
                label: "Strong",
                range: "60+ days",
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
            ].map((tier) => (
              <div
                key={tier.label}
                className={`rounded-lg border ${tier.bg} px-2 py-2 text-center`}
              >
                <div className={`font-bold font-display ${tier.color}`}>
                  {tier.label}
                </div>
                <div className="text-muted-foreground">{tier.range}</div>
              </div>
            ))}
          </div>

          {/* Script Steps */}
          <div className="space-y-4">
            {steps.map((s) => (
              <ScriptStepCard key={s.step} {...s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
