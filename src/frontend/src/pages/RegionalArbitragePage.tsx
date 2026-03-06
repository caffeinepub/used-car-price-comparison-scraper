import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorthDrive = "yes" | "maybe" | "no";

interface ArbitrageEntry {
  make: string;
  model: string;
  cheapestRegion: string;
  cheapestAvgPrice: number;
  expensiveRegion: string;
  expensiveAvgPrice: number;
  priceGap: number;
  gapPct: number;
  worthDrive: WorthDrive;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getWorthDrive(gap: number): WorthDrive {
  if (gap >= 3000) return "yes";
  if (gap >= 1500) return "maybe";
  return "no";
}

function WorthDriveBadge({ verdict }: { verdict: WorthDrive }) {
  const config = {
    yes: {
      label: "Yes",
      className:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    },
    maybe: {
      label: "Maybe",
      className: "bg-amber/15 text-amber border-amber/30",
    },
    no: {
      label: "No",
      className:
        "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
    },
  };
  const c = config[verdict];
  return (
    <Badge
      variant="outline"
      className={`text-xs font-bold px-2.5 py-0.5 ${c.className}`}
    >
      {c.label}
    </Badge>
  );
}

// ─── Simulated Data ───────────────────────────────────────────────────────────

const REGIONS = [
  "Northeast",
  "Southeast",
  "Midwest",
  "Southwest",
  "Northwest",
  "South",
  "Mountain West",
];

const RAW_ARBITRAGE: Omit<
  ArbitrageEntry,
  "priceGap" | "gapPct" | "worthDrive"
>[] = [
  {
    make: "Toyota",
    model: "Camry",
    cheapestRegion: "Midwest",
    cheapestAvgPrice: 21400,
    expensiveRegion: "Northeast",
    expensiveAvgPrice: 25900,
  },
  {
    make: "Ford",
    model: "F-150",
    cheapestRegion: "Mountain West",
    cheapestAvgPrice: 34200,
    expensiveRegion: "Northeast",
    expensiveAvgPrice: 41800,
  },
  {
    make: "Honda",
    model: "CR-V",
    cheapestRegion: "South",
    cheapestAvgPrice: 25700,
    expensiveRegion: "Northwest",
    expensiveAvgPrice: 30200,
  },
  {
    make: "Chevrolet",
    model: "Silverado",
    cheapestRegion: "Southwest",
    cheapestAvgPrice: 36800,
    expensiveRegion: "Northeast",
    expensiveAvgPrice: 44300,
  },
  {
    make: "Toyota",
    model: "RAV4",
    cheapestRegion: "Southeast",
    cheapestAvgPrice: 27600,
    expensiveRegion: "Northwest",
    expensiveAvgPrice: 33100,
  },
  {
    make: "Honda",
    model: "Civic",
    cheapestRegion: "Midwest",
    cheapestAvgPrice: 16800,
    expensiveRegion: "Northeast",
    expensiveAvgPrice: 21200,
  },
  {
    make: "BMW",
    model: "3 Series",
    cheapestRegion: "South",
    cheapestAvgPrice: 28900,
    expensiveRegion: "Northeast",
    expensiveAvgPrice: 38400,
  },
  {
    make: "Jeep",
    model: "Wrangler",
    cheapestRegion: "Southwest",
    cheapestAvgPrice: 31200,
    expensiveRegion: "Northeast",
    expensiveAvgPrice: 39600,
  },
  {
    make: "Tesla",
    model: "Model 3",
    cheapestRegion: "Mountain West",
    cheapestAvgPrice: 26100,
    expensiveRegion: "Northeast",
    expensiveAvgPrice: 32400,
  },
  {
    make: "Hyundai",
    model: "Tucson",
    cheapestRegion: "Midwest",
    cheapestAvgPrice: 22300,
    expensiveRegion: "Northwest",
    expensiveAvgPrice: 26800,
  },
  {
    make: "Ram",
    model: "1500",
    cheapestRegion: "South",
    cheapestAvgPrice: 33600,
    expensiveRegion: "Northeast",
    expensiveAvgPrice: 42100,
  },
  {
    make: "Mazda",
    model: "CX-5",
    cheapestRegion: "Southeast",
    cheapestAvgPrice: 23800,
    expensiveRegion: "Northwest",
    expensiveAvgPrice: 28600,
  },
];

const ARBITRAGE_DATA: ArbitrageEntry[] = RAW_ARBITRAGE.map((r) => {
  const gap = r.expensiveAvgPrice - r.cheapestAvgPrice;
  const gapPct = (gap / r.cheapestAvgPrice) * 100;
  return {
    ...r,
    priceGap: gap,
    gapPct,
    worthDrive: getWorthDrive(gap),
  };
}).sort((a, b) => b.priceGap - a.priceGap);

// ─── Stats ────────────────────────────────────────────────────────────────────

const worthDriveCount = ARBITRAGE_DATA.filter(
  (e) => e.worthDrive === "yes",
).length;
const avgGap =
  ARBITRAGE_DATA.reduce((sum, e) => sum + e.priceGap, 0) /
  ARBITRAGE_DATA.length;
const maxGap = Math.max(...ARBITRAGE_DATA.map((e) => e.priceGap));

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RegionalArbitragePage() {
  const [minGap, setMinGap] = useState(500);

  const filtered = useMemo(
    () => ARBITRAGE_DATA.filter((e) => e.priceGap >= minGap),
    [minGap],
  );

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 py-8 space-y-8"
      data-ocid="regional_arbitrage.page"
    >
      <PageHeader
        title="Regional Arbitrage Finder"
        description="Find the same car priced significantly cheaper in another region — worth the drive to save thousands."
        icon={<MapPin className="w-6 h-6" />}
      />

      {/* Concept intro */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber/5 border border-amber/20">
        <MapPin className="w-5 h-5 text-amber shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">
            What is Regional Arbitrage?
          </p>
          <p>
            The same make/model can vary by <strong>$3,000–$9,000+</strong>{" "}
            depending on which U.S. region you buy in. Northeast cities
            consistently list vehicles higher than the Midwest or South. This
            tool identifies the biggest gaps so you can decide if a road trip —
            or out-of-state purchase — makes financial sense.
          </p>
          <p>
            Regions compared:{" "}
            <span className="text-foreground">{REGIONS.join(", ")}</span>.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {worthDriveCount}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Worth the Drive
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber/5 border-amber/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display text-amber">
              {fmtCurrency(avgGap)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Avg Gap</div>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold font-display text-foreground">
              {fmtCurrency(maxGap)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Biggest Gap
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="bg-surface border-steel-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Filter by Minimum Price Gap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Min gap:{" "}
                <span className="font-bold text-foreground">
                  {fmtCurrency(minGap)}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {filtered.length}
                </span>{" "}
                of {ARBITRAGE_DATA.length} models
              </span>
            </div>
            <Slider
              min={500}
              max={5000}
              step={250}
              value={[minGap]}
              onValueChange={([v]) => setMinGap(v)}
              data-ocid="regional_arbitrage.gap_filter.select"
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>$500</span>
              <span>$1,500</span>
              <span>$2,500</span>
              <span>$3,500</span>
              <span>$5,000+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arbitrage Table */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground text-sm"
          data-ocid="regional_arbitrage.empty_state"
        >
          No models meet the current gap threshold. Try lowering the minimum.
        </div>
      ) : (
        <Card className="bg-surface border-steel-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
              Regional Price Gaps — Sorted by Savings
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              "Worth Drive?" = savings ≥ $3,000 (green), ≥ $1,500 (amber), &lt;
              $1,500 (gray)
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table data-ocid="regional_arbitrage.table">
                <TableHeader>
                  <TableRow className="border-steel-border hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      Make / Model
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      Cheapest Region
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right whitespace-nowrap">
                      Cheapest Avg
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      Priciest Region
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right whitespace-nowrap">
                      Priciest Avg
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right whitespace-nowrap">
                      Gap ($)
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right whitespace-nowrap">
                      Gap (%)
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      Worth Drive?
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry, i) => (
                    <TableRow
                      key={`${entry.make}-${entry.model}`}
                      data-ocid={`regional_arbitrage.row.${i + 1}`}
                      className="border-steel-border hover:bg-amber/3 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground py-3 whitespace-nowrap">
                        {entry.make} {entry.model}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                            {entry.cheapestRegion}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {fmtCurrency(entry.cheapestAvgPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                            {entry.expensiveRegion}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                        {fmtCurrency(entry.expensiveAvgPrice)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground whitespace-nowrap">
                        {fmtCurrency(entry.priceGap)}
                      </TableCell>
                      <TableCell className="text-right text-amber font-bold whitespace-nowrap">
                        +{entry.gapPct.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <WorthDriveBadge verdict={entry.worthDrive} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-surface border-steel-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Why Prices Differ by Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">
                Northeast & Northwest:
              </strong>{" "}
              Dense urban markets, higher cost of living, and import-focused
              inventory push prices up significantly.
            </p>
            <p>
              <strong className="text-foreground">Midwest & South:</strong>{" "}
              Lower operating costs for dealers, higher truck/SUV volume, and
              more competitive private seller market keep prices lower.
            </p>
            <p>
              <strong className="text-foreground">Mountain West:</strong> Strong
              truck demand locally but lower overall population density means
              less competition and better deals on passenger cars.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-steel-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              How to Act on This Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Gap ≥ $3,000:</strong> Strong
              case to drive or fly. One-way flights often cost $150–400, making
              $3,000+ gaps profitable even after travel costs.
            </p>
            <p>
              <strong className="text-foreground">Check shipping costs:</strong>{" "}
              Auto transport is typically $800–1,800 coast-to-coast. Add this to
              your calculation before committing.
            </p>
            <p>
              <strong className="text-foreground">Use local leverage:</strong>{" "}
              Show a dealer in your city the regional data — many will match or
              beat a distant competitor rather than lose the sale.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
