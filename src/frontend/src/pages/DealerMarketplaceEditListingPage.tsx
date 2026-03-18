import { useNavigate, useParams } from "@tanstack/react-router";
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

interface PhotoImage {
  url: string;
  mimeType: string;
  size: bigint;
}

export default function DealerMarketplaceEditListingPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const { actor } = useActor();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<PhotoImage[]>([]);
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
      .getMyMarketplaceListings()
      .then((data: any[]) => {
        const listing = data.find((l: any) => l.id === id);
        if (listing) {
          setForm({
            make: listing.make,
            model: listing.model,
            year: String(Number(listing.year)),
            mileage: String(Number(listing.mileage)),
            price: String(Number(listing.price)),
            trim: listing.trim,
            condition: listing.condition,
            description: listing.description,
            dealerPhone: listing.dealerPhone,
            dealerEmail: listing.dealerEmail,
            dealerCity: listing.dealerCity,
            dealerState: listing.dealerState,
          });
          // Pre-load existing images
          const existingImages: PhotoImage[] = (listing.images || []).map(
            (img: any) => ({
              url: img.url,
              mimeType: img.mimeType || "image/jpeg",
              size: img.size || BigInt(0),
            }),
          );
          setImages(existingImages);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setSaving(true);
    try {
      await (actor as any).updateMarketplaceListing(id, {
        make: form.make,
        model: form.model,
        year: BigInt(form.year || 0),
        mileage: BigInt(form.mileage || 0),
        price: BigInt(form.price || 0),
        trim: form.trim,
        condition: form.condition,
        description: form.description,
        images,
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );

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
        title="Edit Listing"
        description="Update your marketplace listing"
      />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <Label>Make *</Label>
              <Input required value={form.make} onChange={set("make")} />
            </div>
            <div>
              <Label>Model *</Label>
              <Input required value={form.model} onChange={set("model")} />
            </div>
            <div>
              <Label>Year *</Label>
              <Input
                required
                type="number"
                value={form.year}
                onChange={set("year")}
              />
            </div>
            <div>
              <Label>Mileage *</Label>
              <Input
                required
                type="number"
                value={form.mileage}
                onChange={set("mileage")}
              />
            </div>
            <div>
              <Label>Price ($) *</Label>
              <Input
                required
                type="number"
                value={form.price}
                onChange={set("price")}
              />
            </div>
            <div>
              <Label>Trim</Label>
              <Input value={form.trim} onChange={set("trim")} />
            </div>
            <div>
              <Label>Condition</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={form.condition}
                onChange={set("condition")}
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
            <CardTitle className="text-base">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
