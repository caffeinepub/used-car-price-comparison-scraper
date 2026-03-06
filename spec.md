# Auto Track Pro

## Current State
Auto Track Pro is a full-stack used car intelligence platform. The Market Intel section currently contains three tools: Market Saturation, Cross-Market Comparison, and Seasonal Pricing Calendar — accessible via the nav drawer on mobile and bottom tab bar on desktop.

Routes already registered: `/market-saturation`, `/cross-market`, `/seasonal-pricing`.

The `MARKET_INTEL_TOOLS` array in `App.tsx` lists these three tools and powers the nav drawer section. The `QuickAccessGrid` component also references these.

## Requested Changes (Diff)

### Add
- **Price Velocity Tracker** (`/market-intel/price-velocity`) — shows how fast prices are dropping or rising for a make/model over 7/14/30 days; signals if a model is in freefall or stabilizing; line chart of price velocity over time with direction badges (Falling Fast / Falling / Stable / Rising / Rising Fast)
- **Supply Shock Detector** (`/market-intel/supply-shock`) — detects when a make/model's listing volume suddenly spikes or drops relative to baseline; shows a bar chart of weekly listing counts per model with shock indicators (Spike / Drop / Normal); alerts when a market shift is detected
- **Regional Arbitrage Finder** (`/market-intel/regional-arbitrage`) — identifies models priced significantly cheaper in one region vs another; table of make/model combos with cheapest region, most expensive region, price gap, and a "Worth the Drive?" indicator based on gap size
- Three new routes in `App.tsx` for the above pages
- Add the three new tools to `MARKET_INTEL_TOOLS` array in `App.tsx` and `QuickAccessGrid`

### Modify
- `App.tsx` — register 3 new routes, add 3 items to `MARKET_INTEL_TOOLS`
- `QuickAccessGrid.tsx` — add the 3 new Market Intel tools to its market intel section

### Remove
- Nothing removed

## Implementation Plan
1. Create `PriceVelocityPage.tsx` — make/model selector, 7/14/30-day toggle, line chart of simulated price velocity data derived from listings, direction badge, summary table of top movers
2. Create `SupplyShockPage.tsx` — bar chart of weekly listing volume per model, shock threshold calculation, spike/drop/normal badge per model, alert banner for detected shocks
3. Create `RegionalArbitragePage.tsx` — table with make/model, cheapest region, most expensive region, price gap ($), gap %, "Worth Drive?" badge (Yes/Maybe/No based on gap threshold)
4. Register `/market-intel/price-velocity`, `/market-intel/supply-shock`, `/market-intel/regional-arbitrage` routes in `App.tsx`
5. Add new tools to `MARKET_INTEL_TOOLS` and `QuickAccessGrid`
6. All pages include `PageHeader` with Back to Dashboard and X close button (consistent with v93+)
