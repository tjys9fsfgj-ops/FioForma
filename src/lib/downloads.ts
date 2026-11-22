import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';
import { rateLimit } from './rate-limit';

const TOKEN_TTL_SECONDS = 10 * 60;
const AUDIENCE = 'fioforma:download';

function secretKey(): Uint8Array {
  const secret =
    process.env.DOWNLOAD_TOKEN_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.MANUS_JWT_SECRET ||
    'fioforma-dev-download-secret';
  return new TextEncoder().encode(secret);
}

export type DownloadTokenPayload = {
  entitlementId: string;
  fileId: string;
  subject: string;
};

export async function createDownloadToken(payload: DownloadTokenPayload): Promise<string> {
  return new SignJWT({ eid: payload.entitlementId, fid: payload.fileId, sub: payload.subject })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyDownloadToken(token: string): Promise<DownloadTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { audience: AUDIENCE });
    if (typeof payload.eid !== 'string' || typeof payload.fid !== 'string' || typeof payload.sub !== 'string') {
      return null;
    }
    return { entitlementId: payload.eid, fileId: payload.fid, subject: payload.sub };
  } catch {
    return null;
  }
}

export const DOWNLOAD_LIMIT_PER_HOUR = 40;
export const DOWNLOAD_LIMIT_PER_DAY = 120;

export async function checkDownloadRate(entitlementId: string, subject: string) {
  const hourly = await rateLimit(`dl:${entitlementId}`, DOWNLOAD_LIMIT_PER_HOUR, 60 * 60);
  if (!hourly.ok) return { ok: false, message: 'Muitos downloads em pouco tempo. Tente novamente em alguns minutos.' };

  const daily = await rateLimit(`dl-day:${subject}`, DOWNLOAD_LIMIT_PER_DAY, 60 * 60 * 24);
  if (!daily.ok) return { ok: false, message: 'Limite diário de downloads atingido. Fale com o suporte.' };

  return { ok: true };
}

export async function logDownload(input: {
  entitlementId: string;
  fileId: string;
  ipHash?: string | null;
  userAgent?: string | null;
}) {
  await prisma.downloadLog.create({
    data: {
      entitlementId: input.entitlementId,
      fileId: input.fileId,
      ipHash: input.ipHash ?? null,
      userAgent: input.userAgent?.slice(0, 250) ?? null,
    },
  });
}
