'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/session';

export type NewsletterState = { status: 'idle' | 'success' | 'error'; message?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
});

export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'E-mail inválido.' };
  }

  const ip = await getClientIp();
  const limit = await rateLimit(`newsletter:${ip ?? 'anon'}`, 5, 60 * 60);
  if (!limit.ok) {
    return { status: 'error', message: 'Muitas tentativas. Tente novamente mais tarde.' };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, source: 'site' },
    update: {},
  });

  return {
    status: 'success',
    message: 'Pronto. Você vai receber os lançamentos e as notas de ateliê.',
  };
}
