# Auto Track Pro

## Current State
Dealers can add marketplace listings with photos only via comma-separated image URLs. There is no direct file upload capability. The dealer listing forms (New and Edit) have a plain textarea for image URLs. The CSV import page exists for buyer-side listing import but there is no dedicated dealer inventory bulk import flow. The New Listing form requires dealers to manually fill in make/model/year/trim fields — no VIN decode.

## Requested Changes (Diff)

### Add
- **Photo upload UI** on DealerMarketplaceNewListingPage and DealerMarketplaceEditListingPage: replace the image URL textarea with a drag-and-drop / click-to-browse file uploader. Use base64 data URLs for uploaded images (stored as the url field in the image object). Support multiple photos per listing with preview thumbnails, ability to remove individual photos, and a progress indicator.
- **Dealer Bulk Inventory Import page** (`/dealer/inventory-import`): a dedicated dealer CSV import page that imports vehicles directly as marketplace listings (not buyer-side listings). Uses the `createMarketplaceListing` actor call. CSV columns: make, model, year, price, mileage, trim, condition, description, dealerPhone, dealerEmail, dealerCity, dealerState. Includes drag-and-drop zone, paste area, preview table, template download, and import button. Add this page to the Dealer Tools nav/QuickAccessGrid.
- **VIN decoder on New Listing form**: add a VIN input field at the top of the Vehicle Info card. When a dealer enters a 17-character VIN and clicks "Decode VIN", make a fetch call to `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{VIN}?format=json` and auto-fill make, model, year, trim from the response. Show a loading state and error feedback.

### Modify
- DealerMarketplaceNewListingPage: add VIN decoder at top, replace URL textarea with photo uploader.
- DealerMarketplaceEditListingPage: replace URL textarea with photo uploader showing existing images.
- QuickAccessGrid and nav drawer: add "Bulk Import" entry under Dealer Tools section.
- App.tsx routes: add route for `/dealer/inventory-import`.

### Remove
- The plain "Photo URLs (comma-separated)" textarea from new/edit listing forms.

## Implementation Plan
1. Create a reusable `PhotoUploader` component that accepts current images and onChange callback. Supports click-to-browse, drag-and-drop, multiple files, base64 preview thumbnails, remove button per photo.
2. Update `DealerMarketplaceNewListingPage` to include VIN decoder field + Decode button at top, and replace image URL textarea with `PhotoUploader`.
3. Update `DealerMarketplaceEditListingPage` to replace image URL textarea with `PhotoUploader`, pre-loading existing image URLs as current images.
4. Create `DealerInventoryImportPage` at `/dealer/inventory-import` — mirrors CSVImportPage structure but calls `createMarketplaceListing` for each row and includes dealer-specific columns.
5. Add route in App.tsx and entry in QuickAccessGrid / nav drawer under Dealer Tools.
