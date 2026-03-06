import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Calendar, Clock, Tag, Target, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { useState } from "react";
import PageHeader from "../components/PageHeader";

// ─── Scoring Logic ─────────────────────────────────────────────────────────────

function computeMotivationScore(
  daysListed: number,
  dropCount: number,
  dropPct: number,
  daysUntilEOM: number,
): {
  total: number;
  daysFactor: number;
  dropCountFactor: number;
  dropPctFactor: number;
  monthEndFactor: number;
} {
  // Days Factor (0–25)
  let daysFactor = 0;
  if (daysListed >= 60) daysFactor = 25;
  else if (daysListed >= 45) daysFactor = 18;
  else if (daysListed >= 30) daysFactor = 15;
  else if (daysListed >= 15) daysFactor = 10;
  else daysFactor = 5;

  // Drop Count Factor (0–25)
  let dropCountFactor = 0;
  if (dropCount >= 4) dropCountFactor = 25;
  else if (dropCount === 3) dropCountFactor = 20;
  else if (dropCount === 2) dropCountFactor = 14;
  else if (dropCount === 1) dropCountFactor = 8;
  else dropCountFactor = 0;

  // Drop % Factor (0–25)
  let dropPctFactor = 0;
  if (dropPct >= 15) dropPctFactor = 25;
  else if (dropPct >= 10) dropPctFactor = 20;
  else if (dropPct >= 6) dropPctFactor = 14;
  else if (dropPct >= 3) dropPctFactor = 8;
  else dropPctFactor = 3;

  // Month-End Pressure Factor (0–25): lower daysUntilEOM = more pressure
  let monthEndFactor = 0;
  if (daysUntilEOM <= 3) monthEndFactor = 25;
  else if (daysUntilEOM <= 7) monthEndFactor = 18;
  else if (daysUntilEOM <= 14) monthEndFactor = 10;
  else monthEndFactor = 3;

  const total = daysFactor + dropCountFactor + dropPctFactor + monthEndFactor;

  return { total, daysFactor, dropCountFactor, dropPctFactor, monthEndFactor };
}

function getTier(score: number): {
  label: "Low" | "Moderate" | "High" | "Very High";
  color: string;
  bg: string;
  border: string;
  ring: string;
  tip: string;
} {
  if (score >= 76) {
    return {
      label: "Very High",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/40",
      ring: "text-red-400",
      tip: "This dealer needs to move this car — open 8% below asking. They'll likely accept or counter within 3%. Be direct and ready to sign today.",
    };
  }
  if (score >= 51) {
    return {
      label: "High",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/40",
      ring: "text-orange-400",
      tip: "Strong motivation signals. Open 5–6% below asking and use 'ready to sign today' language. Counter once, then hold firm — they'll likely move.",
    };
  }
  if (score >= 26) {
    return {
      label: "Moderate",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/40",
      ring: "text-amber-400",
      tip: "Some room to negotiate. Start 3–4% below asking and focus on non-price concessions (warranty, free oil changes). Don't expect a big discount.",
    };
  }
  return {
    label: "Low",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    ring: "text-zinc-400",
    tip: "Limited motivation — this listing is fresh and the dealer has options. Don't lowball. Be polite, ask about minor perks, and revisit in 2–3 weeks.",
  };
}

// ─── Factor Card ───────────────────────────────────────────────────────────────

function FactorCard({
  icon: Icon,
  label,
  score,
  maxScore,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  maxScore: number;
  detail: string;
}) {
  const pct = (score / maxScore) * 100;
  const barColor =
    pct >= 80
      ? "bg-red-400"
      : pct >= 60
        ? "bg-orange-400"
        : pct >= 40
          ? "bg-amber-400"
          : "bg-zinc-400";

  return (
    <Card className="bg-surface border-steel-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-amber" />
            </div>
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
              {label}
            </span>
          </div>
          <span className="text-sm font-bold font-display text-foreground">
            {score}
            <span className="text-muted-foreground text-xs font-normal">
              /{maxScore}
            </span>
          </span>
        </div>
        <div className="w-full h-1.5 bg-steel-border rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({
  score,
  tierColor,
}: {
  score: number;
  tierColor: string;
}) {
  const circumference = 2 * Math.PI * 36;
  const dash = (score / 100) * circumference;
  const gap = circumference - dash;

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full -rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="8"
          className="text-foreground"
        />
        {/* Progress */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          className={tierColor}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold font-display ${tierColor}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground font-medium">/100</span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DealerMotivationPage() {
  const [daysListed, setDaysListed] = useState(30);
  const [dropCount, setDropCount] = useState(1);
  const [dropPct, setDropPct] = useState(5);
  const [daysUntilEOM, setDaysUntilEOM] = useState(15);

  const scores = useMemo(
    () => computeMotivationScore(daysListed, dropCount, dropPct, daysUntilEOM),
    [daysListed, dropCount, dropPct, daysUntilEOM],
  );

  const tier = getTier(scores.total);

  const factors = [
    {
      icon: Clock,
      label: "Days on Lot",
      score: scores.daysFactor,
      maxScore: 25,
      detail:
        daysListed >= 60
          ? "Car has been sitting 60+ days — strong pressure to clear lot"
          : daysListed >= 30
            ? "Listed 30+ days — dealer is starting to feel urgency"
            : "Fresh listing — dealer still expects full asking price",
    },
    {
      icon: Tag,
      label: "Price Drop Count",
      score: scores.dropCountFactor,
      maxScore: 25,
      detail:
        dropCount === 0
          ? "No price drops — dealer confident in current price"
          : dropCount >= 3
            ? `${dropCount} price drops signal repeated failure to sell at target`
            : `${dropCount} price drop${dropCount > 1 ? "s" : ""} indicate some motivation to sell`,
    },
    {
      icon: TrendingDown,
      label: "Total Price Drop %",
      score: scores.dropPctFactor,
      maxScore: 25,
      detail:
        dropPct >= 10
          ? `${dropPct}% total drop is significant — dealer is very motivated`
          : dropPct >= 5
            ? `${dropPct}% reduction shows real willingness to negotiate`
            : `${dropPct}% drop is minor — limited negotiation room so far`,
    },
    {
      icon: Calendar,
      label: "Month-End Pressure",
      score: scores.monthEndFactor,
      maxScore: 25,
      detail:
        daysUntilEOM <= 3
          ? "End of month in ≤3 days — dealer facing quota pressure RIGHT NOW"
          : daysUntilEOM <= 7
            ? "End of month approaching — dealer incentivized to close deals"
            : daysUntilEOM <= 14
              ? "Two weeks until month end — moderate pressure building"
              : "Plenty of time left in month — no immediate quota pressure",
    },
  ];

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="Dealer Motivation Score"
        description="Estimate how motivated a dealer is to sell based on listing age, price drops, and month-end timing."
        icon={<Target className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Listing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Days Listed */}
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
                  max={120}
                  step={1}
                  aria-label="Days listed"
                  data-ocid="dealer_motivation.days_listed.toggle"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>120</span>
                </div>
              </div>

              {/* Number of Price Drops */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Price Drops
                  </span>
                  <span className="text-xs font-bold text-foreground font-display">
                    {dropCount} drop{dropCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <Slider
                  value={[dropCount]}
                  onValueChange={([v]) => setDropCount(v)}
                  min={0}
                  max={10}
                  step={1}
                  aria-label="Number of price drops"
                  data-ocid="dealer_motivation.drop_count.toggle"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              {/* Total Price Drop % */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Total Price Drop %
                  </span>
                  <span className="text-xs font-bold text-foreground font-display">
                    {dropPct}%
                  </span>
                </div>
                <Slider
                  value={[dropPct]}
                  onValueChange={([v]) => setDropPct(v)}
                  min={0}
                  max={30}
                  step={0.5}
                  aria-label="Total price drop percentage"
                  data-ocid="dealer_motivation.drop_pct.toggle"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>30%</span>
                </div>
              </div>

              {/* Days Until End of Month */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Days Until End of Month
                  </span>
                  <span className="text-xs font-bold text-foreground font-display">
                    {daysUntilEOM === 0 ? "Today!" : `${daysUntilEOM} days`}
                  </span>
                </div>
                <Slider
                  value={[daysUntilEOM]}
                  onValueChange={([v]) => setDaysUntilEOM(v)}
                  min={0}
                  max={31}
                  step={1}
                  aria-label="Days until end of month"
                  data-ocid="dealer_motivation.eom.toggle"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>End of month</span>
                  <span>31 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Reference */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Motivation Tiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: "Low",
                  range: "0–25",
                  color: "text-zinc-400",
                  bg: "bg-zinc-500/10 border-zinc-500/20",
                },
                {
                  label: "Moderate",
                  range: "26–50",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-500/20",
                },
                {
                  label: "High",
                  range: "51–75",
                  color: "text-orange-400",
                  bg: "bg-orange-500/10 border-orange-500/20",
                },
                {
                  label: "Very High",
                  range: "76–100",
                  color: "text-red-400",
                  bg: "bg-red-500/10 border-red-500/20",
                },
              ].map((t) => (
                <div
                  key={t.label}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border ${t.bg}`}
                >
                  <span className={`text-xs font-bold ${t.color}`}>
                    {t.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.range}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Score + Factors ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Score Banner */}
          <Card
            className={`border-2 ${tier.bg} ${tier.border}`}
            data-ocid="dealer_motivation.card"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-6 flex-wrap">
                <ScoreRing score={scores.total} tierColor={tier.ring} />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Dealer Motivation Score
                  </div>
                  <Badge
                    className={`${tier.bg} ${tier.border} ${tier.color} border text-base font-bold px-4 py-1.5`}
                  >
                    {tier.label} Motivation
                  </Badge>
                  <p className="text-sm text-foreground leading-relaxed mt-2">
                    {tier.tip}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Factor Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Score Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {factors.map((f) => (
                <FactorCard key={f.label} {...f} />
              ))}
            </div>
          </div>

          {/* Negotiation Summary */}
          <Card className="bg-surface border-steel-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What This Means for You
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Opening Move",
                    value:
                      scores.total >= 76
                        ? "Open 8% below asking"
                        : scores.total >= 51
                          ? "Open 5–6% below asking"
                          : scores.total >= 26
                            ? "Open 3–4% below asking"
                            : "Open 1–2% below asking",
                    icon: "💬",
                  },
                  {
                    label: "Counter Strategy",
                    value:
                      scores.total >= 76
                        ? "Hold firm — they're desperate"
                        : scores.total >= 51
                          ? "Counter once, then hold"
                          : scores.total >= 26
                            ? "Be flexible, trade on perks"
                            : "Focus on non-price terms",
                    icon: "🔄",
                  },
                  {
                    label: "Walk-Away Point",
                    value:
                      scores.total >= 76
                        ? "Within 3% of opening"
                        : scores.total >= 51
                          ? "Within 4–5% of asking"
                          : scores.total >= 26
                            ? "Within 2–3% of asking"
                            : "Near asking price",
                    icon: "🚪",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-background border border-steel-border rounded-lg p-3 text-center"
                  >
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {item.label}
                    </div>
                    <div className="text-xs font-semibold text-foreground leading-snug">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
