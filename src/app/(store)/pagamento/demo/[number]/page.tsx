import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { approveDemoPayment, rejectDemoPayment } from '@/app/actions/demo-payment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { brl } from '@/lib/format';
import { getOrderByNumber } from '@/lib/orders';
import { isDemoPaymentMode } from '@/lib/payments';

export const metadata: Metadata = {
  title: 'Pagamento de demonstração',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function DemoPaymentPage({ params, searchParams }: Props) {
  if (!isDemoPaymentMode()) notFound();

  const [{ number }, { t }] = await Promise.all([params, searchParams]);
  const order = await getOrderByNumber(number);
  if (!order || !t || order.accessToken !== t) notFound();
  if (order.status === 'PAID') redirect(`/pedido/${order.number}?t=${t}`);

  return (
    <div className="container-page py-12 sm:py-20">
      <div className="rounded-2xl mx-auto max-w-lg border border-line bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">Ambiente de demonstração</p>
          <Badge tone="sage">Sem cobrança</Badge>
        </div>

        <h1 className="mt-4 font-serif text-[28px] leading-tight text-forest">Simular pagamento</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Esta tela substitui o checkout do Mercado Pago enquanto a loja não tem credenciais configuradas.
          Nenhum valor é cobrado e nenhum dado de cartão é solicitado.
        </p>

        <dl className="mt-6 space-y-2 border-y border-line py-4 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Pedido</dt>
            <dd>{order.number}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Cliente</dt>
            <dd className="text-right">{order.customerName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Método</dt>
            <dd>{order.paymentMethod === 'CARD' ? 'Cartão de crédito' : 'Pix'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-2 text-[15px]">
            <dt className="font-medium">Total</dt>
            <dd className="font-serif text-[19px] text-forest">{brl(order.totalCents)}</dd>
          </div>
        </dl>

        <form action={approveDemoPayment} className="mt-6">
          <input type="hidden" name="number" value={order.number} />
          <input type="hidden" name="token" value={t} />
          <Button type="submit" size="lg" className="w-full">
            Aprovar pagamento (demonstração)
          </Button>
        </form>

        <form action={rejectDemoPayment} className="mt-3">
          <input type="hidden" name="number" value={order.number} />
          <input type="hidden" name="token" value={t} />
          <button type="submit" className="w-full py-2 text-[12px] text-muted underline decoration-line underline-offset-4 hover:text-forest">
            Simular pagamento recusado
          </button>
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-muted">
          Em produção, o cliente é levado ao Mercado Pago e o pedido só é liberado depois da confirmação
          verificada do webhook.
        </p>
      </div>
    </div>
  );
}
