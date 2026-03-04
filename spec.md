# Auto Track Pro

## Current State
The desktop navigation (App.tsx) uses two rows of flat nav buttons with `flex-wrap`. Row 1 has 9 primary links + 7 secondary links. Row 2 has Market Intel (3 links), Buyer Tools (5 links), and Dealer Tools (5 links) — all flat. On standard desktop widths (1280-1440px), row 1 overflows and wraps, pushing Market Intel and other tools off-screen or making them unclickable. The previous attempts used `flex-wrap` which causes layout chaos.

## Requested Changes (Diff)

### Add
- Proper click-based dropdown menus for "Market Intel", "More", "Buyer Tools", "Dealer Tools" in the desktop nav
- A single clean horizontal nav bar (no multi-row wrap) that fits on standard desktop (1280px+)
- Scroll-based overflow or a clean "More" overflow menu for edge cases

### Modify
- Desktop nav: Replace the multi-row flat-button layout with a single sticky nav bar containing:
  - Left: Logo
  - Center: Primary links (Dashboard, Add, Import, Compare, Market, Watchlist, Alerts, Activity, Ratings) + "More" dropdown (for secondary items)
  - Right: "Market Intel" dropdown, role-based "Buyer Tools" / "Dealer Tools" dropdowns, role badge, theme toggle, sign in/out
- All dropdowns open on click, stay open until clicked elsewhere (no hover-only)
- Dropdown panels are min-width constrained and positioned correctly (no off-screen clipping)
- Mobile nav stays as-is (hamburger menu)

### Remove
- The two-row desktop nav (`Row 2a` and `Row 2b` with flat wrap layout)
- The nested `flex-wrap` rows that cause overflow issues

## Implementation Plan
1. Rewrite the desktop nav section in App.tsx
2. Create a reusable `DesktopDropdown` component within App.tsx that handles click-open/close with outside click detection
3. Group nav items: primary (9 items shown flat), More dropdown (7 secondary items), Market Intel dropdown (3 items), Buyer Tools dropdown (5 items, role-gated), Dealer Tools dropdown (5 items, role-gated)
4. Right-align the tool dropdowns so they don't compete for space with primary links
5. Ensure all dropdowns open leftward/downward correctly at screen edges
6. Test that the layout fits cleanly at 1280px, 1440px, and 1920px viewport widths
