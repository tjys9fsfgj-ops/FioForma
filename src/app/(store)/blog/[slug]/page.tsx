import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/format';
import { renderMarkdown } from '@/lib/markdown';
import { prisma } from '@/lib/prisma';

type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  return prisma.page.findFirst({ where: { slug, kind: 'POST', status: 'PUBLISHED' } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post não encontrado' };

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.seoDescription || post.excerpt || undefined,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <nav aria-label="Trilha" className="text-[11.5px] text-muted">
          <Link href="/blog" className="hover:text-wine">
            Blog
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink/70">{post.title}</span>
        </nav>

        <header className="mt-6">
          <p className="eyebrow">{post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}</p>
          <h1 className="mt-3 text-[clamp(2rem,4.4vw,3.1rem)] leading-[1.06]">{post.title}</h1>
          {post.excerpt ? <p className="mt-4 text-[16px] leading-relaxed text-muted">{post.excerpt}</p> : null}
        </header>

        <div className="stitch mt-8" aria-hidden="true" />

        <div className="prose-atelier mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.contentMd) }} />

        <footer className="mt-12 border-t border-line pt-6">
          <Link href="/blog" className="text-[12.5px] text-wine underline underline-offset-4">
            ← Voltar para o blog
          </Link>
        </footer>
      </div>
    </article>
  );
}
