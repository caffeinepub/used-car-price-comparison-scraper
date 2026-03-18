import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
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
import { useAppRoleContext, useRoleLoading } from "../hooks/useAppRoleContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function DealerProfilePage() {
  const navigate = useNavigate();
  const role = useAppRoleContext();
  const roleLoading = useRoleLoading();
  const { isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    dealerName: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    bio: "",
  });

  useEffect(() => {
    if (!actor) return;
    (actor as any)
      .getMyDealerProfile()
      .then((result: unknown[]) => {
        const p = result.length > 0 ? (result[0] as any) : null;
        if (p)
          setForm({
            dealerName: p.dealerName,
            phone: p.phone,
            email: p.email,
            city: p.city,
            state: p.state,
            bio: p.bio,
          });
      })
      .catch(() => {});
  }, [actor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setSaving(true);
    try {
      await (actor as any).saveDealerProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  // Wait for identity/role to fully resolve before showing access wall
  if (isInitializing || roleLoading || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <PageHeader
        title="Dealer Profile"
        description="Your public storefront profile shown to buyers"
      />
      <form onSubmit={handleSubmit} className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Storefront Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Dealer / Business Name *</Label>
              <Input
                required
                value={form.dealerName}
                onChange={set("dealerName")}
                placeholder="ABC Motors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="dealer@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={set("city")}
                  placeholder="Dallas"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={set("state")}
                  placeholder="TX"
                />
              </div>
            </div>
            <div>
              <Label>Bio / About</Label>
              <Textarea
                rows={3}
                value={form.bio}
                onChange={set("bio")}
                placeholder="Tell buyers about your dealership..."
              />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex items-center gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {saving ? "Saving..." : "Save Profile"}
          </Button>
          {saved && (
            <span className="text-green-500 text-sm">Profile saved!</span>
          )}
        </div>
      </form>
    </div>
  );
}
