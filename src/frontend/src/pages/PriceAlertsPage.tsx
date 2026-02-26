import React, { useState } from 'react';
import {
  useGetPriceAlerts,
  useSetPriceAlert,
  useDeletePriceAlert,
  useGetAllListings,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Bell, Trash2, Plus, LogIn, TrendingDown } from 'lucide-react';

interface AlertCardProps {
  alert: any;
  allListings: any[];
  onDelete: (id: bigint) => void;
}

function AlertCard({ alert, allListings, onDelete }: AlertCardProps) {
  const listings = allListings.filter(
    (l: any) =>
      l.make === alert.make &&
      l.model === alert.model &&
      !l.archived &&
      Number(l.price) <= Number(alert.targetPrice)
  );

  return (
    <div className="card-panel">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-foreground">{alert.make} {alert.model}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-red-400"
          onClick={() => onDelete(alert.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Target price:</span>
        <span className="text-sm font-semibold text-amber-400">
          ${Number(alert.targetPrice).toLocaleString()}
        </span>
      </div>

      {listings.length > 0 ? (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">
              {listings.length} listing{listings.length !== 1 ? 's' : ''} below target
            </span>
          </div>
          <div className="space-y-1.5">
            {listings.slice(0, 3).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between text-xs p-2 rounded bg-background border border-steel-border">
                <span className="text-muted-foreground">{l.dealerName || l.source}</span>
                <span className="font-semibold text-emerald-400">${Number(l.price).toLocaleString()}</span>
              </div>
            ))}
            {listings.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">+{listings.length - 3} more</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No listings below target price yet.</p>
      )}
    </div>
  );
}

export default function PriceAlertsPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: alerts = [], isLoading } = useGetPriceAlerts();
  const { data: allListings = [] } = useGetAllListings();
  const setAlertMutation = useSetPriceAlert();
  const deleteMutation = useDeletePriceAlert();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSetAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !targetPrice) return;
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid target price');
      return;
    }
    try {
      await setAlertMutation.mutateAsync({ make: make.trim(), model: model.trim(), targetPrice: price });
      toast.success(`Alert set for ${make} ${model} at $${price.toLocaleString()}`);
      setMake('');
      setModel('');
      setTargetPrice('');
      setShowForm(false);
    } catch {
      toast.error('Failed to set price alert');
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Alert deleted');
    } catch {
      toast.error('Failed to delete alert');
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <LogIn className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2 font-display">Sign In Required</h1>
        <p className="text-muted-foreground text-sm">Please sign in to manage price alerts.</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display tracking-wide">Price Alerts</h1>
            <p className="text-muted-foreground text-sm">Get notified when listings drop below your target price.</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Alert
        </Button>
      </div>

      {/* Add Alert Form */}
      {showForm && (
        <form onSubmit={handleSetAlert} className="card-panel mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">New Price Alert</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Make *</Label>
              <Input
                placeholder="e.g. Toyota"
                value={make}
                onChange={e => setMake(e.target.value)}
                required
                className="bg-background border-steel-border text-sm h-8"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Model *</Label>
              <Input
                placeholder="e.g. Camry"
                value={model}
                onChange={e => setModel(e.target.value)}
                required
                className="bg-background border-steel-border text-sm h-8"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Target Price ($) *</Label>
              <Input
                type="number"
                placeholder="e.g. 20000"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                required
                min={1}
                className="bg-background border-steel-border text-sm h-8"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={setAlertMutation.isPending}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {setAlertMutation.isPending ? 'Saving…' : 'Set Alert'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
              className="border-steel-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Alerts Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-panel h-40 animate-pulse bg-surface" />
          ))}
        </div>
      ) : (alerts as any[]).length === 0 ? (
        <div className="card-panel text-center py-12">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-foreground font-medium mb-1">No price alerts set</p>
          <p className="text-muted-foreground text-sm">Add an alert to be notified when listings drop below your target price.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(alerts as any[]).map((alert: any) => (
            <AlertCard
              key={String(alert.id)}
              alert={alert}
              allListings={allListings as any[]}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </main>
  );
}
