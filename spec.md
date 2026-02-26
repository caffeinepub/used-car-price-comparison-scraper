# Auto Track Pro

## Current State
The app is a full-featured used car price comparison and tracking dashboard with: listings management, CSV import/export, deal scoring, depreciation curves, cross-model search, market overview, watchlists, price alerts, saved searches, activity log, ownership cost calculator, duplicate merge, shared comparison reports, NHTSA recall/safety lookup, and VIN auto-fill.

The backend (`main.mo`) already defines `getRegionalBreakdown()` which returns `[RegionalBreakdown]` — an array of `{ region, listingCount, avgPrice, sources }`. The `backend.d.ts` type bindings are also already correct. The backend work is complete.

What is missing: a dedicated **Regional Sourcing Breakdown** frontend page that calls `getRegionalBreakdown()` and displays a geographic breakdown of listings by dealer state/region.

## Requested Changes (Diff)

### Add
- `src/frontend/src/pages/RegionalBreakdownPage.tsx` — new page that:
  - Calls `getRegionalBreakdown()` from the backend
  - Displays a summary stat row: total regions, total listings, avg price across all regions
  - Shows a ranked table/card list of regions sorted by listing count (descending)
  - Each region card/row shows: region name, listing count, average price, sources (as badges)
  - Includes a bar chart visualization showing listing count per region
  - Shows an empty state if no listings have a region set, with guidance to add listings with a state/region field
- Route `/regional` added to `App.tsx`
- Nav item "Regions" with a Map/Globe icon added to `NAV_ITEMS` in `App.tsx`

### Modify
- `App.tsx` — import `RegionalBreakdownPage`, add route `/regional`, add nav item with `MapPin` or `Globe` icon

### Remove
- Nothing removed

## Implementation Plan
1. Create `RegionalBreakdownPage.tsx` with:
   - `useQuery` to call `actor.getRegionalBreakdown()`
   - Summary stat cards (regions count, total listings, overall avg price)
   - A horizontal bar chart using inline SVG or simple CSS bars (no external chart lib needed)
   - A ranked table with region, count, avg price, source badges
   - Loading skeleton and empty state
2. Update `App.tsx`:
   - Import `RegionalBreakdownPage`
   - Import `MapPin` from lucide-react
   - Add `{ to: '/regional', icon: MapPin, label: 'Regions' }` to `NAV_ITEMS`
   - Add route `createRoute(..., path: '/regional', component: RegionalBreakdownPage)`
   - Add to `routeTree`

## UX Notes
- Keep styling consistent with the rest of the app (dark charcoal, amber accent, steel-border, surface panels)
- The region field in listings is a free-text string (state name or abbreviation) — display as-is
- Source badges should use small rounded chips, max 3 shown with "+N more" overflow
- Bar chart bars should be amber-colored
- Empty state should explain that listings need a "Region" field filled in when added, with a link to Add Listing
