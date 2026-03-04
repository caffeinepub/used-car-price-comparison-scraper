# Auto Track Pro

## Current State
Desktop nav uses a 2-row header: Row 1 = logo + auth controls, Row 2 = 9 primary nav links on the left + 4 dropdowns (More, Market Intel, Buyer Tools, Dealer Tools) on the right. Because there are too many items, the "More" dropdown hides 7 secondary links, and Market Intel gets crowded/inaccessible near the right edge. Users cannot see all navigation options at once.

## Requested Changes (Diff)

### Add
- A full-width desktop nav section that shows ALL navigation items grouped and visible without dropdowns or overflow. All items should be grouped into labeled sections on the same nav area so nothing is hidden.

### Modify
- Desktop nav Row 2: Replace the overflow/dropdown approach with a 2-row nav area. Row 2a shows all primary links (Dashboard, Add Listing, Import, Compare, Market, Watchlist, Alerts, Activity, Ratings) + the More items (Cross-Search, Depreciation, Duplicates, Cost Calc, Regions, Saved Searches, Alert Rules) all as direct nav buttons. Row 2b shows Market Intel, Buyer Tools, Dealer Tools items as direct nav buttons grouped by section with subtle section headers.
- All items rendered as flat NavLink buttons (no dropdowns on desktop), so every button is visible and clickable without hovering or expanding anything.

### Remove
- The "More" dropdown on desktop — all its items become direct nav links in the top bar
- The collapsible Market Intel, Buyer Tools, Dealer Tools dropdowns on desktop — items become direct nav links grouped in the second row

## Implementation Plan
1. Restructure the desktop nav (`hidden lg:flex` section) to render two rows:
   - Row 1 (all primary + secondary links as flat buttons, wrapping): NAV_ITEMS + MORE_ITEMS all as NavLink
   - Row 2 (role-aware tool links with section labels): Market Intel section, then Buyer Tools (if applicable), then Dealer Tools (if applicable)
2. Keep the dropdown components intact for mobile nav (they are reused in the mobile menu already via inline JSX)
3. The logo + controls row stays unchanged (Row 1 of header)
4. Mobile nav is unchanged
