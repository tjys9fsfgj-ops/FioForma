import { cache } from 'react';
import { brand } from '@/config/brand';
import { prisma } from './prisma';

export type StoreSettings = {
  storeName: string;
  tagline: string;
  whatsapp: string;
  email: string;
  instagram: string;
  announcement: string;
  supportHours: string;
  freeUpdatesNote: string;
};

const defaults: StoreSettings = {
  storeName: brand.name,
  tagline: brand.tagline,
  whatsapp: brand.support.whatsapp,
  email: brand.support.email,
  instagram: brand.support.instagram,
  announcement: '',
  supportHours: brand.support.hours,
  freeUpdatesNote: 'Re-download ilimitado na sua biblioteca.',
};

const KEYS: Record<keyof StoreSettings, string> = {
  storeName: 'store.name',
  tagline: 'store.tagline',
  whatsapp: 'store.whatsapp',
  email: 'store.email',
  instagram: 'store.instagram',
  announcement: 'store.announcement',
  supportHours: 'store.supportHours',
  freeUpdatesNote: 'store.freeUpdatesNote',
};

export const getSettings = cache(async (): Promise<StoreSettings> => {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: Object.values(KEYS) } },
    });
    const map = new Map(rows.map((row) => [row.key, row.value]));
    const result = { ...defaults };
    (Object.keys(KEYS) as (keyof StoreSettings)[]).forEach((field) => {
      const value = map.get(KEYS[field]);
      if (value !== undefined && value !== '') result[field] = value;
    });
    return result;
  } catch {
    return defaults;
  }
});

export async function updateSettings(input: Partial<StoreSettings>): Promise<void> {
  const entries = (Object.keys(KEYS) as (keyof StoreSettings)[])
    .filter((field) => input[field] !== undefined)
    .map((field) => ({
      key: KEYS[field],
      value: String(input[field] ?? '').trim(),
    }));

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.setting.upsert({
        where: { key: entry.key },
        create: entry,
        update: { value: entry.value },
      }),
    ),
  );
}

export const settingsDefaults = defaults;
