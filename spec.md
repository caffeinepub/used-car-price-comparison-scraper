# Auto Track Pro

## Current State
Full-stack used car intelligence platform (Motoko + React) with 28 page routes. Features include: listing management, dashboard with deal scoring, comparison charts, market overview, depreciation curve, cross-model search, regional breakdown, buyer tools (negotiation coach, should I wait, TCO timeline, trim analyzer, deal expiry), dealer tools (pricing radar, lot tracker, demand heatmap, turnover, price elasticity), dealer ratings, confidence scores, and custom alert formulas. Per-user data isolation via Internet Identity principal.

## Requested Changes (Diff)

### Add
1. **Market Saturation Indicator page** (`/market-saturation`) — for each make/model, calculate listing count vs. market average and display a saturation level (Low / Moderate / High / Oversaturated). Show negotiating leverage score. High saturation = more buyer leverage. Display as a ranked table with saturation badges and a bar chart. Include a "leverage tip" per saturation tier.
2. **Cross-Market Price Comparison page** (`/cross-market`) — compare listings for the same make/model/trim across different sources (dealer, private, auction, etc.) in a unified view. Grouped by source with avg price per source, price delta vs. cheapest source, and a sortable table of individual listings per source.
3. **Seasonal Pricing Calendar page** (`/seasonal-pricing`) — historical chart showing best months to buy each make/model. Simulate 12-month price index per make/model. Highlight cheapest and most expensive months. Include a "Best Month to Buy" badge and a line chart. Allow make/model selector.
4. **Nav entry** — add a "Market Intel" dropdown to the main nav containing all three new pages (visible to all authenticated users; also visible unauthenticated as read-only).

### Modify
- `App.tsx` — add route definitions and imports for 3 new pages; add "Market Intel" nav dropdown with TrendingUp/Globe/Calendar icons.
- Backend `main.mo` — add `getMarketSaturation`, `getCrossMarketComparison`, `getSeasonalPricingIndex` query functions that compute from per-user listings data.

### Remove
Nothing removed.

## Implementation Plan
1. Add 3 backend query functions to `main.mo`:
   - `getMarketSaturation()` — returns array of `{make, model, count, avgCount, saturationLevel, leverageScore}` computed from caller's listings
   - `getCrossMarketComparison(make, model, trim)` — returns listings grouped by source with price stats per source
   - `getSeasonalPricingIndex(make, model)` — returns 12-element array of `{month, avgPrice, relativeIndex}` derived from listing timestamps and prices
2. Regenerate `backend.d.ts` bindings
3. Create `MarketSaturationPage.tsx` — ranked table with saturation badges (Low/Moderate/High/Oversaturated), bar chart of listing counts, leverage tip per tier
4. Create `CrossMarketPage.tsx` — make/model/trim selector, source-grouped cards with avg price and delta, sortable table of matching listings
5. Create `SeasonalPricingPage.tsx` — make/model selector, 12-month line chart with cheapest/priciest month highlights, "Best Month to Buy" badge
6. Update `App.tsx` — add routes, imports, and "Market Intel" nav dropdown visible to all users
