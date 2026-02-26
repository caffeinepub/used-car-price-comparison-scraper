import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Car, PlusCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingEmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
        <Car className="w-10 h-10 text-amber-400" />
      </div>

      {/* Headline */}
      <h2 className="text-2xl font-bold text-foreground font-display mb-3">
        No listings yet
      </h2>

      {/* Description */}
      <p className="text-muted-text text-sm max-w-md mb-2 leading-relaxed">
        Start building your car market database. Add listings manually one by one, or import a
        CSV file to bulk-load hundreds of vehicles at once.
      </p>
      <p className="text-muted-text/60 text-xs max-w-sm mb-8">
        Once you have listings, you'll see price statistics, deal scores, and market trends right
        here.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={() => navigate({ to: '/add' })}
          className="bg-amber-500 hover:bg-amber-400 text-surface font-semibold px-6 py-2.5 gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Add Your First Listing
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/import' })}
          className="border-steel-border text-muted-text hover:text-foreground hover:border-amber-500/50 px-6 py-2.5 gap-2"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
      </div>

      {/* Hint */}
      <p className="mt-8 text-xs text-muted-text/40">
        Tip: Use the CSV import to add multiple listings from AutoTrader, Cars.com, or any source
        at once.
      </p>
    </div>
  );
}
