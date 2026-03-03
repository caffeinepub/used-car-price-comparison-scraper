# Auto Track Pro

## Current State
Version 57 is live in production. The app is a full-stack used car price comparison and intelligence platform with per-user data isolation, role-based nav (Buyer/Dealer/Admin), listing management, deal scoring, negotiation tools, buyer tools, dealer tools, NHTSA recall lookup on the Comparison page, confidence scores (stored frontend-only), and price history tracked in `priceHistory: [PricePoint]` on each listing.

## Requested Changes (Diff)

### Add
1. **Community Dealer Ratings** — buyers can submit a 1–5 star rating + text review for a dealer by name. Aggregate rating (avg stars, review count) shown on listing cards in the dashboard. A dedicated "Dealer Ratings" page lets users browse and submit ratings. Ratings are stored globally (shared across all users) so the community effect works.
2. **Price Drop History Replay** — a modal/panel on any listing card that plays back all price changes chronologically using an animated step-through timeline. Sourced from the existing `priceHistory` array on `CarListing` plus the current price as the final point. Available via a "History" button on listing rows.
3. **Confidence Score on Listings** — compute a 0–100 score in the backend based on how complete and trustworthy a listing's data is (make, model, year, mileage, price, trim, condition, dealer name, source, region, listing URL, price history length). Return it as `getConfidenceScore(listingId)`. Show as a badge on dashboard listing rows (color-coded: green ≥70, amber 40–69, red <40).
4. **Recall Alert on Listing Cards** — fetch open NHTSA recalls for a listing's make/model/year from the free NHTSA API (`https://api.nhtsa.gov/recalls/recallsByVehicle?make=X&model=Y&modelYear=Z`) directly in the frontend. Show a compact recall badge on dashboard listing rows when open recalls exist (clicking it opens a small popover with recall count + top recall description). This is purely a frontend feature using the NHTSA public API.

### Modify
- **Dashboard listing rows** — add four new columns/elements: Dealer Rating badge, Price History button, Confidence Score badge, Recall Alert badge.
- **DashboardPage** — wire up the four new features with appropriate loading states.

### Remove
- Nothing removed.

## Implementation Plan
1. **Backend**: Add `DealerRating` type with `dealerName`, `rating` (1–5), `review`, `reviewer` (Principal), `timestamp`. Add `dealerRatings: Map<Text, List<DealerRating>>` (keyed by dealerName, shared globally). Add `submitDealerRating(dealerName, rating, review)`, `getDealerRatings(dealerName) -> [DealerRating]`, `getAggregateDealerRating(dealerName) -> {avgRating: Float, count: Nat}`. Add `getConfidenceScore(listingId) -> ?Nat` query on caller's listings.
2. **Frontend – Dealer Ratings**: New `DealerRatingsPage.tsx` at `/dealer-ratings`. Add nav link. Star rating form (1–5) + review textarea + submit. Aggregated rating display per dealer.
3. **Frontend – Price Drop Replay**: `PriceHistoryReplayModal.tsx` component. Button on each dashboard row ("History"). Modal shows animated step-through of price changes with timestamps, previous → new price, drop % per step, and a Play/Pause auto-advance control.
4. **Frontend – Confidence Score Badge**: `ConfidenceScoreBadge.tsx`. Calls `getConfidenceScore(listingId)`. Color-coded badge (green/amber/red). Shown as a column on the dashboard.
5. **Frontend – Recall Alert Badge**: `RecallAlertBadge.tsx`. Fetches NHTSA API with make/model/year. Shows count badge in red when recalls exist. Popover with recall summaries on click.
6. **Frontend – Dashboard integration**: Wire all four new UI elements into `DashboardPage.tsx` rows. Add a "Dealer Ratings" link to the nav.
