# Auto Track Pro

## Current State
Full dealer marketplace with listing management, inquiry inbox with reply system, dealer profile, bulk import, VIN decoder, and photo upload. No analytics dashboard exists yet.

## Requested Changes (Diff)

### Add
- DealerAnalyticsDashboard page at /dealer/analytics with three sections:
  1. Storefront Performance Stats: per-listing views, inquiries, saves with trend indicators
  2. Conversion Rate Tracker: inquiries vs listings sold, conversion % per listing and overall
  3. Revenue and Margin Report: total sold value, avg margin per vehicle, best/worst segments
- Route dealerAnalyticsRoute in App.tsx
- Analytics Dashboard card in QuickAccessGrid dealer section

### Modify
- App.tsx: add /dealer/analytics route
- QuickAccessGrid.tsx: add card

### Remove
- Nothing

## Implementation Plan
1. Create DealerAnalyticsDashboard.tsx with all three sections
2. Use dealer listings/inquiry localStorage data to compute real metrics with realistic fallbacks
3. Wire route in App.tsx
4. Add card in QuickAccessGrid.tsx
