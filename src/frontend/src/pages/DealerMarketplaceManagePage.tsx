import { useNavigate } from "@tanstack/react-router";
import { Car, CheckCircle, Edit, Plus, Trash2, XCircle } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useActor } from "../hooks/useActor";

type MktListing = {
  id: string;
  make: string;
  model: string;
  year: bigint;
  mileage: bigint;
  price: bigint;
  trim: string;
  condition: string;
  images: Array<{ url: string; mimeType: string; size: bigint }>;
  status: Record<string, null>;
  timestamp: bigint;
};

type Inquiry = {
  id: string;
  listingId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string;
  timestamp: bigint;
};

const fmtPrice = (p: bigint) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(p));

export default function DealerMarketplaceManagePage() {
  const navigate = useNavigate();
  const role = localStorage.getItem("atp_role");
  const { actor } = useActor();
  const [listings, setListings] = useState<MktListing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!actor) return;
    try {
      const [listingsData, inquiriesData] = await Promise.all([
        (actor as any).getMyMarketplaceListings(),
        (actor as any).getMyInquiries(),
      ]);
      setListings(listingsData);
      setInquiries(inquiriesData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [actor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStatus = async (listing: MktListing) => {
    if (!actor) return;
    setToggling(listing.id);
    const newStatus =
      "available" in listing.status ? { sold: null } : { available: null };
    try {
      await (actor as any).setMarketplaceListingStatus(listing.id, newStatus);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
    setToggling(null);
  };

  const deleteListing = async (id: string) => {
    if (!actor || !confirm("Delete this listing?")) return;
    try {
      await (actor as any).deleteMarketplaceListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (role !== "dealer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Dealer Access Required</p>
          <p className="text-muted-foreground mb-4">
            Please sign in as a dealer to manage listings.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader
        title="My Marketplace Listings"
        description="Manage your public vehicle listings and view buyer inquiries"
      />
      <div className="mt-4">
        <div className="flex justify-end mb-4">
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={() => navigate({ to: "/dealer/marketplace/new" })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Listing
          </Button>
        </div>

        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings">
              My Listings ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="inquiries">
              Inquiries ({inquiries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-4">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">
                Loading...
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-2">No listings yet</p>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => navigate({ to: "/dealer/marketplace/new" })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add First Listing
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-16 w-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {listing.images.length > 0 ? (
                          <img
                            src={listing.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {Number(listing.year)} {listing.make} {listing.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {listing.trim && `${listing.trim} • `}
                          {listing.condition} •{" "}
                          {Number(listing.mileage).toLocaleString()} mi
                        </p>
                        <p className="text-amber-500 font-bold">
                          {fmtPrice(listing.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {"available" in listing.status ? (
                          <Badge className="bg-green-500 text-white">
                            Available
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white">Sold</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={toggling === listing.id}
                          onClick={() => toggleStatus(listing)}
                        >
                          {"available" in listing.status ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1" /> Mark Sold
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" /> Mark
                              Available
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate({
                              to: `/dealer/marketplace/edit/${listing.id}`,
                            })
                          }
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteListing(listing.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="mt-4">
            {inquiries.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p>No inquiries yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => {
                  const related = listings.find((l) => l.id === inq.listingId);
                  return (
                    <Card key={inq.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{inq.buyerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {inq.buyerEmail}
                              {inq.buyerPhone ? ` • ${inq.buyerPhone}` : ""}
                            </p>
                            {related && (
                              <p className="text-xs text-amber-500 mt-1">
                                Re: {Number(related.year)} {related.make}{" "}
                                {related.model}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              Number(inq.timestamp) / 1_000_000,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm mt-2 border-t border-border pt-2">
                          {inq.message}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
