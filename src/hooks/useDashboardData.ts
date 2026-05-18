import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kategorien, Eintraege } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [kategorien, setKategorien] = useState<Kategorien[]>([]);
  const [eintraege, setEintraege] = useState<Eintraege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [kategorienData, eintraegeData] = await Promise.all([
        LivingAppsService.getKategorien(),
        LivingAppsService.getEintraege(),
      ]);
      setKategorien(kategorienData);
      setEintraege(eintraegeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [kategorienData, eintraegeData] = await Promise.all([
          LivingAppsService.getKategorien(),
          LivingAppsService.getEintraege(),
        ]);
        setKategorien(kategorienData);
        setEintraege(eintraegeData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const kategorienMap = useMemo(() => {
    const m = new Map<string, Kategorien>();
    kategorien.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kategorien]);

  return { kategorien, setKategorien, eintraege, setEintraege, loading, error, fetchAll, kategorienMap };
}