# Auto Track Pro

## Current State
Full-stack used car price comparison and tracking app with:
- Dashboard with deal scoring, negotiation score, and deal expiry prediction columns
- Comparison page with price history, NHTSA recall lookup, shareable reports
- Cross-model search, depreciation curve, ownership cost calculator
- Watchlist, price alerts, saved searches, activity log, alert rules
- Internet Identity authentication, dark/light theme, CSV import/export
- Backend: `getNegotiationScore`, `getDealExpiryPrediction` already exist

## Requested Changes (Diff)

### Add
1. **Negotiation Coach page** (`/negotiation-coach`) — given a listing ID (or make/model/days listed/price drop), display step-by-step conversational guidance on what to say to a dealer. Uses `getNegotiationScore` backend data plus rule-based logic on days listed and price drop to generate specific opening offer, counter strategy, and closing scripts.
2. **"Should I Wait?" page** (`/should-i-wait`) — buyer selects make/model; app shows a seasonal pricing signal (Good Time / Prices Are High / Average) with a month-by-month price trend chart and a plain-English recommendation on whether to buy now or wait.
3. **True Cost of Ownership Timeline page** (`/tco-timeline`) — buyer selects a listing (or inputs make/model/year/price/mileage); app shows a 5-year stacked area/bar chart combining depreciation, fuel, insurance, and maintenance costs, plus a summary table. Uses the existing ownership cost calculator logic extended to 5-year projection.
4. **Trim-Level Value Analyzer page** (`/trim-analyzer`) — buyer selects a make/model; app groups listings by trim, shows avg price per trim, price premium over base, and a "Worth It?" verdict badge based on the premium vs. feature tier.
5. **Deal Expiry Prediction detail panel** — enhance the existing deal expiry column/data by adding a dedicated `/deal-expiry` page where buyers can look up any listing and see a full explanation of the urgency signal, historical data on how fast similar deals sell, and a recommended action.
- Add nav items for all 5 new pages
- Add a "Buyer Tools" nav section/grouping or dropdown in the header nav

### Modify
- `App.tsx` — add 5 new routes and nav items for buyer tool pages
- Nav — add a "Buyer Tools" dropdown/section to group the 5 new pages cleanly without overcrowding the nav

### Remove
Nothing removed.

## Implementation Plan
1. Create `NegotiationCoachPage.tsx` — listing selector or manual input (days listed, price drop %, make/model), step-by-step script cards with copy buttons, uses `getNegotiationScore` if listing ID available
2. Create `ShouldIWaitPage.tsx` — make/model selector, seasonal price signal card, simulated month-by-month price index chart, plain-English recommendation
3. Create `TCOTimelinePage.tsx` — listing selector or manual inputs, 5-year stacked bar chart (Recharts), summary table with annual and total costs per category
4. Create `TrimAnalyzerPage.tsx` — make/model selector, trim group cards with avg price, price premium badge, "Worth It?" verdict based on premium thresholds
5. Create `DealExpiryPage.tsx` — listing selector, urgency card, days-remaining estimate, explanation of factors, recommended action CTA
6. Update `App.tsx` — add all 5 routes, add "Buyer Tools" dropdown nav group with links to all 5 pages
