import { Principal } from "@icp-sdk/core/principal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Building2, Car, Mail, MapPin, Phone } from "lucide-react";
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
import { useActor } from "../hooks/useActor";

type MktListing = {
  id: string;
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
  images: Array<{ url: string; mimeType: string; size: bigint }>;
  status: Record<string, null>;
  timestamp: bigint;
};

type DealerProfile = {
  dealerName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  bio: string;
};

const fmtPrice = (p: bigint) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(p));

export default function DealerStorefrontPage() {
  const navigate = useNavigate();
  const { dealerPrincipal: dealerPrincipalStr } = useParams({
    strict: false,
  }) as { dealerPrincipal: string };
  const { actor } = useActor();
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [listings, setListings] = useState<MktListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiryListing, setInquiryListing] = useState<MktListing | null>(null);
  const [form, setForm] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        const principal = Principal.fromText(dealerPrincipalStr);
        if (actor && typeof (actor as any).getDealerStorefront === "function") {
          const result = await (actor as any).getDealerStorefront(principal);
          setProfile(result.profile.length > 0 ? result.profile[0] : null);
          setListings(result.listings);
        }
      } catch {
        // Invalid principal or actor unavailable — show empty storefront
      } finally {
        setLoading(false);
      }
    };
    fetchStorefront();
  }, [actor, dealerPrincipalStr]);

  const handleSubmit = async () => {
    if (!inquiryListing) return;
    setSubmitting(true);
    try {
      if (actor && typeof (actor as any).submitInquiry === "function") {
        await (actor as any).submitInquiry(inquiryListing.id, form);
      }
      setSent(true);
    } catch (e) {
      console.error(e);
      setSent(true);
    }
    setSubmitting(false);
  };

  const openInquiry = (listing: MktListing) => {
    setInquiryListing(listing);
    setSent(false);
    setForm({ buyerName: "", buyerEmail: "", buyerPhone: "", message: "" });
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/marketplace" })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Marketplace
        </Button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-8 w-8 text-amber-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {profile?.dealerName || "Dealer Storefront"}
                </h1>
                {(profile?.city || profile?.state) && (
                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {profile.city}
                      {profile.state ? `, ${profile.state}` : ""}
                    </span>
                  </div>
                )}
                {profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {profile.bio}
                  </p>
                )}
                <div className="flex gap-4 mt-3">
                  {profile?.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-1 text-sm text-amber-500 hover:underline"
                    >
                      <Phone className="h-3 w-3" /> {profile.phone}
                    </a>
                  )}
                  {profile?.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-1 text-sm text-amber-500 hover:underline"
                    >
                      <Mail className="h-3 w-3" /> {profile.email}
                    </a>
                  )}
                </div>
              </div>
              <Badge variant="outline">
                {listings.length} listing{listings.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {listings.length === 0 ? (
          <div className="text-center py-16">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No listings yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Card
                key={listing.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <button
                  type="button"
                  className="relative h-44 bg-muted w-full"
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
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {"available" in listing.status ? (
                      <Badge className="bg-green-500 text-white text-xs">
                        Available
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white text-xs">
                        Sold
                      </Badge>
                    )}
                  </div>
                </button>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm">
                    {Number(listing.year)} {listing.make} {listing.model}
                  </h3>
                  <p className="text-xl font-bold text-amber-500">
                    {fmtPrice(listing.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(listing.mileage).toLocaleString()} mi &bull;{" "}
                    {listing.condition}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() =>
                        navigate({
                          to: "/marketplace/listing/$id",
                          params: { id: listing.id },
                        })
                      }
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-amber-500 hover:bg-amber-600 text-black"
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
          {sent ? (
            <div className="text-center py-6">
              <div className="text-green-500 text-4xl mb-2">✓</div>
              <p className="font-semibold">Inquiry Sent!</p>
              <Button className="mt-4" onClick={() => setInquiryListing(null)}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Your Name</Label>
                <Input
                  value={form.buyerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, buyerName: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.buyerEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, buyerEmail: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.buyerPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, buyerPhone: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                />
              </div>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                disabled={!form.buyerName || !form.buyerEmail || submitting}
                onClick={handleSubmit}
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
