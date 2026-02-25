# Specification

## Summary
**Goal:** Fully wire deal scoring and sorting logic in the `getCrossModelSearch` backend function and the `CrossModelSearchPage` frontend component of AutoTrackr.

**Planned changes:**
- In `backend/main.mo`, update `getCrossModelSearch` to compute `dealScore` for each result by calculating the average price per make/model (across non-archived listings), then labeling each listing as 'Good Deal' (>10% below average), 'Overpriced' (>10% above average), or 'Fair' (otherwise). Sort results by tier ('Good Deal' → 'Fair' → 'Overpriced'), then by price ascending within each tier.
- In `frontend/src/pages/CrossModelSearchPage.tsx`, wire the 'Good Deal' highlighted section to only show listings where `dealScore === 'Good Deal'`. Apply badge colors: green/emerald for 'Good Deal', amber/yellow for 'Fair', red for 'Overpriced'. Treat missing or empty `dealScore` as 'Fair'. Ensure grouping and sorting match server-side ordering without disrupting the make/model text filter.

**User-visible outcome:** Users performing a cross-model search will see listings correctly labeled and color-coded by deal score, with 'Good Deal' listings prominently grouped first, followed by 'Fair' and 'Overpriced' listings sorted by price within each tier.
