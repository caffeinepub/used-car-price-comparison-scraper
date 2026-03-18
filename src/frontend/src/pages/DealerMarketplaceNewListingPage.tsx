import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import PhotoUploader from "../components/PhotoUploader";
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
import { useAppRoleContext } from "../hooks/useAppRoleContext";
import { useMarketplaceStore } from "../hooks/useMarketplaceStore";

interface PhotoImage {
  url: string;
  mimeType: string;
  size: bigint;
}

export default function DealerMarketplaceNewListingPage() {
  const navigate = useNavigate();
  const role = useAppRoleContext();
  const { actor } = useActor();
  const marketplaceStore = useMarketplaceStore();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<PhotoImage[]>([]);
  const [dealerName, setDealerName] = useState("My Dealership");

  // VIN decoder state
  const [vin, setVin] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    mileage: "",
    price: "",
    trim: "",
    condition: "Used",
    description: "",
    dealerPhone: "",
    dealerEmail: "",
    dealerCity: "",
    dealerState: "",
  });

  useEffect(() => {
    if (!actor) return;
    (actor as any)
      .getMyDealerProfile()
      .then((result: unknown[]) => {
        const p = result.length > 0 ? (result[0] as any) : null;
        if (p) {
          if (p.dealerName || p.storeName || p.name) {
            setDealerName(p.dealerName || p.storeName || p.name);
          }
          setForm((f) => ({
            ...f,
            dealerPhone: p.phone || "",
            dealerEmail: p.email || "",
            dealerCity: p.city || "",
            dealerState: p.state || "",
          }));
        }
      })
      .catch(() => {});
  }, [actor]);

  const decodeVin = async () => {
    if (vin.length !== 17) return;
    setVinLoading(true);
    setVinError("");
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`,
      );
      const data = await res.json();
      const results: { Variable: string; Value: string }[] = data.Results || [];
      const get = (name: string) =>
        results.find((r) => r.Variable === name)?.Value || "";

      const make = get("Make");
      const model = get("Model");
      const year = get("Model Year");
      const trim = get("Trim");

      if (!make && !model) {
        setVinError("VIN not recognized. Please check and try again.");
      } else {
        setForm((f) => ({
          ...f,
          make: make || f.make,
          model: model || f.model,
          year: year || f.year,
          trim: trim || f.trim,
        }));
      }
    } catch {
      setVinError("Failed to decode VIN. Please try again.");
    }
    setVinLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      marketplaceStore.createListing({
        make: form.make,
        model: form.model,
        year: BigInt(form.year || 0),
        mileage: BigInt(form.mileage || 0),
        price: BigInt(form.price || 0),
        trim: form.trim,
        condition: form.condition,
        description: form.description,
        images,
        dealerName,
        dealerPhone: form.dealerPhone,
        dealerEmail: form.dealerEmail,
        dealerCity: form.dealerCity,
        dealerState: form.dealerState,
      });
      navigate({ to: "/dealer/marketplace" });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (role !== "dealer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Dealer Access Required</p>
          <Button onClick={() => navigate({ to: "/" })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const set =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader
        title="Add Marketplace Listing"
        description="List a vehicle for sale on the public marketplace"
      />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* VIN Decoder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">VIN Decoder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="vin-input">VIN (optional)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="vin-input"
                  value={vin}
                  onChange={(e) => {
                    setVin(e.target.value.toUpperCase());
                    setVinError("");
                  }}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="font-mono tracking-wider"
                  data-ocid="new_listing.vin.input"
                />
                <Button
                  type="button"
                  disabled={vin.length !== 17 || vinLoading}
                  onClick={decodeVin}
                  className="shrink-0 bg-amber-500 hover:bg-amber-600 text-black"
                  data-ocid="new_listing.vin.decode_button"
                >
                  {vinLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Decode VIN"
                  )}
                </Button>
              </div>
              {vinError && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="new_listing.vin.error_state"
                >
                  {vinError}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Auto-fills make, model, year, and trim from NHTSA database.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <Label>Make *</Label>
              <Input
                required
                value={form.make}
                onChange={set("make")}
                placeholder="Toyota"
                data-ocid="new_listing.make.input"
              />
            </div>
            <div>
              <Label>Model *</Label>
              <Input
                required
                value={form.model}
                onChange={set("model")}
                placeholder="Camry"
                data-ocid="new_listing.model.input"
              />
            </div>
            <div>
              <Label>Year *</Label>
              <Input
                required
                type="number"
                value={form.year}
                onChange={set("year")}
                placeholder="2021"
                data-ocid="new_listing.year.input"
              />
            </div>
            <div>
              <Label>Mileage *</Label>
              <Input
                required
                type="number"
                value={form.mileage}
                onChange={set("mileage")}
                placeholder="35000"
                data-ocid="new_listing.mileage.input"
              />
            </div>
            <div>
              <Label>Price ($) *</Label>
              <Input
                required
                type="number"
                value={form.price}
                onChange={set("price")}
                placeholder="24999"
                data-ocid="new_listing.price.input"
              />
            </div>
            <div>
              <Label>Trim</Label>
              <Input
                value={form.trim}
                onChange={set("trim")}
                placeholder="SE"
                data-ocid="new_listing.trim.input"
              />
            </div>
            <div>
              <Label>Condition</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={form.condition}
                onChange={set("condition")}
                data-ocid="new_listing.condition.select"
              >
                <option>New</option>
                <option>Used</option>
                <option>Certified Pre-Owned</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={set("description")}
                placeholder="Describe the vehicle..."
                data-ocid="new_listing.description.textarea"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUploader images={images} onChange={setImages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Dealership Name</Label>
              <Input
                value={dealerName}
                onChange={(e) => setDealerName(e.target.value)}
                placeholder="My Dealership"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.dealerPhone} onChange={set("dealerPhone")} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.dealerEmail}
                onChange={set("dealerEmail")}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.dealerCity} onChange={set("dealerCity")} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.dealerState} onChange={set("dealerState")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate({ to: "/dealer/marketplace" })}
            data-ocid="new_listing.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
            data-ocid="new_listing.submit_button"
          >
            {saving ? "Publishing..." : "Publish Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
