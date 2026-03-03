import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── Type definitions for backend types not yet in backend.ts interface ───────

export interface CrossModelResult {
  id: string;
  make: string;
  model: string;
  year: bigint;
  mileage: bigint;
  price: bigint;
  trim: string;
  condition: string;
  dealerName: string;
  source: string;
  region: string;
  listingUrl: string;
  timestamp: bigint;
  archived: boolean;
  dealScore: string;
  pricePerMile: number;
}

export interface DepreciationDataPoint {
  monthsFromFirst: bigint;
  avgPrice: number;
  listingCount: bigint;
}

export interface UserProfile {
  name: string;
}

// ─── Local type definitions (not exported from backend runtime) ───────────────

export interface PriceDropEvent {
  listingId: string;
  previousPrice: bigint;
  newPrice: bigint;
  dropAmount: bigint;
  dropPercent: number;
  timestamp: bigint;
}

export interface DashboardWidget {
  id: bigint;
  make: string;
  model: string;
  customLabel: string | null;
  createdAt: bigint;
}

// ─── Listings ────────────────────────────────────────────────────────────────

export function useGetAllListings() {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllListings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listing: any) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).createListing(listing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).updateListing(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useDeleteListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deleteListing(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useBulkDeleteListings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).bulkDeleteListings(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useBulkUpdateListings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).bulkUpdateListings(ids, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useBulkCreateListings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listings: any[]) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).bulkCreateListings(listings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useArchiveListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).archiveListing(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useBulkArchiveByAge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (daysOld: number) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).bulkArchiveByAge(daysOld);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

// ─── Deal Scores ─────────────────────────────────────────────────────────────

export function useGetDealScores(listingIds: string[]) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["dealScores", listingIds],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getDealScores(listingIds);
    },
    enabled: !!actor && !isFetching && listingIds.length > 0,
  });
}

// ─── Distinct Makes / Models ──────────────────────────────────────────────────

export function useGetDistinctMakes() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["distinctMakes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getDistinctMakes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDistinctModels(make: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["distinctModels", make],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getDistinctModels(make);
    },
    enabled: !!actor && !isFetching && !!make,
  });
}

// ─── Price Trend ──────────────────────────────────────────────────────────────

export function useGetPriceTrend(make: string, model: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["priceTrend", make, model],
    queryFn: async () => {
      if (!actor) return "stable";
      return (actor as any).getPriceTrend(make, model);
    },
    enabled: !!actor && !isFetching && !!make && !!model,
  });
}

// ─── Price Drop Events ────────────────────────────────────────────────────────

export function usePriceDropEvents(make: string, model: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PriceDropEvent[]>({
    queryKey: ["priceDropEvents", make, model],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getPriceDropEvents(make, model);
    },
    enabled: !!actor && !isFetching && !!make && !!model,
    staleTime: 120_000,
  });
}

// ─── Market Overview ──────────────────────────────────────────────────────────

export function useGetMarketOverview() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["marketOverview"],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getMarketOverview();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPriceDropListings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["priceDropListings"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getPriceDropListings();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mileage Adjusted Listings ────────────────────────────────────────────────

export function useGetMileageAdjustedListings(make: string, model: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["mileageAdjustedListings", make, model],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getMileageAdjustedListings(make, model);
    },
    enabled: !!actor && !isFetching && !!make && !!model,
  });
}

// ─── Depreciation Curve ───────────────────────────────────────────────────────

export function useDepreciationCurve(make: string, model: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DepreciationDataPoint[]>({
    queryKey: ["depreciationCurve", make, model],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getDepreciationCurve(make, model);
    },
    enabled:
      !!actor && !isFetching && make.trim() !== "" && model.trim() !== "",
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Cross-Model Search ───────────────────────────────────────────────────────

export function useCrossModelSearch(maxPrice: number, maxMileage: number) {
  const { actor, isFetching } = useActor();
  return useQuery<CrossModelResult[]>({
    queryKey: ["crossModelSearch", maxPrice, maxMileage],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getCrossModelSearch(maxPrice, BigInt(maxMileage));
    },
    enabled: !!actor && !isFetching && maxPrice > 0 && maxMileage > 0,
    staleTime: 60_000,
  });
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export function useGetWatchlist() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<any[]>({
    queryKey: ["watchlist"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getWatchlist();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAddToWatchlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      make,
      model,
      note,
    }: { make: string; model: string; note?: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).addToWatchlist(make, model, note ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).removeFromWatchlist(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useShareWatchlist() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).shareWatchlist();
    },
  });
}

// alias used by WatchlistPage
export const useGenerateWatchlistShareToken = useShareWatchlist;

export function useSharedWatchlist(token: string) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["sharedWatchlist", token],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getSharedWatchlist(token);
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

// ─── Price Alerts ─────────────────────────────────────────────────────────────

export function useGetPriceAlerts() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<any[]>({
    queryKey: ["priceAlerts"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getPriceAlerts();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAddPriceAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      make,
      model,
      targetPrice,
    }: { make: string; model: string; targetPrice: number }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).addPriceAlert(make, model, targetPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
    },
  });
}

// alias used by PriceAlertsPage
export const useSetPriceAlert = useAddPriceAlert;

export function useUpdatePriceAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      targetPrice,
    }: { id: bigint; targetPrice: number }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).updatePriceAlert(id, targetPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
    },
  });
}

export function useDeletePriceAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deletePriceAlert(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceAlerts"] });
    },
  });
}

// stub used by PriceAlertBanner / PriceAlertsPage
export function useGetListingsBelowTargetPrice(
  make: string,
  model: string,
  targetPrice: number,
) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["listingsBelowTargetPrice", make, model, targetPrice],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getListingsBelowTargetPrice(
          make,
          model,
          targetPrice,
        );
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!make && !!model,
  });
}

// ─── Filter Presets ───────────────────────────────────────────────────────────

export function useGetFilterPresets(presetType: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<any[]>({
    queryKey: ["filterPresets", presetType],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getFilterPresets(presetType);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSaveFilterPreset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      filterJson,
      presetType,
    }: { name: string; filterJson: string; presetType: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).saveFilterPreset(name, filterJson, presetType);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["filterPresets", variables.presetType],
      });
    },
  });
}

// alias used by ExportFilterPanel / ComparisonExportFilterPanel
export const useRenameFilterPreset = useSaveFilterPreset;

export function useUpdateFilterPreset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      filterJson,
      presetType: _presetType,
    }: {
      id: bigint;
      name: string;
      filterJson: string;
      presetType: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).updateFilterPreset(id, name, filterJson);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["filterPresets", variables.presetType],
      });
    },
  });
}

export function useDeleteFilterPreset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      presetType: _presetType,
    }: { id: bigint; presetType: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deleteFilterPreset(id);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["filterPresets", variables.presetType],
      });
    },
  });
}

// ─── Saved Searches ───────────────────────────────────────────────────────────

export function useGetSavedSearches() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<any[]>({
    queryKey: ["savedSearches"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getSavedSearches();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSaveSearch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      filterJson,
    }: { name: string; filterJson: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).saveSearch(name, filterJson);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedSearches"] });
    },
  });
}

export function useDeleteSavedSearch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deleteSavedSearch(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedSearches"] });
    },
  });
}

export function useRenameSavedSearch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: bigint; name: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).renameSavedSearch(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedSearches"] });
    },
  });
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export function useActivityLog(limit: number) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["activityLog", limit],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getActivityLog(limit);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<any>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor)
        return { totalListings: 0, averagePrice: 0, listingsThisWeek: 0 };
      return (actor as any).getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Dashboard Widgets ────────────────────────────────────────────────────────

export function useGetDashboardWidgets() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<DashboardWidget[]>({
    queryKey: ["dashboardWidgets"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getDashboardWidgets();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// alias used by DashboardPage
export const useDashboardWidgets = useGetDashboardWidgets;

export function useAddDashboardWidget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      make,
      model,
      customLabel,
    }: { make: string; model: string; customLabel?: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).addDashboardWidget(
        make,
        model,
        customLabel ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardWidgets"] });
    },
  });
}

export function useRemoveDashboardWidget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).removeDashboardWidget(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardWidgets"] });
    },
  });
}

// ─── Stale Listings ───────────────────────────────────────────────────────────

export function useGetStaleListings(daysOld: number) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["staleListings", daysOld],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getStaleListings(daysOld);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Duplicate Clusters ───────────────────────────────────────────────────────

export function useGetDuplicateClusters() {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["duplicateClusters"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getDuplicateClusters();
    },
    enabled: !!actor && !isFetching,
  });
}

// alias used by DuplicateMergePage
export const useGetNearDuplicates = useGetDuplicateClusters;

export function useMergeListings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      keepId,
      deleteIds,
    }: { keepId: string; deleteIds: string[] }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).mergeListings(keepId, deleteIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["duplicateClusters"] });
    },
  });
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export function useUserPreferences() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<any>({
    queryKey: ["userPreferences"],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getUserPreferences();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSaveUserPreferences() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      columnPrefsJson,
      theme,
    }: { columnPrefsJson: string; theme: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).saveUserPreferences({ columnPrefsJson, theme });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Similar Models ───────────────────────────────────────────────────────────

export function useGetSimilarModels(make: string, model: string) {
  const { actor, isFetching } = useActor();
  return useQuery<any[]>({
    queryKey: ["similarModels", make, model],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getSimilarModels(make, model);
    },
    enabled: !!actor && !isFetching && !!make && !!model,
  });
}

// ─── Best Time To Buy ─────────────────────────────────────────────────────────

export function useGetBestTimeToBuy(make: string, model: string) {
  const { actor, isFetching } = useActor();
  return useQuery<any>({
    queryKey: ["bestTimeToBuy", make, model],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getBestTimeToBuy(make, model);
    },
    enabled: !!actor && !isFetching && !!make && !!model,
  });
}

// ─── Negotiation Score ────────────────────────────────────────────────────────

export function useGetNegotiationScore(listingId: string, enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery<any | null>({
    queryKey: ["negotiationScore", listingId],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getNegotiationScore(listingId);
    },
    enabled: !!actor && !isFetching && !!listingId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Deal Expiry Prediction ───────────────────────────────────────────────────

export function useGetDealExpiryPrediction(listingId: string, enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery<any | null>({
    queryKey: ["dealExpiryPrediction", listingId],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getDealExpiryPrediction(listingId);
    },
    enabled: !!actor && !isFetching && !!listingId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Custom Alert Formulas ────────────────────────────────────────────────────

export function useGetCustomAlertFormulas() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<any[]>({
    queryKey: ["customAlertFormulas"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getCustomAlertFormulas();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSaveCustomAlertFormula() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formula: any) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).saveCustomAlertFormula(formula);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customAlertFormulas"] });
    },
  });
}

export function useDeleteCustomAlertFormula() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).deleteCustomAlertFormula(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customAlertFormulas"] });
    },
  });
}

export function useEvaluateCustomAlertFormulas() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return (actor as any).evaluateCustomAlertFormulas();
    },
  });
}

// ─── Dealer Ratings ───────────────────────────────────────────────────────────

export function useGetDealerRatings(dealerName: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dealerRatings", dealerName],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDealerRatings(dealerName);
    },
    enabled: !!actor && !isFetching && dealerName.trim() !== "",
    staleTime: 60_000,
  });
}

export function useGetAggregateDealerRating(dealerName: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dealerRatingAggregate", dealerName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAggregateDealerRating(dealerName);
    },
    enabled: !!actor && !isFetching && dealerName.trim() !== "",
    staleTime: 60_000,
  });
}

export function useSubmitDealerRating() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dealerName,
      rating,
      review,
    }: { dealerName: string; rating: number; review: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitDealerRating(dealerName, BigInt(rating), review);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dealerRatings", variables.dealerName],
      });
      queryClient.invalidateQueries({
        queryKey: ["dealerRatingAggregate", variables.dealerName],
      });
    },
  });
}

// ─── Confidence Score ─────────────────────────────────────────────────────────

export function useGetConfidenceScore(listingId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<bigint | null>({
    queryKey: ["confidenceScore", listingId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getConfidenceScore(listingId);
    },
    enabled: !!actor && !isFetching && !!identity && listingId.trim() !== "",
    staleTime: 5 * 60 * 1000,
  });
}
