import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  useGetAllListings,
  useGetMileageAdjustedListings,
  useGetDealScores,
  useGetPriceTrend,
  usePriceDropEvents,
  useGetDistinctMakes,
  useGetDistinctModels,
} from '../hooks/useQueries';
import type { PriceDropEvent } from '../hooks/useQueries';
import PriceStatisticsPanel from '../components/PriceStatisticsPanel';
import ComparisonExportFilterPanel from '../components/ComparisonExportFilterPanel';
import { TrendingUp, TrendingDown, Minus, Download, ArrowDownCircle, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import NHTSARecallSection from '../components/NHTSARecallSection';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartDataPoint {
  date: string;
  timestamp: number;
  price: number;
}

// ─── Price Drop Annotation Dot ────────────────────────────────────────────────

interface PriceDropAnnotationDotProps {
  cx?: number;
  cy?: number;
  event: PriceDropEvent;
}

function PriceDropAnnotationDot({ cx = 0, cy = 0, event }: PriceDropAnnotationDotProps) {
  const [hovered, setHovered] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <g>
      {/* Dashed vertical line */}
      <line
        x1={cx}
        y1={cy - 6}
        x2={cx}
        y2={cy + 30}
        stroke="#10b981"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      {/* Downward triangle marker */}
      <polygon
        points={`${cx},${cy + 10} ${cx - 7},${cy - 4} ${cx + 7},${cy - 4}`}
        fill="#10b981"
        opacity={hovered ? 1 : 0.85}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Tooltip on hover */}
      {hovered && (
        <foreignObject x={cx + 12} y={cy - 60} width={220} height={160} style={{ overflow: 'visible' }}>
          <div
            style={{
              background: '#1a1a2e',
              border: '1px solid #10b981',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ color: '#10b981', fontWeight: 700, marginBottom: 4 }}>📉 Price Drop</div>
            <div><span style={{ color: '#94a3b8' }}>Source:</span> {event.source}</div>
            <div><span style={{ color: '#94a3b8' }}>Year:</span> {String(event.year)}</div>
            <div><span style={{ color: '#94a3b8' }}>Trim:</span> {event.trim || '—'}</div>
            <div><span style={{ color: '#94a3b8' }}>Was:</span> {fmt(event.previousPrice)}</div>
            <div><span style={{ color: '#94a3b8' }}>Now:</span> {fmt(event.newPrice)}</div>
            <div style={{ color: '#10b981' }}>
              −{fmt(event.dropAmount)} (−{event.dropPercent.toFixed(1)}%)
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

// ─── Custom Dot renderer for price drop events ────────────────────────────────

function makePriceDropDotRenderer(events: PriceDropEvent[], chartData: ChartDataPoint[]) {
  return function PriceDropDot(props: any) {
    const { cx, cy, index } = props;
    if (cx == null || cy == null || index == null) return null;
    const point = chartData[index];
    if (!point) return null;

    const matchingEvents = events.filter((e) => {
      const evTs = Number(e.timestamp) / 1_000_000;
      return Math.abs(evTs - point.timestamp) < 86_400_000 * 3; // within 3 days
    });

    if (matchingEvents.length === 0) return null;

    return (
      <>
        {matchingEvents.map((ev, i) => (
          <PriceDropAnnotationDot key={i} cx={cx} cy={cy} event={ev} />
        ))}
      </>
    );
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ComparisonPage() {
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/shared-comparison?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: makes = [], isLoading: makesLoading } = useGetDistinctMakes();
  const { data: models = [], isLoading: modelsLoading } = useGetDistinctModels(selectedMake);
  const { data: allListings = [], isLoading: listingsLoading } = useGetAllListings();
  const { data: mileageAdjusted = [] } = useGetMileageAdjustedListings(selectedMake, selectedModel);
  const { data: priceTrend } = useGetPriceTrend(selectedMake, selectedModel);
  const { data: priceDropEvents = [], isLoading: eventsLoading } = usePriceDropEvents(selectedMake, selectedModel);

  // Filter listings for selected make/model
  const filteredListings = (allListings as any[]).filter(
    (l) => l.make === selectedMake && l.model === selectedModel && !l.archived
  );

  const listingIds = filteredListings.map((l) => l.id);
  const { data: dealScores = [] } = useGetDealScores(listingIds);

  // Build chart data from filtered listings sorted by timestamp
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    const sorted = [...filteredListings].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    return sorted.map((l) => {
      const ts = Number(l.timestamp) / 1_000_000;
      const date = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
      return {
        date,
        timestamp: ts,
        price: Number(l.price),
      };
    });
  }, [filteredListings]);

  // Build the custom dot renderer with current events and chart data
  const PriceDropDot = React.useMemo(
    () => makePriceDropDotRenderer(priceDropEvents, chartData),
    [priceDropEvents, chartData]
  );

  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMake(e.target.value);
    setSelectedModel('');
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  const trendIcon =
    priceTrend === 'up' ? (
      <TrendingUp className="w-4 h-4 text-red-400" />
    ) : priceTrend === 'down' ? (
      <TrendingDown className="w-4 h-4 text-emerald-400" />
    ) : (
      <Minus className="w-4 h-4 text-amber-400" />
    );

  const trendLabel =
    priceTrend === 'up' ? 'Trending Up' : priceTrend === 'down' ? 'Trending Down' : 'Stable';

  const isLoading = listingsLoading || makesLoading;

  // Build deal score map for PriceStatisticsPanel
  const dealScoreMap: Record<string, string> = {};
  (dealScores as any[]).forEach((d: any) => {
    dealScoreMap[d.listingId] = d.dealRating;
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-display text-amber-400">Price Comparison</h1>
              <p className="text-muted-foreground mt-1">Compare price history and market trends by make &amp; model</p>
            </div>
            {selectedMake && selectedModel && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-steel-border text-sm text-muted-foreground hover:text-foreground hover:border-amber-500/50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-steel-border text-sm text-muted-foreground hover:text-foreground hover:border-amber-500/50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            )}
          </div>

          {/* Selectors */}
          <div className="card-panel p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Make</label>
                {makesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select
                    value={selectedMake}
                    onChange={handleMakeChange}
                    className="w-full bg-surface border border-steel-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select a make…</option>
                    {makes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Model</label>
                {modelsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    disabled={!selectedMake}
                    className="w-full bg-surface border border-steel-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  >
                    <option value="">Select a model…</option>
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Chart + Stats */}
          {selectedMake && selectedModel && (
            <>
              {/* Trend badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-steel-border text-sm">
                  {trendIcon}
                  <span className="text-muted-foreground">{trendLabel}</span>
                </div>
                {priceDropEvents.length > 0 && !eventsLoading && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
                    <ArrowDownCircle className="w-4 h-4" />
                    {priceDropEvents.length} price drop{priceDropEvents.length !== 1 ? 's' : ''} detected
                  </div>
                )}
              </div>

              {/* Price History Chart */}
              <div className="card-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Price History — {selectedMake} {selectedModel}
                  </h2>
                  {priceDropEvents.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <span className="inline-block w-3 h-3 bg-emerald-500 rounded-sm opacity-80" />
                      Price drop events
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : chartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No price data available for this selection.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#e2e8f0',
                        }}
                        formatter={(value: number) =>
                          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
                        }
                      />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />

                      {/* Main price line */}
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, fill: '#f59e0b' }}
                        name="Price"
                      />

                      {/* Price drop annotation overlay line (invisible, just for dots) */}
                      {priceDropEvents.length > 0 && !eventsLoading && (
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="transparent"
                          strokeWidth={0}
                          dot={<PriceDropDot />}
                          activeDot={false}
                          name="Price Drops"
                          legendType="none"
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Price Drop Events Legend */}
              {priceDropEvents.length > 0 && !eventsLoading && (
                <div className="card-panel p-4">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4" />
                    Price Drop Events
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {priceDropEvents.map((ev, i) => {
                      const ts = Number(ev.timestamp) / 1_000_000;
                      const date = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const fmt = (n: number) =>
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
                      return (
                        <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-semibold">{date}</span>
                            <span className="text-emerald-300 font-bold">−{ev.dropPercent.toFixed(1)}%</span>
                          </div>
                          <div className="text-muted-foreground">
                            {ev.source} · {String(ev.year)} {ev.trim || ''}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground">{fmt(ev.previousPrice)}</span>
                            <span className="text-emerald-400 font-semibold">{fmt(ev.newPrice)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Statistics Panel */}
              <PriceStatisticsPanel
                listings={filteredListings}
                make={selectedMake}
                model={selectedModel}
                dealScores={dealScoreMap}
              />

              {/* Mileage Adjusted Table */}
              {(mileageAdjusted as any[]).length > 0 && (
                <div className="card-panel p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Mileage-Adjusted Listings</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-steel-border text-muted-foreground">
                          <th className="text-left py-2 pr-4">Year</th>
                          <th className="text-left py-2 pr-4">Trim</th>
                          <th className="text-left py-2 pr-4">Mileage</th>
                          <th className="text-left py-2 pr-4">Price</th>
                          <th className="text-left py-2 pr-4">$/Mile</th>
                          <th className="text-left py-2 pr-4">Source</th>
                          <th className="text-left py-2">Dealer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(mileageAdjusted as any[]).map((l: any, i: number) => (
                          <tr key={i} className="border-b border-steel-border/40 hover:bg-surface/50 transition-colors">
                            <td className="py-2 pr-4">{String(l.year)}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{l.trim || '—'}</td>
                            <td className="py-2 pr-4">{Number(l.mileage).toLocaleString()}</td>
                            <td className="py-2 pr-4 text-amber-400 font-medium">
                              ${Number(l.price).toLocaleString()}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              {l.pricePerMile != null ? `$${Number(l.pricePerMile).toFixed(4)}` : '—'}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">{l.source || '—'}</td>
                            <td className="py-2 text-muted-foreground">{l.dealerName || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* NHTSA Recalls & Safety */}
              <NHTSARecallSection
                make={selectedMake}
                model={selectedModel}
                latestYear={
                  filteredListings.length > 0
                    ? Math.max(...filteredListings.map((l) => Number(l.year)))
                    : undefined
                }
              />
            </>
          )}

          {/* Empty state when no selection */}
          {(!selectedMake || !selectedModel) && (
            <div className="card-panel p-12 text-center">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a Make &amp; Model</h3>
              <p className="text-muted-foreground text-sm">
                Choose a make and model above to view price history, trends, and market analysis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Export Panel — no listings prop, component manages its own data */}
      {showExportPanel && (
        <ComparisonExportFilterPanel
          make={selectedMake}
          model={selectedModel}
          onClose={() => setShowExportPanel(false)}
        />
      )}
    </TooltipProvider>
  );
}
