import React, { useState } from 'react';
import { useGetPriceAlerts } from '../hooks/useQueries';
import { useGetAllListings } from '../hooks/useQueries';
import { Bell, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function PriceAlertBanner() {
  const { data: alerts = [] } = useGetPriceAlerts();
  const { data: allListings = [] } = useGetAllListings();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const activeAlerts = (alerts as any[]).filter((alert: any) => !dismissed.has(Number(alert.id)));

  const alertsWithMatches = activeAlerts.map((alert: any) => {
    const matches = (allListings as any[]).filter(
      (l: any) =>
        l.make === alert.make &&
        l.model === alert.model &&
        !l.archived &&
        Number(l.price) <= Number(alert.targetPrice)
    );
    return { alert, matches };
  }).filter(({ matches }) => matches.length > 0);

  if (alertsWithMatches.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30">
      {alertsWithMatches.map(({ alert, matches }) => (
        <div
          key={String(alert.id)}
          className="flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-amber-500/5 transition-colors"
          onClick={() => navigate({ to: '/' })}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-300">
              <span className="font-semibold">{alert.make} {alert.model}</span>
              {' '}— {matches.length} listing{matches.length !== 1 ? 's' : ''} below{' '}
              ${Number(alert.targetPrice).toLocaleString()}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed((prev) => new Set([...prev, Number(alert.id)]));
            }}
            className="text-muted-foreground hover:text-foreground transition-colors ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
