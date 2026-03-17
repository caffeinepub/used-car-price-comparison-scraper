import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Car, Mail, MapPin, Phone } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
  description: string;
  images: Array<{ url: string; mimeType: string; size: bigint }>;
  status: Record<string, null>;
  timestamp: bigint;
};

const SAMPLE_LISTINGS: MktListing[] = [
  {
    id: "demo-1",
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
    description:
      "One-owner, clean Carfax. Loaded with safety features including lane departure warning, adaptive cruise control, and Toyota Safety Sense.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-2",
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
    description:
      "4x4, tow package, bed liner. Regular service history. Well maintained and ready for work or play.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-3",
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
    description:
      "Like new — barely driven. Full factory warranty remaining. Loaded with tech features.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-4",
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
    description:
      "Clean title, regular service history. Tow package, backup camera, and heated seats.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-5",
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
    description:
      "AWD, panoramic sunroof, heated and ventilated seats. Priced to sell quickly.",
    images: [],
    status: { available: null },
    timestamp: BigInt(0),
  },
  {
    id: "demo-6",
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
    description:
      "Sport package, premium Harman Kardon sound system, heated seats, and heads-up display. Immaculate condition.",
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

export default function MarketplaceListingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const { actor } = useActor();
  const [listing, setListing] = useState<MktListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIdx, setImageIdx] = useState(0);
  const [form, setForm] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!actor) {
      const found = SAMPLE_LISTINGS.find((l) => l.id === id);
      setListing(found || null);
      setLoading(false);
      return;
    }
    (actor as any)
      .getPublicMarketplaceListings()
      .then((all: MktListing[]) => {
        const found =
          all.find((l) => l.id === id) ||
          SAMPLE_LISTINGS.find((l) => l.id === id) ||
          null;
        setListing(found);
        setLoading(false);
      })
      .catch(() => {
        setListing(SAMPLE_LISTINGS.find((l) => l.id === id) || null);
        setLoading(false);
      });
  }, [actor, id]);

  const handleSubmit = async () => {
    if (!listing) return;
    setSubmitting(true);
    try {
      if (actor) {
        await (actor as any).submitInquiry(listing.id, form);
      }
      setSent(true);
    } catch (e) {
      console.error(e);
      setSent(true);
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  if (!listing)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Listing not found</p>
          <Button onClick={() => navigate({ to: "/marketplace" })}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );

  const isSold = !("available" in listing.status);

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
        <span className="font-semibold">
          {Number(listing.year)} {listing.make} {listing.model}
        </span>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-muted rounded-xl overflow-hidden h-72 md:h-96">
            {isSold && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <Badge className="text-2xl px-6 py-3 bg-red-600 text-white">
                  SOLD
                </Badge>
              </div>
            )}
            {listing.images.length > 0 ? (
              <img
                src={listing.images[imageIdx].url}
                alt="Vehicle"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            {listing.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1"
                  onClick={() => setImageIdx((i) => Math.max(0, i - 1))}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1"
                  onClick={() =>
                    setImageIdx((i) =>
                      Math.min(listing.images.length - 1, i + 1),
                    )
                  }
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {listing.images.map((img2, i) => (
                    <div
                      key={img2.url || String(i)}
                      className={`w-2 h-2 rounded-full ${
                        i === imageIdx ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.images.map((img, i) => (
                <button
                  type="button"
                  key={img.url || String(i)}
                  onClick={() => setImageIdx(i)}
                  className={`h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                    i === imageIdx ? "border-amber-500" : "border-transparent"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Year:</span>{" "}
                  <span className="font-medium">{Number(listing.year)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Make:</span>{" "}
                  <span className="font-medium">{listing.make}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Model:</span>{" "}
                  <span className="font-medium">{listing.model}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trim:</span>{" "}
                  <span className="font-medium">{listing.trim || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mileage:</span>{" "}
                  <span className="font-medium">
                    {Number(listing.mileage).toLocaleString()} mi
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Condition:</span>{" "}
                  <span className="font-medium">{listing.condition}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>{" "}
                  <span className="font-bold text-amber-500">
                    {fmtPrice(listing.price)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {isSold ? (
                    <Badge className="bg-red-500 text-white">Sold</Badge>
                  ) : (
                    <Badge className="bg-green-500 text-white">Available</Badge>
                  )}
                </div>
              </div>
              {listing.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    Description
                  </p>
                  <p className="text-sm">{listing.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dealer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {listing.dealerName && (
                <p className="font-semibold">{listing.dealerName}</p>
              )}
              {(listing.dealerCity || listing.dealerState) && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {listing.dealerCity}
                    {listing.dealerState ? `, ${listing.dealerState}` : ""}
                  </span>
                </div>
              )}
              {listing.dealerPhone && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <a
                    href={`tel:${listing.dealerPhone}`}
                    className="text-amber-500 hover:underline"
                  >
                    {listing.dealerPhone}
                  </a>
                </div>
              )}
              {listing.dealerEmail && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <a
                    href={`mailto:${listing.dealerEmail}`}
                    className="text-amber-500 hover:underline"
                  >
                    {listing.dealerEmail}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Dealer</CardTitle>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center py-4">
                  <div className="text-green-500 text-3xl mb-2">✓</div>
                  <p className="font-semibold">Inquiry Sent!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Your Name</Label>
                    <Input
                      value={form.buyerName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, buyerName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={form.buyerEmail}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, buyerEmail: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={form.buyerPhone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, buyerPhone: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Message</Label>
                    <Textarea
                      rows={3}
                      value={form.message}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, message: e.target.value }))
                      }
                      placeholder="I'm interested..."
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
