import { checkDownloadRate, logDownload, verifyDownloadToken } from '@/lib/downloads';
import { getEntitlementWithFiles } from '@/lib/entitlements';
import { readMedia } from '@/lib/media';
import { prisma } from '@/lib/prisma';
import { hashIp } from '@/lib/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const token = new URL(request.url).searchParams.get('t');
  if (!token) return new Response('Acesso negado.', { status: 403 });

  const payload = await verifyDownloadToken(token);
  if (!payload || payload.fileId !== fileId) {
    return new Response('Link expirado ou inválido. Gere um novo na sua biblioteca.', { status: 403 });
  }

  const entitlement = await getEntitlementWithFiles(payload.entitlementId);
  if (!entitlement || entitlement.revokedAt) {
    return new Response('Você não tem acesso a este arquivo.', { status: 403 });
  }

  const subjectMatches =
    entitlement.email.toLowerCase() === payload.subject.toLowerCase() || entitlement.userId === payload.subject;
  if (!subjectMatches) {
    return new Response('Você não tem acesso a este arquivo.', { status: 403 });
  }

  const file = entitlement.product.files.find((item) => item.id === fileId);
  if (!file) return new Response('Arquivo não encontrado.', { status: 404 });

  const limit = await checkDownloadRate(entitlement.id, payload.subject);
  if (!limit.ok) return new Response(limit.message, { status: 429 });

  const media = await prisma.mediaAsset.findUnique({ where: { id: file.mediaId } });
  if (!media) return new Response('Arquivo indisponível.', { status: 404 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  try {
    const buffer = await readMedia(media);
    await logDownload({
      entitlementId: entitlement.id,
      fileId: file.id,
      ipHash: hashIp(ip),
      userAgent: request.headers.get('user-agent'),
    });

    const safeName = file.fileName.replace(/["\\\r\n]/g, '').slice(0, 120);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(buffer.length),
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[download] falha ao entregar arquivo', file.id, error);
    return new Response('Não foi possível entregar o arquivo. Tente novamente.', { status: 500 });
  }
}
