'use server';

import { z } from 'zod';
import { sendContactNotification } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/session';

export type ContactState = { status: 'idle' | 'success' | 'error'; message?: string; fieldErrors?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, 'Escreva pelo menos 10 caracteres.').max(4000),
  privacy: z.string().refine((value) => value === 'on', { message: 'É preciso aceitar a política de privacidade.' }),
});

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject') ?? '',
    message: formData.get('message'),
    privacy: formData.get('privacy'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = String(issue.path[0] ?? 'form');
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    });
    return { status: 'error', message: 'Confira os campos destacados.', fieldErrors };
  }

  const ip = await getClientIp();
  const limit = await rateLimit(`contact:${ip ?? 'anon'}`, 5, 60 * 60);
  if (!limit.ok) return { status: 'error', message: 'Muitas mensagens em pouco tempo. Tente mais tarde.' };

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    },
  });

  await sendContactNotification({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  return {
    status: 'success',
    message: 'Mensagem enviada. Respondemos em até dois dias úteis, no e-mail informado.',
  };
}
