import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  TrendingDown,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// ─── Date helpers ──────────────────────────────────────────────────────────────

function getLastMonday(month: number, year: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const day = lastDay.getDay();
  const diff = day === 1 ? 0 : day === 0 ? 6 : day - 1;
  return new Date(year, month + 1, -diff);
}

function getNthWeekday(
  weekday: number,
  n: number,
  month: number,
  year: number,
): Date {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday) {
      count++;
      if (count === n) return date;
    }
  }
  return new Date(year, month, 1);
}

function getLastNthWeekday(
  weekday: number,
  n: number,
  month: number,
  year: number,
): Date {
  const dates: Date[] = [];
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday) dates.push(date);
  }
  return dates[dates.length - n] ?? dates[0];
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

interface BuyingWindow {
  label: string;
  date: Date;
  description: string;
}

function getBuyingWindows(year: number): BuyingWindow[] {
  const windows: BuyingWindow[] = [];
  for (let m = 0; m < 12; m++) {
    const days = daysInMonth(year, m);
    windows.push({
      label: `End of ${new Date(year, m).toLocaleString("default", { month: "long" })}`,
      date: new Date(year, m, days - 2),
      description:
        "Sales quotas reset — dealers are highly motivated to close deals",
    });
  }
  for (const m of [2, 5, 8, 11]) {
    const days = daysInMonth(year, m);
    windows.push({
      label: `End of Q${[2, 5, 8, 11].indexOf(m) + 1} (${new Date(year, m).toLocaleString("default", { month: "long" })})`,
      date: new Date(year, m, days - 2),
      description: "Quarterly targets create maximum dealer pressure",
    });
  }
  windows.push({
    label: "Memorial Day Weekend",
    date: getLastMonday(4, year),
    description: "Holiday incentives from manufacturers",
  });
  windows.push({
    label: "Labor Day Weekend",
    date: getNthWeekday(1, 1, 8, year),
    description: "End-of-summer clearance + holiday incentives",
  });
  windows.push({
    label: "Black Friday",
    date: getLastNthWeekday(5, 1, 10, year),
    description: "Manufacturer rebates and year-end push begin",
  });
  return windows.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getNextWindow(windows: BuyingWindow[], now: Date): BuyingWindow {
  const future = windows.filter((w) => w.date >= now);
  return future[0] ?? windows[0];
}

function msUntil(date: Date, now: Date) {
  let diff = Math.max(0, date.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * 86400000;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 3600000;
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  return { days, hours, minutes, seconds };
}

function isBestDay(date: Date, year: number, month: number): boolean {
  const dim = daysInMonth(year, month);
  return date.getDate() >= dim - 2;
}

function isGoodDay(date: Date): boolean {
  const d = date.getDay();
  return d === 1 || d === 2;
}

function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BEST_MONTHS = [
  {
    month: "January",
    rank: 1,
    reason: "New model year push — dealers clear old inventory fast",
  },
  {
    month: "December",
    rank: 2,
    reason: "Year-end quotas + holiday deals = maximum dealer motivation",
  },
  {
    month: "October",
    rank: 3,
    reason: "New models arriving, dealers discount outgoing year",
  },
  {
    month: "November",
    rank: 4,
    reason: "Slow traffic + Black Friday manufacturer incentives",
  },
];

const WHY_CARDS = [
  {
    title: "End of Month",
    icon: "📅",
    body: "Dealers have monthly sales quotas. The last 3 days, they're under pressure to hit their numbers — making them far more likely to negotiate or accept lower offers.",
  },
  {
    title: "End of Quarter",
    icon: "📊",
    body: "Even stronger than month-end. Quarterly bonuses from manufacturers kick in here. Dealers can earn significant cash by closing just a few more deals.",
  },
  {
    title: "Mondays & Tuesdays",
    icon: "📉",
    body: "The fewest customers walk into dealerships early in the week. Salespeople have more time, less competition, and more flexibility to work a deal.",
  },
  {
    title: "Holiday Weekends",
    icon: "🎉",
    body: "Manufacturers run special financing incentives during major holidays. Dealers compete hard and often supplement with their own discounts.",
  },
  {
    title: "Avoid Weekends",
    icon: "⚠️",
    body: "Saturday is the busiest day of the week. Dealers have no urgency to negotiate when traffic is high. You'll have the least leverage and patience.",
  },
];

export default function BestDayToBuyPage() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const year = now.getFullYear();
  const month = now.getMonth();
  const windows = getBuyingWindows(year);
  const nextWindow = getNextWindow(windows, now);
  const countdown = msUntil(nextWindow.date, now);

  const firstDay = new Date(year, month, 1).getDay();
  const numDays = daysInMonth(year, month);
  // Build cells: null for padding, Date for each day
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: numDays }, (_, i) => new Date(year, month, i + 1)),
  ];

  const goBack = () => navigate({ to: "/" });

  return (
    <div className="min-h-screen bg-background">
      {/* Header nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-400 transition-colors"
          data-ocid="best_day.back.button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={goBack}
          className="text-muted-foreground hover:text-amber-400 transition-colors"
          data-ocid="best_day.close.button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Calendar className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Best Day to Buy Predictor
            </h1>
            <p className="text-sm text-muted-foreground">
              Time your purchase for maximum negotiating leverage
            </p>
          </div>
        </div>

        {/* Countdown */}
        <Card
          className="border-amber-500/30 bg-card"
          data-ocid="best_day.panel"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next Best Buying Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-foreground mb-1">
              {nextWindow.label}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {nextWindow.description}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: countdown.days, label: "Days" },
                { val: countdown.hours, label: "Hours" },
                { val: countdown.minutes, label: "Min" },
                { val: countdown.seconds, label: "Sec" },
              ].map(({ val, label }) => (
                <div
                  key={label}
                  className="rounded-lg bg-amber-500/10 border border-amber-500/20 py-3 text-center"
                >
                  <p className="text-2xl font-black text-amber-400 tabular-nums">
                    {String(val).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">
              {MONTH_NAMES[month]} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                Best (last 3 days)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500/30 inline-block" />
                Good (Mon/Tue)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-muted inline-block" />
                Avoid (weekend)
              </span>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, i) => {
                if (!date) {
                  // biome-ignore lint/suspicious/noArrayIndexKey: padding cells have no stable key
                  return <div key={i} />;
                }
                const isToday = date.toDateString() === now.toDateString();
                const best = isBestDay(date, year, month);
                const good = !best && isGoodDay(date);
                const avoid = !best && isWeekend(date);
                return (
                  <div
                    key={date.getDate()}
                    className={`relative rounded-md py-2 text-center text-sm font-medium transition-colors ${
                      best
                        ? "bg-amber-500 text-black"
                        : good
                          ? "bg-amber-500/25 text-amber-300"
                          : avoid
                            ? "bg-muted text-muted-foreground"
                            : "text-foreground"
                    } ${isToday ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-background" : ""}`}
                  >
                    {date.getDate()}
                    {best && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px]">
                        ★
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Why These Days Work */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-400" />
            Why These Days Work
          </h2>
          <div className="space-y-3">
            {WHY_CARDS.map((c) => (
              <div
                key={c.title}
                className="rounded-lg border border-border bg-card px-4 py-3"
              >
                <p className="font-semibold text-foreground mb-1">
                  {c.icon} {c.title}
                </p>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Best buying months */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            Best Buying Months of the Year
          </h2>
          <div className="space-y-2">
            {BEST_MONTHS.map((m) => (
              <div
                key={m.month}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="text-2xl font-black text-amber-400 w-7 text-center">
                  #{m.rank}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{m.month}</p>
                  <p className="text-xs text-muted-foreground">{m.reason}</p>
                </div>
                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${((5 - m.rank) / 4) * 80 + 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
