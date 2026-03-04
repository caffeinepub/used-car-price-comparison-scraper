# Auto Track Pro

## Current State
The app uses a left sidebar for desktop (md+) navigation. On mobile/tablet (below md breakpoint), a sticky top header with logo, theme toggle, auth button, and a hamburger menu drawer is shown. This is the "standard navigation bar at the top" the user wants removed.

## Requested Changes (Diff)

### Add
- Nothing new to add.

### Modify
- Remove the mobile top header (`<header className="md:hidden ...">`) entirely from the Layout component.
- Move the mobile nav drawer content into an always-accessible bottom bar or simply expose a floating menu trigger button in the bottom-right corner of the screen so mobile users can still navigate.
- The mobile menu trigger (hamburger) should be a floating action button (FAB) fixed to the bottom-right on mobile, opening the same navigation drawer that was previously inside the header.
- The theme toggle and auth button (previously in the mobile header) should be moved into the mobile nav drawer.

### Remove
- The sticky top `<header>` element on mobile (the `md:hidden` header block).

## Implementation Plan
1. Remove the `<header className="md:hidden ...">` block from the Layout component in App.tsx.
2. Add a floating action button (FAB) fixed to the bottom-right on mobile only (`md:hidden`) that toggles the mobile nav drawer open/closed.
3. Move the MobileThemeToggle and MobileAuthButton into the mobile nav drawer (they were previously in the header).
4. Keep the mobile nav drawer content unchanged — all nav sections, Market Intel, Buyer/Dealer Tools, role switching.
5. Adjust the main content area top padding on mobile since there's no longer a sticky header to account for.
