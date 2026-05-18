import type { EnrichedEintraege } from '@/types/enriched';
import type { Eintraege, Kategorien } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface EintraegeMaps {
  kategorienMap: Map<string, Kategorien>;
}

export function enrichEintraege(
  eintraege: Eintraege[],
  maps: EintraegeMaps
): EnrichedEintraege[] {
  return eintraege.map(r => ({
    ...r,
    kategorieName: resolveDisplay(r.fields.kategorie, maps.kategorienMap, 'name'),
  }));
}
