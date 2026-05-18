import type { Eintraege } from './app';

export type EnrichedEintraege = Eintraege & {
  kategorieName: string;
};
