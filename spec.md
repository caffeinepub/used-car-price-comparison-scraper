# Auto Track Pro

## Current State
The app has a two-step sign-in flow: users click "Sign in" which opens Internet Identity, then after authentication a role selection modal appears asking "I'm a Buyer" or "I'm a Dealer". The role is stored in localStorage per principal. A role badge in the header lets users switch roles. The sign-in button in the header just says "Sign in" with no indication of roles.

## Requested Changes (Diff)

### Add
- Pre-login role selection modal: when unauthenticated users click "Sign in", show a modal first letting them choose "Sign in as Buyer" or "Sign in as Dealer" before triggering Internet Identity login
- The pre-login modal should visually match the existing RoleSelectionModal style (two cards with icons, descriptions)
- After user picks a role in the pre-login modal, trigger Internet Identity login; once authenticated, auto-apply that role (skip the post-login role modal)

### Modify
- The "Sign in" button in the header (both desktop and mobile versions) should open the new pre-login role picker modal instead of directly calling login()
- The existing post-login RoleSelectionModal should still appear as a fallback if a user logs in without going through the pre-login picker (e.g. deep links, returning users with no stored role)
- The header sign-in button label can reflect the pre-login state: "Sign in as Buyer / Dealer"

### Remove
- Nothing removed — existing post-login role modal stays as a fallback

## Implementation Plan
1. Add a `PreLoginRoleModal` component with two cards: "Sign in as Buyer" and "Sign in as Dealer"
2. Add `showPreLoginModal` state to the AppHeader (or Layout level)
3. Change the auth button onClick to: if unauthenticated → open PreLoginRoleModal; if authenticated → sign out
4. In PreLoginRoleModal, when user picks a role: store the pending role in a ref/state, call login(), then in a useEffect watch for identity becoming non-null and auto-apply the pending role via setRole()
5. The pending role auto-apply should set the role before the post-login RoleSelectionModal would appear, so the post-login modal is skipped
6. Keep the existing RoleSelectionModal as a fallback for users who are already authenticated but have no stored role
