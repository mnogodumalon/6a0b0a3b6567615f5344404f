// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Kategorien {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    beschreibung?: string;
  };
}

export interface Eintraege {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kategorie?: string; // applookup -> URL zu 'Kategorien' Record
    notizen?: string;
    titel?: string;
  };
}

export const APP_IDS = {
  KATEGORIEN: '6a0b0a20df34525506d5a99b',
  EINTRAEGE: '6a0b0a2cab8cd0e3ed90fca8',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kategorien': {
    'name': 'string/text',
    'beschreibung': 'string/textarea',
  },
  'eintraege': {
    'kategorie': 'applookup/select',
    'notizen': 'string/textarea',
    'titel': 'string/text',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKategorien = StripLookup<Kategorien['fields']>;
export type CreateEintraege = StripLookup<Eintraege['fields']>;