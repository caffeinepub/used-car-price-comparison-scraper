# Auto Track Pro

## Current State
The desktop navigation has two rows:
- Row 1: Logo + auth controls
- Row 2a: Primary nav links (Dashboard, Add, Import, Compare, Market, Watchlist, Alerts, Activity, Ratings)
- Row 2b: Dropdown buttons (More, Market Intel, Buyer Tools, Dealer Tools)

The nav is still jamming on laptop screens because too many items compete for horizontal space. Market Intel dropdown is hard to access as it gets pushed to the far right where it can overlap with the viewport edge or get clipped.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Restructure the desktop nav into a cleaner 3-row header layout:
  - Row 1 (h-12): Logo on the left, auth controls (role badge, theme, sign in, mobile toggle) on the right
  - Row 2 (compact): All primary nav links as a scrollable/wrapping row — Dashboard, Add, Import, Compare, Market, Watchlist, Alerts, Activity, Ratings
  - Row 3 (compact): All dropdown groups side by side — More | Market Intel | Buyer Tools | Dealer Tools — left-aligned with generous gaps, each dropdown panel opening downward with `right-0` alignment so it never clips off-screen edge
- All dropdown panels should use `right-0` (right-aligned) so they open toward the left and never get cut off at the screen edge, especially Market Intel which sits near the right end
- Make the nav background slightly more distinct between rows so the structure is clear
- Ensure the `lg:` breakpoint triggers at 1024px so desktop nav shows on most laptops

### Remove
- Remove the cramped single sub-row approach that causes overflow

## Implementation Plan
1. In `App.tsx`, update the `Layout` component's `<header>` section
2. Change `<nav>` to have:
   - Sub-row A: all NAV_ITEMS links, flex-wrap allowed so they never overflow
   - Sub-row B: all four dropdown buttons (More, MarketIntel, BuyerTools, DealerTools) with `flex-wrap` and generous gap
3. Update all four dropdown components (MoreDropdown, MarketIntelDropdown, BuyerToolsDropdown, DealerToolsDropdown) to use `right-0` positioning on their dropdown panels so they open left-ward and don't get clipped
4. Validate with typecheck/build
