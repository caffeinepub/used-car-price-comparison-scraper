# Auto Track Pro

## Current State
The backend has per-user data isolation implemented using Principal-keyed Maps for listings, watchlists, alerts, saved searches, filter presets, preferences, widgets, activity log, notes, and alert formulas. However, repeated bugs suggest the isolation has gaps or inconsistencies. The frontend has full feature set across Buyer Tools, Dealer Tools, Market Intel, and all core pages.

## Requested Changes (Diff)

### Add
- Clean, airtight per-user data isolation in the backend — every data store explicitly scoped to the caller's Internet Identity principal

### Modify
- Backend regenerated from scratch with consistent per-user scoping on ALL public endpoints
- Every query and update uses `caller` as the data key — no global shared state except dealer ratings (community feature)

### Remove
- Old shared `listings` migration variable (no longer needed)
- Any inconsistency in principal-scoping across methods

## Implementation Plan
1. Regenerate Motoko backend with all data stores keyed by Principal
2. All CRUD endpoints (listings, watchlist, alerts, saved searches, filter presets, preferences, widgets, activity log, notes, alert formulas) explicitly scoped to caller principal
3. Dealer ratings remain global (community feature — intentionally shared)
4. Depreciation curve calculation endpoint remains query-only (reads caller listings)
5. Market overview, cross-model search, regional breakdown read from caller's own listings
6. Keep all existing types compatible with frontend expectations
