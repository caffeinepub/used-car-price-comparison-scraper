# Auto Track Pro

## Current State
Version 95 is live in production. The app has a full suite of Buyer Tools (5 tools), Dealer Tools (8 tools), and Market Intel (6 tools). Navigation uses a mobile bottom tab bar + slide-up drawer and a desktop header bar. Buyer Tools are gated to users with "buyer" or "admin" role.

## Requested Changes (Diff)

### Add
- **Dealer Motivation Score** (`/buyer/dealer-motivation`) — Inputs: dealer name, days listed, price drop count, price drop total %, month-end proximity (days until end of month). Output: composite motivation score (0–100), color-coded tier (Low / Moderate / High / Very High), and an actionable negotiation tip per tier. Secondary insight cards: Days-on-Lot factor, Price Drop factor, Month-End Pressure factor.
- **Walk-Away Price Calculator** (`/buyer/walk-away-price`) — Inputs: listed price, average market price (or auto-derive from a make/model selector), desired discount %, max acceptable price, negotiation style (aggressive/balanced/conservative). Output: recommended walk-away price, opening offer suggestion, counter-offer range, and a "Do Not Pay More Than" threshold. Visual gauge showing where the listed price sits relative to market.
- **Seller Urgency Detector** (`/buyer/seller-urgency`) — Inputs: listing entries (make, model, year, original price, current price, date first listed, number of price drops). Output: urgency score per listing (0–100), urgency tier badge (Cold / Warm / Hot / Burning), days-on-market calculation, total price drop %, and a recommended opening offer. Sortable table of assessed listings with color-coded rows.
- All three pages added to `BUYER_TOOLS` array in `App.tsx` and `BUYER_TOOLS_ITEMS` array in `QuickAccessGrid.tsx`.
- All three routes registered in `App.tsx` route tree.
- All three pages linked in the nav drawer Buyer Tools section.

### Modify
- `App.tsx` — import the 3 new page components, add routes, add to `BUYER_TOOLS` nav array.
- `QuickAccessGrid.tsx` — add 3 new entries to `BUYER_TOOLS_ITEMS`.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `DealerMotivationPage.tsx` — composite score calculator with factor breakdown cards and negotiation tips.
2. Create `WalkAwayPricePage.tsx` — price calculator with opening offer, counter range, walk-away threshold, and visual price gauge.
3. Create `SellerUrgencyPage.tsx` — multi-listing urgency table with score, tier badges, drop %, and recommended offers.
4. Register 3 new routes in `App.tsx` and add to `BUYER_TOOLS` array.
5. Add 3 new entries to `BUYER_TOOLS_ITEMS` in `QuickAccessGrid.tsx`.
