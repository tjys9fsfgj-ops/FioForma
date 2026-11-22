'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { slugify } from '@/lib/utils';

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') throw new Error('Acesso negado.');
  return user;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

async function uniqueSlug(
  model: 'collection' | 'category',
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || `item-${Date.now()}`;
  let candidate = root;
  let counter = 2;
  while (true) {
    const existing =
      model === 'collection'
        ? await prisma.collection.findUnique({ where: { slug: candidate } })
        : await prisma.category.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${counter++}`;
  }
}

export async function saveCollectionAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const name = text(formData, 'name');
  if (!name) redirect('/admin/colecoes?erro=nome');

  const data = {
    name,
    description: text(formData, 'description') || null,
    sortOrder: Number.parseInt(text(formData, 'sortOrder') || '0', 10) || 0,
    published: formData.get('published') === 'on',
  };

  if (id) {
    const slug = await uniqueSlug('collection', text(formData, 'slug') || name, id);
    await prisma.collection.update({ where: { id }, data: { ...data, slug } });
    await logAudit({ actorId: user.id, actorEmail: user.email, action: 'collection.update', entity: 'collection', entityId: id, meta: { name } });
  } else {
    const slug = await uniqueSlug('collection', text(formData, 'slug') || name);
    const created = await prisma.collection.create({ data: { ...data, slug } });
    await logAudit({ actorId: user.id, actorEmail: user.email, action: 'collection.create', entity: 'collection', entityId: created.id, meta: { name } });
  }

  revalidatePath('/admin/colecoes');
  revalidatePath('/colecoes');
  revalidatePath('/catalogo');
  redirect('/admin/colecoes?salvo=1');
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  await prisma.collection.delete({ where: { id } });
  await logAudit({ actorId: user.id, actorEmail: user.email, action: 'collection.delete', entity: 'collection', entityId: id });
  revalidatePath('/admin/colecoes');
  revalidatePath('/colecoes');
  redirect('/admin/colecoes?salvo=1');
}

export async function saveCategoryAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const name = text(formData, 'name');
  if (!name) redirect('/admin/categorias?erro=nome');

  const data = {
    name,
    description: text(formData, 'description') || null,
    sortOrder: Number.parseInt(text(formData, 'sortOrder') || '0', 10) || 0,
  };

  if (id) {
    const slug = await uniqueSlug('category', text(formData, 'slug') || name, id);
    await prisma.category.update({ where: { id }, data: { ...data, slug } });
    await logAudit({ actorId: user.id, actorEmail: user.email, action: 'category.update', entity: 'category', entityId: id, meta: { name } });
  } else {
    const slug = await uniqueSlug('category', text(formData, 'slug') || name);
    const created = await prisma.category.create({ data: { ...data, slug } });
    await logAudit({ actorId: user.id, actorEmail: user.email, action: 'category.create', entity: 'category', entityId: created.id, meta: { name } });
  }

  revalidatePath('/admin/categorias');
  revalidatePath('/catalogo');
  redirect('/admin/categorias?salvo=1');
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  await prisma.category.delete({ where: { id } });
  await logAudit({ actorId: user.id, actorEmail: user.email, action: 'category.delete', entity: 'category', entityId: id });
  revalidatePath('/admin/categorias');
  revalidatePath('/catalogo');
  redirect('/admin/categorias?salvo=1');
}
