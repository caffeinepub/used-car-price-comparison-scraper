# Auto Track Pro — Dealer Marketplace

## Current State

Auto Track Pro is a full-stack role-based car analytics and price comparison platform with Motoko backend and React frontend. The backend has:
- Per-user isolated car listings (private, for analytics)
- Blob storage (blob-storage component installed)
- Authorization/role system (Buyer/Dealer roles)
- Watchlist, alerts, saved searches, notes, activity log

The frontend has:
- 42 routes for analytics, buyer tools, dealer tools, market intel
- PageHeader component with Back to Dashboard / X on all pages
- Role-gated nav (Buyer Tools vs Dealer Tools)
- Public routes: `/shared-comparison`, `/shared-watchlist/:token`

**No marketplace features exist yet.** There are no public listing pages, dealer storefronts, inquiry flows, or marketplace-specific data types in the backend.

## Requested Changes (Diff)

### Add
- `MarketplaceListing` backend type: id, dealerPrincipal, dealerName, dealerPhone, dealerEmail, dealerCity, dealerState, make, model, year, mileage, price, trim, condition, description, images (ExternalBlob[]), status (available/sold), timestamp
- `Inquiry` backend type: id, listingId, buyerName, buyerEmail, buyerPhone, message, timestamp
- `DealerProfile` backend type: principal, dealerName, phone, email, city, state, bio, logoUrl
- Backend endpoints:
  - `createMarketplaceListing(input)` — dealer only, creates a public listing
  - `updateMarketplaceListing(id, input)` — dealer only, edits own listing
  - `setMarketplaceListingStatus(id, status)` — dealer marks sold/available
  - `deleteMarketplaceListing(id)` — dealer removes own listing
  - `getPublicMarketplaceListings()` — no auth, returns all available + sold listings
  - `getDealerStorefront(dealerPrincipal)` — no auth, returns dealer profile + their listings
  - `getMyMarketplaceListings()` — dealer views their own listings
  - `submitInquiry(listingId, input)` — no auth, buyer submits inquiry
  - `getMyInquiries()` — dealer views inquiries on their listings
  - `saveDealerProfile(input)` — dealer saves/updates their public profile
  - `getMyDealerProfile()` — dealer retrieves their profile
- Frontend pages:
  - `/marketplace` — public browse/search page, no login required, shows all listings with search/filter by make/model/price/region/condition. Deal score badges, recall alerts. Contact button per listing.
  - `/marketplace/listing/:id` — public listing detail page with full photos, specs, contact form
  - `/storefront/:dealerPrincipal` — public dealer storefront: dealer profile, all their active listings, contact info
  - `/dealer/marketplace` — dealer's private management page: their listings, add new listing with photo upload, mark sold/available, view inquiries
  - `/dealer/marketplace/new` — dealer listing submission form with photo upload
  - `/dealer/marketplace/edit/:id` — dealer listing edit form
  - `/dealer/profile` — dealer saves their public storefront profile (name, phone, email, city, state, bio)
- Nav updates: Add "Marketplace" to primary nav for all users (public); add "My Listings" to Dealer Tools nav
- QuickAccessGrid: Add marketplace cards

### Modify
- `App.tsx` — add 6 new routes
- Nav arrays — add Marketplace (public) and My Listings (dealer)
- QuickAccessGrid — add marketplace section

### Remove
- Nothing removed

## Implementation Plan

1. Backend: Add MarketplaceListing, Inquiry, DealerProfile types; implement all 11 marketplace endpoints with proper principal-scoping
2. Frontend `/marketplace`: Search/filter UI, listing cards with deal score + recall badge + contact button, no-auth access
3. Frontend `/marketplace/listing/:id`: Full listing detail with photo carousel, specs table, inquiry form
4. Frontend `/storefront/:dealerPrincipal`: Dealer profile header, listing grid, contact info
5. Frontend `/dealer/marketplace`: Management table — add/edit/delete listings, mark sold/available, view inquiries tab
6. Frontend `/dealer/marketplace/new` and `/edit/:id`: Listing form with photo upload using blob-storage
7. Frontend `/dealer/profile`: Dealer profile form
8. Wire nav and QuickAccessGrid for new routes
