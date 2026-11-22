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

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || `pagina-${Date.now()}`;
  let candidate = root;
  let counter = 2;
  while (true) {
    const existing = await prisma.page.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${counter++}`;
  }
}

export async function savePageAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const title = text(formData, 'title');
  const contentMd = text(formData, 'contentMd');
  const kind = text(formData, 'kind') === 'POST' ? 'POST' : 'PAGE';
  const status = text(formData, 'status') === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';

  if (!title || !contentMd) {
    redirect(id ? `/admin/paginas/${id}?erro=dados` : '/admin/paginas/novo?erro=dados');
  }

  const data = {
    title,
    kind: kind as 'PAGE' | 'POST',
    status: status as 'DRAFT' | 'PUBLISHED',
    excerpt: text(formData, 'excerpt') || null,
    contentMd,
    seoTitle: text(formData, 'seoTitle') || null,
    seoDescription: text(formData, 'seoDescription') || null,
    publishedAt: status === 'PUBLISHED' ? new Date() : null,
  };

  const slug = await uniqueSlug(text(formData, 'slug') || title, id || undefined);

  let pageId = id;
  if (id) {
    const previous = await prisma.page.findUnique({ where: { id } });
    await prisma.page.update({
      where: { id },
      data: { ...data, slug, publishedAt: previous?.publishedAt ?? data.publishedAt },
    });
    await logAudit({ actorId: user.id, actorEmail: user.email, action: 'page.update', entity: 'page', entityId: id, meta: { title, slug } });
  } else {
    const created = await prisma.page.create({ data: { ...data, slug } });
    pageId = created.id;
    await logAudit({ actorId: user.id, actorEmail: user.email, action: 'page.create', entity: 'page', entityId: created.id, meta: { title, slug } });
  }

  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath(`/${slug}`);
  revalidatePath(`/blog/${slug}`);
  redirect(`/admin/paginas/${pageId}?ok=1`);
}

export async function deletePageAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) redirect('/admin/paginas');

  await prisma.page.delete({ where: { id } });
  await logAudit({ actorId: user.id, actorEmail: user.email, action: 'page.delete', entity: 'page', entityId: id, meta: { title: page.title } });
  revalidatePath('/blog');
  revalidatePath(`/${page.slug}`);
  redirect('/admin/paginas?ok=1');
}

export async function togglePageStatusAction(formData: FormData): Promise<void> {
  const user = await guard();
  const id = text(formData, 'id');
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) redirect('/admin/paginas');

  const nextStatus = page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  await prisma.page.update({
    where: { id },
    data: { status: nextStatus, publishedAt: nextStatus === 'PUBLISHED' ? page.publishedAt ?? new Date() : page.publishedAt },
  });
  await logAudit({ actorId: user.id, actorEmail: user.email, action: 'page.toggle', entity: 'page', entityId: id, meta: { status: nextStatus } });
  revalidatePath('/blog');
  redirect('/admin/paginas?ok=1');
}
