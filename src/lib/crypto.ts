import { createHash, randomBytes } from 'node:crypto';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Hash de IP para logs, sem guardar o endereço em claro (LGPD). */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.AUTH_SECRET ?? 'fioforma';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 40);
}

export function orderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `FF-${stamp}${suffix}`;
}
