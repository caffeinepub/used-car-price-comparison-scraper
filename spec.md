# Auto Track Pro

## Current State
Dealers report being unable to sign in as dealer and create listings. The issue involves the role resolution flow after sign-in. The pending role (dealer) is stored in a React ref (`pendingRole.current`) and applied in a `useEffect` that depends on `[identity, setRole]`. There's a race condition risk where:
1. `useAppRole`'s async admin check reads localStorage before `setRole("dealer")` is called, setting role to the old stored value ("buyer" from a previous session)
2. The `pendingRole` ref can be lost if React re-renders between login initiation and identity resolution
3. The dealer listing pages may show a permanent spinner if identity/role resolution has any hiccup

## Requested Changes (Diff)

### Add
- `sessionStorage` based pending role persistence (`atp_pending_role`) — survives re-renders and async gaps
- Immediate role application in `useAppRole` effect when sessionStorage pending role exists, before async admin check
- Role loading context so dealer pages can show spinner while role is being determined (not just while `role === null`)

### Modify
- `useAppRole` hook: read `sessionStorage` pending role on identity resolution, apply it immediately, clear sessionStorage after
- App.tsx pre-login `onSelect` handler: write selected role to `sessionStorage` before calling `login()`
- App.tsx pendingRole ref effect: keep as secondary fallback but also clear sessionStorage on sign-out
- `DealerMarketplaceNewListingPage` and `DealerMarketplaceManagePage` and `DealerProfilePage`: use `roleLoading` context for the loading spinner condition instead of just `role === null`
- `AppRoleContext`: extend to provide both `role` and `roleLoading` boolean

### Remove
- Nothing removed

## Implementation Plan
1. Update `useAppRoleContext.ts` to export a context that contains `{ role, roleLoading }` instead of just role
2. Update `useAppRole` in App.tsx:
   - In sign-out cleanup: clear `sessionStorage.removeItem('atp_pending_role')`
   - When identity resolves: check `sessionStorage.getItem('atp_pending_role')`, if present set it immediately and clear storage, set `explicitRoleSetRef.current = principalId`
   - Expose `isLoading` as `roleLoading` in the context
3. Update App.tsx pre-login onSelect: `sessionStorage.setItem('atp_pending_role', role)` before `login()`
4. Update dealer pages to use `roleLoading` context value for loading spinner
