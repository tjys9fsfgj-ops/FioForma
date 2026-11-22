import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Notas de ateliê: modelagem, tecidos, impressão de moldes e bastidores da costura.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage() {
  const posts = await prisma.page.findMany({
    where: { kind: 'POST', status: 'PUBLISHED' },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Blog</p>
        <h1 className="mt-3 text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.05]">Notas de ateliê.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Modelagem, tecido, impressão e os detalhes que fazem a peça cair bem. Sem pressa, como uma boa
          costura.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-2xl mt-12 border border-line bg-white px-6 py-12 text-center text-[14px] text-muted">
          O blog está sendo preparado. Enquanto isso, veja os{' '}
          <Link href="/guias" className="text-forest underline underline-offset-4">
            guias de impressão
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="group border-t border-line pt-5">
              <p className="eyebrow text-[10px]">
                {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
              </p>
              <h2 className="mt-2 font-serif text-[22px] leading-snug text-ink group-hover:text-forest">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              {post.excerpt ? (
                <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-muted">{post.excerpt}</p>
              ) : null}
              <Link href={`/blog/${post.slug}`} className="mt-3 inline-block text-[12px] text-forest underline underline-offset-4">
                Ler
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
