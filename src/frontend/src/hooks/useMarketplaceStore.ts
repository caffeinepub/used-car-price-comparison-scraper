// Marketplace store using localStorage since backend doesn't have marketplace methods
// Public listings are shared across all users
// Each dealer's listings are identified by their principalId

import { useCallback } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

export type MktListingStatus = { available: null } | { sold: null };

export type MktListingImage = {
  url: string;
  mimeType: string;
  size: bigint;
};

export type MktListing = {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerPhone: string;
  dealerEmail: string;
  dealerCity: string;
  dealerState: string;
  make: string;
  model: string;
  year: bigint;
  mileage: bigint;
  price: bigint;
  trim: string;
  condition: string;
  description: string;
  images: MktListingImage[];
  status: MktListingStatus;
  timestamp: bigint;
};

export type MktInquiry = {
  id: string;
  listingId: string;
  dealerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string;
  timestamp: bigint;
};

const LISTINGS_KEY = "atp_marketplace_listings_v2";
const INQUIRIES_KEY = "atp_marketplace_inquiries_v2";

// The anonymous principal from Internet Identity
const ANON_PRINCIPAL = "2vxsx-fae";

function isAnonymous(principalId: string) {
  return principalId === "anonymous" || principalId === ANON_PRINCIPAL;
}

function loadListings(): MktListing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((l: any) => ({
      ...l,
      year: BigInt(l.year),
      mileage: BigInt(l.mileage),
      price: BigInt(l.price),
      timestamp: BigInt(l.timestamp),
      images: (l.images || []).map((img: any) => ({
        ...img,
        size: BigInt(img.size || 0),
      })),
    }));
  } catch {
    return [];
  }
}

function saveListings(listings: MktListing[]) {
  const serializable = listings.map((l) => ({
    ...l,
    year: l.year.toString(),
    mileage: l.mileage.toString(),
    price: l.price.toString(),
    timestamp: l.timestamp.toString(),
    images: (l.images || []).map((img) => ({
      ...img,
      size: img.size.toString(),
    })),
  }));
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(serializable));
}

function loadInquiries(): MktInquiry[] {
  try {
    const raw = localStorage.getItem(INQUIRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((i: any) => ({
      ...i,
      timestamp: BigInt(i.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveInquiries(inquiries: MktInquiry[]) {
  const serializable = inquiries.map((i) => ({
    ...i,
    timestamp: i.timestamp.toString(),
  }));
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(serializable));
}

export function useMarketplaceStore() {
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() ?? "anonymous";

  // Returns true when identity is fully resolved to a real (non-anonymous) principal
  const isIdentityReady =
    !!identity && !isAnonymous(identity.getPrincipal().toString());

  const getAllPublicListings = useCallback((): MktListing[] => {
    return loadListings().filter(
      (l) => "available" in l.status && !isAnonymous(l.dealerId),
    );
  }, []);

  const getMyListings = useCallback((): MktListing[] => {
    // Never return listings for anonymous/unresolved identity
    if (isAnonymous(principalId)) return [];
    return loadListings().filter((l) => l.dealerId === principalId);
  }, [principalId]);

  const getListing = useCallback((id: string): MktListing | undefined => {
    return loadListings().find((l) => l.id === id);
  }, []);

  const getListingsByDealer = useCallback((dealerId: string): MktListing[] => {
    return loadListings().filter(
      (l) => l.dealerId === dealerId && "available" in l.status,
    );
  }, []);

  const createListing = useCallback(
    (
      data: Omit<MktListing, "id" | "dealerId" | "timestamp" | "status">,
    ): MktListing => {
      // Prevent saving listings under anonymous/unresolved identity
      if (isAnonymous(principalId)) {
        throw new Error(
          "Identity not fully loaded. Please wait a moment and try again.",
        );
      }
      const listings = loadListings();
      const newListing: MktListing = {
        ...data,
        id: `listing_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        dealerId: principalId,
        status: { available: null },
        timestamp: BigInt(Date.now() * 1_000_000),
      };
      saveListings([...listings, newListing]);
      return newListing;
    },
    [principalId],
  );

  const updateListing = useCallback(
    (id: string, data: Partial<Omit<MktListing, "id" | "dealerId">>) => {
      const listings = loadListings();
      const updated = listings.map((l) =>
        l.id === id && l.dealerId === principalId ? { ...l, ...data } : l,
      );
      saveListings(updated);
    },
    [principalId],
  );

  const setListingStatus = useCallback(
    (id: string, status: MktListingStatus) => {
      const listings = loadListings();
      const updated = listings.map((l) =>
        l.id === id && l.dealerId === principalId ? { ...l, status } : l,
      );
      saveListings(updated);
    },
    [principalId],
  );

  const deleteListing = useCallback(
    (id: string) => {
      const listings = loadListings();
      saveListings(
        listings.filter((l) => !(l.id === id && l.dealerId === principalId)),
      );
    },
    [principalId],
  );

  const submitInquiry = useCallback(
    (
      listingId: string,
      data: {
        buyerName: string;
        buyerEmail: string;
        buyerPhone: string;
        message: string;
      },
    ) => {
      const listing = getListing(listingId);
      const inquiries = loadInquiries();
      const newInquiry: MktInquiry = {
        id: `inq_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        listingId,
        dealerId: listing?.dealerId ?? "",
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        message: data.message,
        timestamp: BigInt(Date.now() * 1_000_000),
      };
      saveInquiries([...inquiries, newInquiry]);
    },
    [getListing],
  );

  const getMyInquiries = useCallback((): MktInquiry[] => {
    if (isAnonymous(principalId)) return [];
    return loadInquiries().filter((i) => i.dealerId === principalId);
  }, [principalId]);

  return {
    principalId,
    isIdentityReady,
    getAllPublicListings,
    getMyListings,
    getListing,
    getListingsByDealer,
    createListing,
    updateListing,
    setListingStatus,
    deleteListing,
    submitInquiry,
    getMyInquiries,
  };
}
