# Auto Track Pro

## Current State
The app uses a sticky top navigation bar (header) with two rows on desktop:
- Row 1: Logo + right controls (auth, theme, role badge, mobile hamburger)
- Row 2: Primary nav links inline + "More" dropdown + Market Intel / Buyer Tools / Dealer Tools dropdowns

This has caused persistent issues on laptop/desktop: items jam up, dropdowns (Market Intel, Buyer Tools, Dealer Tools) are hard to open or don't work, text overlaps, and items get clipped.

Mobile still uses a hamburger menu that reveals a vertical list — this works fine and should stay unchanged.

## Requested Changes (Diff)

### Add
- **Left sidebar navigation for desktop/laptop (md+ breakpoints)**
  - Fixed left sidebar, full height, contains the ATP logo + all navigation items organized in labeled sections:
    - **Core**: Dashboard, Add Listing, Import, Compare, Market
    - **Tracking**: Watchlist, Alert Rules, Saved, Activity
    - **Analysis**: Cross Search, Depreciation, Duplicates, Cost Calculator, Regions, Ratings
    - **Market Intel** (amber-highlighted section): Market Saturation, Cross-Market Comparison, Seasonal Pricing
    - **Buyer Tools** (role-gated, buyer/admin only): Negotiation Coach, Should I Wait?, TCO Timeline, Trim Analyzer, Deal Expiry
    - **Dealer Tools** (role-gated, dealer/admin only): Pricing Radar, Lot Tracker, Demand Heatmap, Turnover Report, Price Elasticity
  - Bottom of sidebar: role badge (click to switch), theme toggle, auth button
  - Sidebar should be collapsible (toggle button) for smaller laptop screens — collapses to icon-only mode showing just icons with tooltips
  - Active page highlighted with amber accent
- **Main content area shifts right** to account for sidebar width (ml offset)

### Modify
- **Remove the desktop Row 2 nav** (the horizontal nav bar with dropdowns) — replaced by sidebar
- **Keep Row 1 header** but simplify it: just logo + right controls on mobile; on desktop the logo moves to the sidebar top, Row 1 header shows only right controls (theme, role, auth) or becomes a thin top bar
- **Mobile nav stays the same** — hamburger menu with the existing vertical mobile drawer, no changes

### Remove
- Desktop Row 2 nav bar (the overflow-prone horizontal nav links + dropdowns)
- `DesktopDropdown` component usage in the desktop nav (those dropdowns caused all the issues)

## Implementation Plan

1. Replace the desktop layout in `App.tsx` — introduce a `DesktopSidebar` component that renders all nav items in labeled vertical sections
2. On `md+` screens: render sidebar (fixed, left, full-height) + main content with `md:ml-[sidebar-width]` offset
3. Sidebar sections:
   - Core section: Dashboard, Add Listing, Import, Compare, Market
   - Tracking section: Watchlist, Alerts, Saved Searches, Activity
   - Analysis section: Cross-Search, Depreciation, Duplicates, Cost Calc, Regions, Ratings
   - Market Intel section (amber header): Market Saturation, Cross-Market Comparison, Seasonal Pricing
   - Buyer Tools section (conditionally rendered if `showBuyerTools`): 5 buyer tool links
   - Dealer Tools section (conditionally rendered if `showDealerTools`): 5 dealer tool links
4. Sidebar collapse: toggle button (chevron icon) that collapses to icon-only mode (w-14) from expanded mode (w-56). Store collapse state in localStorage.
5. Sidebar bottom: role badge button + theme toggle + sign-in/out button
6. Desktop header Row 1: keep for mobile hamburger menu but on desktop show only a minimal top bar with just theme + role + auth controls aligned right (no logo since logo is in sidebar)
7. Mobile behavior unchanged: hamburger opens the existing mobile drawer
8. All sidebar nav links use active route detection with amber highlight
9. Apply `data-ocid` markers to all sidebar nav links and controls
