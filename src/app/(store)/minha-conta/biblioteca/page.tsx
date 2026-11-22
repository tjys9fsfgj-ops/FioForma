import Link from 'next/link';
import { PatternPlaceholder } from '@/components/product/pattern-placeholder';
import { createDownloadToken } from '@/lib/downloads';
import { getLibrary } from '@/lib/entitlements';
import { formatDate, formatLabels } from '@/lib/format';
import { requireUser } from '@/lib/session';

export default async function LibraryPage() {
  const user = await requireUser('/minha-conta/biblioteca');
  const library = await getLibrary(user);

  const items = await Promise.all(
    library.map(async (item) => ({
      ...item,
      files: await Promise.all(
        item.product.files.map(async (file) => ({
          ...file,
          token: await createDownloadToken({
            entitlementId: item.id,
            fileId: file.id,
            subject: user.email,
          }),
        })),
      ),
    })),
  );

  return (
    <div>
      <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">Meus moldes</h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
        Todos os arquivos que você comprou, para baixar quantas vezes quiser. Os links expiram em 10
        minutos por segurança — se vencer, recarregue esta página.
      </p>

      {items.length === 0 ? (
        <div className="rounded-2xl mt-8 border border-line bg-paper px-6 py-12 text-center">
          <p className="font-serif text-[22px] text-wine">Nada por aqui ainda.</p>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
            Seus moldes aparecem nesta página depois da confirmação do pagamento. Se você acabou de pagar,
            aguarde alguns instantes e atualize.
          </p>
          <Link href="/catalogo" className="rounded-full mt-5 inline-block border border-wine bg-wine px-5 py-2.5 text-[13px] text-paper">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-paper">
              <div className="flex gap-4 p-4 sm:gap-6 sm:p-5">
                <Link
                  href={`/produto/${item.product.slug}`}
                  className="rounded-2xl relative aspect-[4/5] w-20 shrink-0 overflow-hidden border border-line bg-[#EFEDE6] sm:w-24"
                >
                  {item.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/media/${item.product.images[0].mediaId}`}
                      alt={item.product.images[0].alt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PatternPlaceholder label="Molde" seed={0} />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/produto/${item.product.slug}`} className="font-serif text-[19px] leading-snug text-ink hover:text-wine">
                    {item.product.name}
                  </Link>
                  <p className="mt-1 text-[11.5px] text-muted">
                    Compra em {formatDate(item.createdAt)}
                    {item.order ? ` · pedido ${item.order.number}` : ''}
                  </p>

                  {item.files.length === 0 ? (
                    <p className="mt-3 text-[12.5px] text-muted">
                      Os arquivos deste molde estão sendo preparados. Fale com o suporte se demorar.
                    </p>
                  ) : (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.files.map((file) => (
                        <li key={file.id}>
                          <a
                            href={`/api/download/${file.id}?t=${file.token}`}
                            className="rounded-full inline-flex items-center gap-2 border border-line px-3 py-2 text-[11.5px] text-ink transition-colors hover:border-wine hover:bg-wine hover:text-paper"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.6" />
                            </svg>
                            {formatLabels[file.format]}
                            {file.pages ? ` · ${file.pages} pág.` : ''}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl mt-8 border border-line bg-[#F2F0EA] p-5 text-[12px] leading-relaxed text-muted">
        <p className="font-medium text-ink">Licença de uso</p>
        <p className="mt-1">
          Você pode vender as peças que costurar com estes moldes, sem limite. Não é permitido compartilhar,
          revender ou redistribuir os arquivos em PDF.{' '}
          <Link href="/licenca" className="text-wine underline underline-offset-4">
            Ler a licença completa
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
