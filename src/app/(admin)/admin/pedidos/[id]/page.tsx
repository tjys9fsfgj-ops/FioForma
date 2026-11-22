import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  addOrderNoteAction,
  cancelOrderAction,
  markPaidManuallyAction,
  refundOrderAction,
  resendOrderEmailAction,
} from '@/app/actions/admin-orders';
import { AdminCard, AdminHeader, StatusPill } from '@/components/admin/ui';
import { FormMessage } from '@/components/ui/field';
import { brl, formatDateTime, orderStatusLabels, paymentStatusLabels } from '@/lib/format';
import { prisma } from '@/lib/prisma';

const messages: Record<string, string> = {
  pago: 'Pedido confirmado manualmente. Os arquivos foram liberados e o e-mail de acesso foi enviado.',
  cancelado: 'Pedido cancelado.',
  reembolsado: 'Reembolso registrado e acessos revogados.',
  email: 'E-mail de confirmação reenviado.',
  nota: 'Nota interna salva.',
};

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { id } = await params;
  const { ok, erro } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { files: true } } } },
      payments: { orderBy: { createdAt: 'desc' } },
      events: { orderBy: { receivedAt: 'desc' }, take: 20 },
      entitlements: { include: { downloads: { orderBy: { createdAt: 'desc' }, take: 5 }, product: true } },
      redemptions: { include: { coupon: true } },
      user: true,
    },
  });

  if (!order) notFound();

  const paid = order.status === 'PAID';

  return (
    <div>
      <AdminHeader
        eyebrow={
          <>
            <Link href="/admin/pedidos" className="hover:text-wine">Pedidos</Link>
            <span className="mx-1">/</span>
            <span>#{order.number}</span>
          </>
        }
        title={`Pedido #${order.number}`}
        description={`Criado em ${formatDateTime(order.createdAt)} · ${order.items.length} ${order.items.length === 1 ? 'molde' : 'moldes'} · ${brl(order.totalCents)}`}
        action={
          <StatusPill
            tone={paid ? 'green' : order.status === 'PENDING' ? 'amber' : order.status === 'REFUNDED' || order.status === 'FAILED' ? 'red' : 'gray'}
          >
            {orderStatusLabels[order.status]}
          </StatusPill>
        }
      />

      {ok && messages[ok] ? (
        <div className="mb-5"><FormMessage tone="success">{messages[ok]}</FormMessage></div>
      ) : null}
      {erro ? (
        <div className="mb-5">
          <FormMessage>
            {erro === 'pagamento'
              ? 'Não foi possível confirmar o pagamento. Verifique os logs do servidor.'
              : erro === 'estornar'
                ? 'Este pedido está pago. Use o reembolso para revogar os acessos.'
                : 'Não foi possível concluir a ação.'}
          </FormMessage>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <AdminCard>
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-wine">Itens</h2>
            </div>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-[13px] text-ink">{item.productName}</p>
                    <p className="text-[10.5px] text-muted">
                      /{item.productSlug} · {item.product?.files.length ?? 0} {item.product?.files.length === 1 ? 'arquivo' : 'arquivos'}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-[12.5px]">{brl(item.totalCents)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-5 py-4 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{brl(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Desconto {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                  <dd>-{brl(order.discountCents)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-2 text-[13px] font-medium">
                <dt>Total</dt>
                <dd>{brl(order.totalCents)}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard>
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-wine">Arquivos liberados</h2>
            </div>
            {order.entitlements.length === 0 ? (
              <p className="px-5 py-6 text-[12px] text-muted">
                Nenhum acesso liberado ainda. Isso acontece automaticamente após a confirmação do pagamento.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {order.entitlements.map((entitlement) => (
                  <li key={entitlement.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[12.5px] text-ink">{entitlement.product.name}</p>
                        <p className="text-[10.5px] text-muted">
                          {entitlement.revokedAt
                            ? `Acesso revogado em ${formatDateTime(entitlement.revokedAt)}`
                            : `Liberado em ${formatDateTime(entitlement.createdAt)}`}
                        </p>
                      </div>
                      <StatusPill tone={entitlement.revokedAt ? 'red' : 'green'}>
                        {entitlement.revokedAt ? 'Revogado' : 'Ativo'}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-[10.5px] text-muted">
                      {entitlement.downloads.length === 0
                        ? 'Nenhum download registrado'
                        : `${entitlement.downloads.length} ${entitlement.downloads.length === 1 ? 'download recente' : 'downloads recentes'} · último em ${formatDateTime(entitlement.downloads[0]?.createdAt)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-wine">Pagamentos e eventos</h2>
            </div>
            <ul className="divide-y divide-line">
              {order.payments.length === 0 ? (
                <li className="px-5 py-4 text-[12px] text-muted">Nenhuma tentativa de pagamento registrada.</li>
              ) : (
                order.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[11.5px]">
                    <span className="text-muted">
                      {formatDateTime(payment.createdAt)} · {payment.gateway}
                      {payment.gatewayPaymentId ? ` · ${payment.gatewayPaymentId}` : ''}
                    </span>
                    <span className="flex items-center gap-2">
                      <span>{brl(payment.amountCents)}</span>
                      <StatusPill tone={payment.status === 'APPROVED' ? 'green' : payment.status === 'PENDING' ? 'amber' : 'gray'}>
                        {paymentStatusLabels[payment.status]}
                      </StatusPill>
                    </span>
                  </li>
                ))
              )}
            </ul>
            {order.events.length > 0 ? (
              <details className="border-t border-line px-5 py-3">
                <summary className="cursor-pointer text-[11px] text-muted">Webhooks recebidos ({order.events.length})</summary>
                <ul className="mt-2 space-y-1 text-[10.5px] text-muted">
                  {order.events.map((event) => (
                    <li key={event.id}>
                      {formatDateTime(event.receivedAt)} · {event.type} · {event.processedAt ? 'processado' : 'não processado'}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </AdminCard>
        </div>

        <div className="space-y-5">
          <AdminCard>
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-wine">Cliente</h2>
            </div>
            <div className="space-y-2 px-5 py-4 text-[12px]">
              <p className="text-ink">{order.customerName}</p>
              <p className="text-muted">{order.email}</p>
              {order.phone ? <p className="text-muted">{order.phone}</p> : null}
              <p className="text-muted">
                {order.user?.passwordHash ? 'Conta com senha' : 'Compra como visitante'} ·{' '}
                {order.user ? `desde ${formatDateTime(order.user.createdAt)}` : 'sem conta'}
              </p>
              <p className="text-muted">
                Pagamento: {order.paymentMethod === 'PIX' ? 'Pix' : order.paymentMethod === 'CARD' ? 'Cartão' : 'não definido'}
                {order.gateway ? ` · ${order.gateway}` : ''}
              </p>
              {order.gatewayRef ? <p className="break-all text-muted">Ref.: {order.gatewayRef}</p> : null}
              {order.paidAt ? <p className="text-muted">Pago em {formatDateTime(order.paidAt)}</p> : null}
            </div>
          </AdminCard>

          <AdminCard>
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-wine">Ações</h2>
            </div>
            <div className="space-y-4 px-5 py-4">
              {!paid ? (
                <form action={markPaidManuallyAction} className="space-y-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <label htmlFor="note" className="field-label">Confirmar pagamento manualmente</label>
                  <input id="note" name="note" placeholder="Ex.: Pix recebido em 12/03" className="field-input" />
                  <button type="submit" className="rounded-full w-full border border-wine bg-wine px-4 py-2.5 text-[12px] text-white hover:bg-wine-800">
                    Marcar como pago e liberar arquivos
                  </button>
                  <p className="text-[10.5px] leading-relaxed text-muted">
                    Use apenas quando o dinheiro já estiver na conta. O cliente recebe o e-mail com o link de acesso.
                  </p>
                </form>
              ) : null}

              <form action={resendOrderEmailAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="rounded-full w-full border border-line bg-paper px-4 py-2.5 text-[12px] hover:border-wine">
                  Reenviar e-mail do pedido
                </button>
              </form>

              {order.status !== 'CANCELED' && !paid ? (
                <form action={cancelOrderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <button type="submit" className="rounded-full w-full border border-line bg-paper px-4 py-2.5 text-[12px] text-[#8A342A] hover:border-[#8A342A]">
                    Cancelar pedido
                  </button>
                </form>
              ) : null}

              {paid ? (
                <form action={refundOrderAction} className="space-y-2 border-t border-line pt-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <label htmlFor="refund-note" className="field-label">Registrar reembolso</label>
                  <input id="refund-note" name="note" placeholder="Motivo / ID do estorno no Mercado Pago" className="field-input" />
                  <button type="submit" className="w-full rounded-full border border-[#8A342A] bg-paper px-4 py-2.5 text-[12px] text-[#8A342A]">
                    Registrar reembolso e revogar acessos
                  </button>
                  <p className="text-[10.5px] leading-relaxed text-muted">
                    O estorno financeiro é feito no painel do Mercado Pago. Aqui registramos o caso e bloqueamos novos downloads.
                  </p>
                </form>
              ) : null}
            </div>
          </AdminCard>

          <AdminCard>
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-wine">Nota interna</h2>
            </div>
            <form action={addOrderNoteAction} className="space-y-2 px-5 py-4">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea
                name="note"
                rows={4}
                defaultValue={order.internalNote ?? ''}
                placeholder="Visível apenas para a equipe"
                className="field-input"
              />
              <button type="submit" className="rounded-full border border-line bg-paper px-4 py-2 text-[12px] hover:border-wine">
                Salvar nota
              </button>
            </form>
          </AdminCard>

          {order.redemptions.length > 0 ? (
            <AdminCard>
              <div className="border-b border-line px-5 py-3">
                <h2 className="font-serif text-[17px] text-wine">Cupom</h2>
              </div>
              <p className="px-5 py-4 text-[12px] text-muted">
                {order.redemptions.map((redemption) => redemption.coupon.code).join(', ')} · aplicado em{' '}
                {formatDateTime(order.redemptions[0]?.createdAt)}
              </p>
            </AdminCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
