import { prisma } from './prisma';

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Janela fixa por chave, persistida no banco para funcionar com várias instâncias.
 * Use chaves curtas e específicas: `login:<ip>`, `download:<userId>`, `checkout:<ip>`.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const current = await prisma.rateLimit.findUnique({ where: { key } });

    if (!current || current.expiresAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      });
      return { ok: true, remaining: limit - 1, retryAfterSeconds: windowSeconds };
    }

    if (current.count >= limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt.getTime() - now.getTime()) / 1000)),
      };
    }

    await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return {
      ok: true,
      remaining: limit - current.count - 1,
      retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt.getTime() - now.getTime()) / 1000)),
    };
  } catch {
    // Falha de infraestrutura não deve bloquear a compra; o limite é proteção extra.
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Limpeza oportunista de janelas vencidas (chamada pelo admin/relatórios). */
export async function pruneRateLimits(): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
