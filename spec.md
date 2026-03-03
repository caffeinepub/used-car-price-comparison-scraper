# Auto Track Pro

## Current State
The app has two nav dropdowns — Buyer Tools and Dealer Tools — both visible to all users regardless of authentication or role. There is no role-based separation. The backend already has `getCallerUserRole`, `assignCallerUserRole`, and `isCallerAdmin` methods, plus a `UserRole` type with `{ admin: null } | { user: null } | { guest: null }`. The existing `ProfileSetupModal` only prompts for a display name on first login.

## Requested Changes (Diff)

### Add
- **App-level role** stored in backend: `buyer` and `dealer` as two new role values (extending or mapping over the existing UserRole enum). Because the existing `UserRole` is `admin | user | guest`, we will store the chosen role in the user's `UserProfile` metadata on the frontend side and persist it to the backend via `saveCallerUserProfile` using the `name` field plus a role suffix, OR create a new `appRole` concept stored locally and synced. Given the backend already exposes `saveCallerUserProfile({ name })` and `getCallerUserProfile()`, we will extend the profile name storage to include a role tag, OR use a dedicated localStorage key per principal as the source of truth for role, with backend `assignCallerUserRole` used to store `{ user: null }` (buyer) vs a convention for dealer.
  - Simpler approach: store app role (buyer/dealer) in `localStorage` keyed by principal, and also call `assignCallerUserRole` with `{ user: null }` for both (since backend only supports admin/user/guest). The role selection modal sets a localStorage entry `atp_role_<principal>` to `"buyer"` or `"dealer"`.
- **Role Selection Modal** shown after first login (after or replacing the profile setup modal if profile already exists, or shown as second step). The modal lets the user pick "I'm a Buyer" or "I'm a Dealer" with icon cards. Admins skip this modal entirely.
- **`useAppRole` hook** — reads role from localStorage for the current principal. Returns `"buyer" | "dealer" | "admin" | null` (null = not yet selected).
- **Nav filtering logic** in `Layout`:
  - Unauthenticated users: see all nav items (discovery mode), no role tools shown
  - Buyers: see standard nav + Buyer Tools dropdown; Dealer Tools hidden
  - Dealers: see standard nav + Dealer Tools dropdown; Buyer Tools hidden
  - Admins (`isCallerAdmin` returns true): see standard nav + both Buyer Tools and Dealer Tools

### Modify
- `App.tsx` — `Layout` component: conditionally render `BuyerToolsDropdown` and `DealerToolsDropdown` based on role
- `App.tsx` — Add `RoleSelectionModal` component shown after login when no role is stored for the current principal
- `App.tsx` — `ProfileSetupModal` flow: after name is saved, check role; if no role, trigger `RoleSelectionModal`
- The role selection step should feel welcoming and clear, with two prominent card buttons (Buyer / Dealer)

### Remove
- Nothing removed; Buyer Tools and Dealer Tools pages remain accessible via direct URL but are hidden from nav for non-matching roles

## Implementation Plan
1. Create `useAppRole` hook that reads/writes role to localStorage keyed by principal ID
2. Add `RoleSelectionModal` component in `App.tsx` with Buyer and Dealer card options
3. Update `Layout` to check admin status (via `isCallerAdmin`) and role, then conditionally render the two tool dropdowns
4. Wire up the role selection flow: after login + profile check, if no role stored → show `RoleSelectionModal`
5. Mobile nav also filtered by role
6. Add `data-ocid` markers to the role selection modal
