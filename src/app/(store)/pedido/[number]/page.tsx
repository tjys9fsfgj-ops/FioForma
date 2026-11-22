import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { createDownloadToken } from '@/lib/downloads';
import { brl, formatDateTime, formatLabels, orderStatusLabels, priceLabel } from '@/lib/format';
import { isDemoPaymentMode } from '@/lib/payments';
import { canViewOrder, getOrderByNumber } from '@/lib/orders';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Seu pedido',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ number }, { t }] = await Promise.all([params, searchParams]);
  const order = await getOrderByNumber(number);
  if (!order) notFound();

  const allowed = await canViewOrder(order, t);
  if (!allowed) notFound();

  const user = await getCurrentUser();
  const paid = order.status === 'PAID';
  const pending = order.status === 'PENDING';
  const demo = isDemoPaymentMode();

  const entitlements = paid
    ? await prisma.entitlement.findMany({
        where: { orderId: order.id, revokedAt: null },
        include: { product: { include: { files: true } } },
      })
    : [];

  const downloadGroups = await Promise.all(
    entitlements.map(async (entitlement) => ({
      id: entitlement.id,
      productName: entitlement.product.name,
      productSlug: entitlement.product.slug,
      files: await Promise.all(
        entitlement.product.files.map(async (file) => ({
          id: file.id,
          name: file.fileName,
          format: file.format,
          pages: file.pages,
          token: await createDownloadToken({
            entitlementId: entitlement.id,
            fileId: file.id,
            subject: order.email,
          }),
        })),
      ),
    })),
  );

  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Pedido {order.number}</p>
        <h1 className="mt-2 text-[clamp(1.9rem,4vw,2.9rem)] leading-tight">
          {paid ? (order.totalCents === 0 ? 'Pedido confirmado. Seus moldes estão liberados.' : 'Pagamento confirmado. Seus moldes estão liberados.') : pending ? 'Estamos aguardando o pagamento.' : 'Este pedido não foi concluído.'}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge tone={paid ? 'wine' : 'neutral'}>{orderStatusLabels[order.status]}</Badge>
          <span className="text-[12px] text-muted">Criado em {formatDateTime(order.createdAt)}</span>
          {order.paidAt ? <span className="text-[12px] text-muted">Pago em {formatDateTime(order.paidAt)}</span> : null}
        </div>

        {pending ? (
          <div className="rounded-2xl mt-6 border border-line bg-paper p-6">
            <p className="text-[14px] leading-relaxed text-ink/85">
              Assim que o pagamento for confirmado, os arquivos aparecem aqui e na sua biblioteca. Se você
              pagou por Pix, a confirmação costuma levar poucos segundos. Você também recebe um e-mail com o
              link de acesso.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href={`/pedido/${order.number}?t=${order.accessToken}`} variant="outline" size="sm">
                Atualizar status
              </ButtonLink>
              {demo ? (
                <ButtonLink href={`/pagamento/demo/${order.number}?t=${order.accessToken}`} size="sm">
                  Abrir pagamento de demonstração
                </ButtonLink>
              ) : null}
            </div>
            {demo ? (
              <p className="mt-3 text-[11.5px] leading-relaxed text-[#6B5320]">
                Ambiente de demonstração: nenhum valor real foi cobrado.
              </p>
            ) : null}
          </div>
        ) : null}

        {paid ? (
          <div className="rounded-2xl mt-6 border border-wine-200 bg-wine-50 p-6">
            <p className="text-[14px] leading-relaxed text-wine-900">
              Enviamos a confirmação para <strong className="font-semibold">{order.email}</strong>.
              {user ? (
                <>
                  {' '}
                  Seus moldes também ficam na{' '}
                  <Link href="/minha-conta/biblioteca" className="underline underline-offset-4">
                    biblioteca
                  </Link>
                  .
                </>
              ) : (
                <> Abra o link de acesso do e-mail para entrar na biblioteca e definir uma senha.</>
              )}
            </p>
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="font-serif text-[22px] text-wine">Itens do pedido</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <Link href={`/produto/${item.productSlug}`} className="text-[14px] font-medium text-ink hover:text-wine">
                    {item.productName}
                  </Link>
                  <p className="mt-0.5 text-[11.5px] text-muted">Molde digital em PDF · licença de uso pessoal e venda das peças</p>
                </div>
                <p className="shrink-0 text-[13.5px]">{brl(item.totalCents)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 ml-auto max-w-xs space-y-2 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{brl(order.subtotalCents)}</dd>
            </div>
            {order.discountCents > 0 ? (
              <div className="flex justify-between text-wine">
                <dt>Desconto {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                <dd>− {brl(order.discountCents)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-line pt-2 text-[15px]">
              <dt className="font-medium">Total</dt>
              <dd className="font-serif text-[19px] text-wine">{priceLabel(order.totalCents)}</dd>
            </div>
          </dl>
        </section>

        {paid && downloadGroups.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-serif text-[22px] text-wine">Baixar agora</h2>
            <p className="mt-1 text-[12.5px] text-muted">
              Os links abaixo são pessoais e expiram em 10 minutos. Você pode gerar novos na sua biblioteca,
              quantas vezes quiser.
            </p>
            <div className="mt-4 space-y-4">
              {downloadGroups.map((group) => (
                <div key={group.id} className="rounded-2xl border border-line bg-paper p-5">
                  <h3 className="font-serif text-[18px] text-ink">{group.productName}</h3>
                  {group.files.length === 0 ? (
                    <p className="mt-2 text-[12.5px] text-muted">
                      Os arquivos estão sendo preparados. Fale com o suporte se demorar.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {group.files.map((file) => (
                        <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2">
                          <span className="text-[13px] text-ink/85">
                            {formatLabels[file.format]} — {file.name}
                            {file.pages ? ` · ${file.pages} ${file.pages === 1 ? 'folha' : 'folhas'}` : ''}
                          </span>
                          <a
                            href={`/api/download/${file.id}?t=${file.token}`}
                            className="rounded-full border border-wine px-3 py-1.5 text-[11.5px] font-medium text-wine hover:bg-wine hover:text-paper"
                          >
                            Baixar PDF
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/catalogo" variant="outline">
            Continuar comprando
          </ButtonLink>
          <ButtonLink href="/contato" variant="ghost">
            Preciso de ajuda
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
