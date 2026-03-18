import { useNavigate } from "@tanstack/react-router";
import { Car, MapPin, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useAppRoleContext } from "../hooks/useAppRoleContext";
import { useMarketplaceStore } from "../hooks/useMarketplaceStore";
import type { MktListing } from "../hooks/useMarketplaceStore";

const SAMPLE_LISTINGS: MktListing[] = [
  {
    id: "demo-1",
    dealerId: "demo",
    dealerName: "Premier Toyota of Dallas",
    dealerPhone: "(214) 555-0101",
    dealerEmail: "sales@premiertoyota.com",
    dealerCity: "Dallas",
    dealerState: "TX",
    make: "Toyota",
    model: "Camry",
    year: BigInt(2022),
    mileage: BigInt(18500),
    price: BigInt(24995),
    trim: "SE",
    condition: "Excellent",
    description: "One-owner, clean Carfax. Loaded with safety features.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-2",
    dealerId: "demo",
    dealerName: "Metro Ford",
    dealerPhone: "(303) 555-0202",
    dealerEmail: "sales@metroford.com",
    dealerCity: "Denver",
    dealerState: "CO",
    make: "Ford",
    model: "F-150",
    year: BigInt(2021),
    mileage: BigInt(32000),
    price: BigInt(38500),
    trim: "XLT",
    condition: "Good",
    description: "4x4, tow package, bed liner. Well maintained.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-3",
    dealerId: "demo",
    dealerName: "Honda World",
    dealerPhone: "(404) 555-0303",
    dealerEmail: "sales@hondaworld.com",
    dealerCity: "Atlanta",
    dealerState: "GA",
    make: "Honda",
    model: "CR-V",
    year: BigInt(2023),
    mileage: BigInt(8200),
    price: BigInt(31200),
    trim: "EX",
    condition: "Excellent",
    description: "Like new — barely driven. Full warranty remaining.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-4",
    dealerId: "demo",
    dealerName: "Lakeside Auto Group",
    dealerPhone: "(602) 555-0404",
    dealerEmail: "sales@lakesideauto.com",
    dealerCity: "Phoenix",
    dealerState: "AZ",
    make: "Chevrolet",
    model: "Silverado 1500",
    year: BigInt(2020),
    mileage: BigInt(45000),
    price: BigInt(34800),
    trim: "LT",
    condition: "Good",
    description: "Clean title, regular service history. Ready to work.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-5",
    dealerId: "demo",
    dealerName: "Hyundai of Orlando",
    dealerPhone: "(407) 555-0505",
    dealerEmail: "sales@hyundaiorlando.com",
    dealerCity: "Orlando",
    dealerState: "FL",
    make: "Hyundai",
    model: "Tucson",
    year: BigInt(2022),
    mileage: BigInt(22000),
    price: BigInt(26900),
    trim: "SEL",
    condition: "Good",
    description: "AWD, panoramic sunroof, heated seats. Priced to sell.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-6",
    dealerId: "demo",
    dealerName: "BMW of Las Vegas",
    dealerPhone: "(702) 555-0606",
    dealerEmail: "sales@bmwlv.com",
    dealerCity: "Las Vegas",
    dealerState: "NV",
    make: "BMW",
    model: "3 Series",
    year: BigInt(2021),
    mileage: BigInt(28000),
    price: BigInt(39500),
    trim: "330i",
    condition: "Excellent",
    description: "Sport package, premium sound, Harman Kardon. Immaculate.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
];

const fmtPrice = (p: bigint) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(p));

export default function PublicMarketplacePage() {
  const navigate = useNavigate();
  const role = useAppRoleContext();
  const marketplaceStore = useMarketplaceStore();
  const [listings, setListings] = useState<MktListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMake, setSearchMake] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [searchCondition, setSearchCondition] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [inquiryListing, setInquiryListing] = useState<MktListing | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    message: "",
  });
  const [inquirySent, setInquirySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const data = marketplaceStore.getAllPublicListings();
    setListings(data.length > 0 ? data : SAMPLE_LISTINGS);
    setLoading(false);
  }, [marketplaceStore.getAllPublicListings]);

  const filtered = listings.filter((l) => {
    if (searchMake && !l.make.toLowerCase().includes(searchMake.toLowerCase()))
      return false;
    if (
      searchModel &&
      !l.model.toLowerCase().includes(searchModel.toLowerCase())
    )
      return false;
    if (searchCondition && l.condition !== searchCondition) return false;
    if (maxPrice && Number(l.price) > Number(maxPrice)) return false;
    if (searchLocation) {
      const loc = `${l.dealerCity} ${l.dealerState}`.toLowerCase();
      if (!loc.includes(searchLocation.toLowerCase())) return false;
    }
    return true;
  });

  const handleSubmitInquiry = async () => {
    if (!inquiryListing) return;
    setSubmitting(true);
    marketplaceStore.submitInquiry(inquiryListing.id, inquiryForm);
    setInquirySent(true);
    setSubmitting(false);
  };

  const openInquiry = (listing: MktListing) => {
    setInquiryListing(listing);
    setInquirySent(false);
    setInquiryForm({
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
          onClick={() => navigate({ to: "/" })}
        >
          <Car className="h-6 w-6 text-amber-500" />
          <span className="font-bold text-lg">Auto Track Pro</span>
          <Badge
            variant="outline"
            className="text-amber-500 border-amber-500 text-xs"
          >
            Marketplace
          </Badge>
        </button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/" })}
          >
            Dashboard
          </Button>
          {role === "dealer" && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={() => navigate({ to: "/dealer/marketplace/new" })}
              data-ocid="marketplace.list_vehicle_button"
            >
              List Your Vehicle
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Input
              placeholder="Make"
              value={searchMake}
              onChange={(e) => setSearchMake(e.target.value)}
            />
            <Input
              placeholder="Model"
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
            />
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={searchCondition}
              onChange={(e) => setSearchCondition(e.target.value)}
            >
              <option value="">All Conditions</option>
              <option>New</option>
              <option>Used</option>
              <option>Certified Pre-Owned</option>
              <option>Excellent</option>
              <option>Good</option>
            </select>
            <Input
              placeholder="Max Price"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <Input
              placeholder="City or State"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
            />
          </div>
          {(searchMake ||
            searchModel ||
            searchCondition ||
            maxPrice ||
            searchLocation) && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filtered.length} results
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchMake("");
                  setSearchModel("");
                  setSearchCondition("");
                  setMaxPrice("");
                  setSearchLocation("");
                }}
              >
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">No listings found</p>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((listing) => (
              <Card
                key={listing.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <button
                  type="button"
                  className="relative h-48 bg-muted w-full block"
                  onClick={() =>
                    navigate({
                      to: "/marketplace/listing/$id",
                      params: { id: listing.id },
                    })
                  }
                >
                  {listing.images.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={`${listing.make} ${listing.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {"available" in listing.status ? (
                      <Badge className="bg-green-500 text-white">
                        Available
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white">Sold</Badge>
                    )}
                  </div>
                </button>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-base">
                    {Number(listing.year)} {listing.make} {listing.model}
                  </h3>
                  {listing.trim && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {listing.trim} &bull; {listing.condition}
                    </p>
                  )}
                  <p className="text-2xl font-bold text-amber-500 mb-2">
                    {fmtPrice(listing.price)}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {Number(listing.mileage).toLocaleString()} miles
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {listing.dealerCity}
                      {listing.dealerState ? `, ${listing.dealerState}` : ""}
                    </span>
                  </div>
                  {listing.dealerName && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {listing.dealerName}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        navigate({
                          to: "/marketplace/listing/$id",
                          params: { id: listing.id },
                        })
                      }
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                      onClick={() => openInquiry(listing)}
                    >
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!inquiryListing}
        onOpenChange={(o) => {
          if (!o) setInquiryListing(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Dealer</DialogTitle>
          </DialogHeader>
          {inquirySent ? (
            <div className="text-center py-6">
              <div className="text-green-500 text-4xl mb-2">✓</div>
              <p className="font-semibold">Inquiry Sent!</p>
              <p className="text-sm text-muted-foreground mt-1">
                The dealer will be in touch soon.
              </p>
              <Button className="mt-4" onClick={() => setInquiryListing(null)}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiryListing && (
                <p className="text-sm text-muted-foreground">
                  Re:{" "}
                  <span className="font-medium text-foreground">
                    {Number(inquiryListing.year)} {inquiryListing.make}{" "}
                    {inquiryListing.model} — {fmtPrice(inquiryListing.price)}
                  </span>
                </p>
              )}
              <div>
                <Label>Your Name</Label>
                <Input
                  value={inquiryForm.buyerName}
                  onChange={(e) =>
                    setInquiryForm((f) => ({ ...f, buyerName: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={inquiryForm.buyerEmail}
                  onChange={(e) =>
                    setInquiryForm((f) => ({
                      ...f,
                      buyerEmail: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input
                  value={inquiryForm.buyerPhone}
                  onChange={(e) =>
                    setInquiryForm((f) => ({
                      ...f,
                      buyerPhone: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  rows={3}
                  value={inquiryForm.message}
                  onChange={(e) =>
                    setInquiryForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="I'm interested in this vehicle..."
                />
              </div>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                disabled={
                  !inquiryForm.buyerName ||
                  !inquiryForm.buyerEmail ||
                  submitting
                }
                onClick={handleSubmitInquiry}
              >
                {submitting ? "Sending..." : "Send Inquiry"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
