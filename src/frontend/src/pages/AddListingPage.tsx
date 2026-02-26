import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateListing } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Car, ArrowLeft, Search, Loader2, CheckCircle2 } from 'lucide-react';

const CONDITIONS = ['New', 'Used', 'Certified Pre-Owned'];
const SOURCES = ['AutoTrader', 'Cars.com', 'CarGurus', 'Craigslist', 'Dealer Website', 'Other'];

interface ListingFormData {
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
  listingUrl: string;
  images: ExternalBlob[];
  timestamp: bigint;
  archived: boolean;
}

interface NHTSAResult {
  Variable: string;
  Value: string | null;
}

export default function AddListingPage() {
  const navigate = useNavigate();
  const createMutation = useCreateListing();

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    price: '',
    trim: '',
    engine: '',
    condition: 'Used',
    dealerName: '',
    source: 'Other',
    listingUrl: '',
  });
  const [vin, setVin] = useState('');
  const [vinError, setVinError] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinFilled, setVinFilled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const lookupVIN = async () => {
    const trimmedVin = vin.trim().toUpperCase();

    // Validate: exactly 17 alphanumeric characters
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(trimmedVin)) {
      setVinError('VIN must be exactly 17 alphanumeric characters (letters I, O, Q are not used).');
      return;
    }

    setVinError('');
    setVinLoading(true);

    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${trimmedVin}?format=json`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const results: NHTSAResult[] = data.Results ?? [];

      const get = (variable: string): string => {
        const match = results.find(r => r.Variable === variable);
        return match?.Value && match.Value !== 'null' && match.Value.trim() !== '' ? match.Value.trim() : '';
      };

      const make = get('Make');
      const model = get('Model');
      const year = get('Model Year');
      const trim = get('Trim');
      const displacement = get('Displacement (L)');
      const cylinders = get('Engine Number of Cylinders');

      // Build engine string
      let engine = '';
      if (displacement && cylinders) {
        engine = `${parseFloat(displacement).toFixed(1)}L ${cylinders}-Cyl`;
      } else if (displacement) {
        engine = `${parseFloat(displacement).toFixed(1)}L`;
      } else if (cylinders) {
        engine = `${cylinders}-Cyl`;
      }

      // Check we got at least make/model
      if (!make && !model) {
        setVinError('Could not decode VIN. Please check the number and try again.');
        return;
      }

      // Populate form fields
      if (make) setField('make', make);
      if (model) setField('model', model);
      if (year) setField('year', year);
      if (trim) setField('trim', trim);
      if (engine) setField('engine', engine);

      // Flash amber highlight for 2 seconds
      setVinFilled(true);
      setTimeout(() => setVinFilled(false), 2000);

      toast.success('VIN decoded successfully!');
    } catch {
      setVinError('VIN lookup failed. Please check your connection and try again.');
    } finally {
      setVinLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.make.trim()) newErrors.make = 'Make is required';
    if (!form.model.trim()) newErrors.model = 'Model is required';
    if (!form.year || isNaN(parseInt(form.year)) || parseInt(form.year) < 1900 || parseInt(form.year) > new Date().getFullYear() + 2) {
      newErrors.year = 'Valid year required';
    }
    if (!form.price || isNaN(parseInt(form.price)) || parseInt(form.price) <= 0) {
      newErrors.price = 'Valid price required';
    }
    if (form.mileage && (isNaN(parseInt(form.mileage)) || parseInt(form.mileage) < 0)) {
      newErrors.mileage = 'Valid mileage required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const listing: ListingFormData = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      make: form.make.trim(),
      model: form.model.trim(),
      year: BigInt(parseInt(form.year)),
      mileage: BigInt(parseInt(form.mileage) || 0),
      price: BigInt(parseInt(form.price)),
      trim: form.trim.trim() + (form.engine.trim() ? ` | ${form.engine.trim()}` : ''),
      condition: form.condition,
      dealerName: form.dealerName.trim(),
      source: form.source,
      listingUrl: form.listingUrl.trim(),
      images: [] as ExternalBlob[],
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      archived: false,
    };

    try {
      await createMutation.mutateAsync(listing);
      toast.success('Listing added successfully!');
      navigate({ to: '/' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Duplicate')) {
        toast.error('This listing already exists.');
      } else {
        toast.error('Failed to add listing. Please try again.');
      }
    }
  };

  const vinFilledClass = vinFilled ? 'ring-2 ring-amber-400 transition-all' : '';

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <Car className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-foreground font-display tracking-wide">Add Listing</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Manually add a car listing to your tracker.</p>
      </div>

      <form onSubmit={handleSubmit} className="card-panel space-y-5">

        {/* VIN Auto-Fill Section */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <Label className="text-foreground font-semibold text-sm">VIN Auto-Fill</Label>
            <span className="text-xs text-muted-foreground ml-1">— enter a VIN to auto-populate form fields</span>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm mb-1.5 block">
              VIN (Vehicle Identification Number)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter 17-character VIN"
                value={vin}
                onChange={e => {
                  setVin(e.target.value.toUpperCase());
                  if (vinError) setVinError('');
                }}
                maxLength={17}
                className={`bg-background border-steel-border flex-1 font-mono tracking-widest uppercase ${vinError ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={lookupVIN}
                disabled={vinLoading || !vin.trim()}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {vinLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Looking up…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Look Up VIN
                  </>
                )}
              </button>
            </div>
            {vinError && (
              <p className="text-red-400 text-xs mt-1.5 flex items-start gap-1">
                <span className="mt-0.5">⚠</span>
                {vinError}
              </p>
            )}
            {vinFilled && !vinError && (
              <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Form fields auto-populated from VIN
              </p>
            )}
          </div>
        </div>

        {/* Make / Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm mb-1.5 block">Make *</Label>
            <Input
              placeholder="e.g. Toyota"
              value={form.make}
              onChange={e => setField('make', e.target.value)}
              className={`bg-background border-steel-border ${errors.make ? 'border-red-500' : ''} ${vinFilled && form.make ? vinFilledClass : ''}`}
            />
            {errors.make && <p className="text-red-400 text-xs mt-1">{errors.make}</p>}
          </div>
          <div>
            <Label className="text-muted-foreground text-sm mb-1.5 block">Model *</Label>
            <Input
              placeholder="e.g. Camry"
              value={form.model}
              onChange={e => setField('model', e.target.value)}
              className={`bg-background border-steel-border ${errors.model ? 'border-red-500' : ''} ${vinFilled && form.model ? vinFilledClass : ''}`}
            />
            {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
          </div>
        </div>

        {/* Year / Trim */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm mb-1.5 block">Year *</Label>
            <Input
              placeholder="e.g. 2021"
              value={form.year}
              onChange={e => setField('year', e.target.value)}
              className={`bg-background border-steel-border ${errors.year ? 'border-red-500' : ''} ${vinFilled && form.year ? vinFilledClass : ''}`}
            />
            {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year}</p>}
          </div>
          <div>
            <Label className="text-muted-foreground text-sm mb-1.5 block">Trim</Label>
            <Input
              placeholder="e.g. SE, XLE, Sport"
              value={form.trim}
              onChange={e => setField('trim', e.target.value)}
              className={`bg-background border-steel-border ${vinFilled && form.trim ? vinFilledClass : ''}`}
            />
          </div>
        </div>

        {/* Engine */}
        <div>
          <Label className="text-muted-foreground text-sm mb-1.5 block">Engine</Label>
          <Input
            placeholder="e.g. 2.5L 4-Cylinder"
            value={form.engine}
            onChange={e => setField('engine', e.target.value)}
            className={`bg-background border-steel-border ${vinFilled && form.engine ? vinFilledClass : ''}`}
          />
        </div>

        {/* Price / Mileage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm mb-1.5 block">Price ($) *</Label>
            <Input
              placeholder="e.g. 25000"
              value={form.price}
              onChange={e => setField('price', e.target.value)}
              className={`bg-background border-steel-border ${errors.price ? 'border-red-500' : ''}`}
            />
            {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
          </div>
          <div>
            <Label className="text-muted-foreground text-sm mb-1.5 block">Mileage</Label>
            <Input
              placeholder="e.g. 45000"
              value={form.mileage}
              onChange={e => setField('mileage', e.target.value)}
              className={`bg-background border-steel-border ${errors.mileage ? 'border-red-500' : ''}`}
            />
            {errors.mileage && <p className="text-red-400 text-xs mt-1">{errors.mileage}</p>}
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground text-sm mb-1.5 block">Condition</Label>
          <div className="flex gap-2 flex-wrap">
            {CONDITIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setField('condition', c)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.condition === c
                    ? 'bg-amber-500 border-amber-500 text-black font-semibold'
                    : 'border-steel-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground text-sm mb-1.5 block">Source</Label>
          <div className="flex gap-2 flex-wrap">
            {SOURCES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setField('source', s)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.source === s
                    ? 'bg-amber-500 border-amber-500 text-black font-semibold'
                    : 'border-steel-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground text-sm mb-1.5 block">Dealer Name</Label>
          <Input
            placeholder="e.g. City Toyota"
            value={form.dealerName}
            onChange={e => setField('dealerName', e.target.value)}
            className="bg-background border-steel-border"
          />
        </div>

        <div>
          <Label className="text-muted-foreground text-sm mb-1.5 block">Listing URL</Label>
          <Input
            placeholder="https://..."
            value={form.listingUrl}
            onChange={e => setField('listingUrl', e.target.value)}
            className="bg-background border-steel-border"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/' })}
            className="flex-1 border-steel-border text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Adding...
              </span>
            ) : 'Add Listing'}
          </Button>
        </div>
      </form>
    </main>
  );
}
