import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { SeedStamp } from '../src/lib/seed-guards';

/** Carimbo do último conteúdo aplicado pelo seed, guardado em Setting("seed.<chave>"). */
export async function readStamp(prisma: PrismaClient, key: string): Promise<SeedStamp | null> {
  const row = await prisma.setting.findUnique({ where: { key: `seed.${key}` } });
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as { hash: string; at: string };
    return { hash: parsed.hash, at: new Date(parsed.at) };
  } catch {
    return null;
  }
}

export async function writeStamp(prisma: PrismaClient, key: string, hash: string): Promise<void> {
  const value = JSON.stringify({ hash, at: new Date().toISOString() });
  await prisma.setting.upsert({ where: { key: `seed.${key}` }, create: { key: `seed.${key}`, value }, update: { value } });
}

export function contentHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
