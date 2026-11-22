'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/audit';
import { getCurrentUser } from '@/lib/session';
import { updateSettings } from '@/lib/settings';

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') throw new Error('Acesso negado.');

  const read = (key: string) => String(formData.get(key) ?? '').trim();

  await updateSettings({
    storeName: read('storeName'),
    tagline: read('tagline'),
    whatsapp: read('whatsapp'),
    email: read('email'),
    instagram: read('instagram'),
    announcement: read('announcement'),
    supportHours: read('supportHours'),
    freeUpdatesNote: read('freeUpdatesNote'),
  });

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'settings.update',
    entity: 'setting',
    meta: { storeName: read('storeName') },
  });

  revalidatePath('/');
  revalidatePath('/admin/configuracoes');
  redirect('/admin/configuracoes?ok=1');
}
