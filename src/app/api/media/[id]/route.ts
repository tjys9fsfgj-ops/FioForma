import { prisma } from '@/lib/prisma';
import { readMedia } from '@/lib/media';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await prisma.mediaAsset.findUnique({ where: { id } });

  if (!media || media.visibility !== 'PUBLIC') {
    return new Response('Imagem não encontrada.', { status: 404 });
  }

  try {
    const buffer = await readMedia(media);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': String(buffer.length),
        // O id do asset muda quando o conteúdo muda: seguro para cache longo.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[media] falha ao ler arquivo', id, error);
    return new Response('Imagem indisponível.', { status: 404 });
  }
}
