import { deleteCouponAction, saveCouponAction, toggleCouponAction } from '@/app/actions/admin-coupons';
import { AdminHeader, StatusPill } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/field';
import { brl, formatDate } from '@/lib/format';
import { prisma } from '@/lib/prisma';

function toInputValue(date: Date | null): string {
  if (!date) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const errors: Record<string, string> = {
  dados: 'Informe um código e um valor de desconto válidos.',
  percentual: 'O desconto percentual não pode passar de 100%.',
  duplicado: 'Já existe um cupom com esse código.',
};

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  const { salvo, erro } = await searchParams;
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    include: { _count: { select: { redemptions: true } } },
  });

  return (
    <div>
      <AdminHeader
        eyebrow="Vendas"
        title="Cupons"
        description="Cupons de desconto percentual ou em reais, com limite de usos e janela de validade. Cada uso fica registrado no pedido."
      />

      {salvo ? <div className="mb-4"><FormMessage tone="success">Cupons atualizados.</FormMessage></div> : null}
      {erro && errors[erro] ? <div className="mb-4"><FormMessage>{errors[erro]}</FormMessage></div> : null}

      <section className="rounded-2xl mb-8 border border-line bg-white">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-serif text-[17px] text-forest">Novo cupom</h2>
        </div>
        <form action={saveCouponAction} className="grid gap-3 p-5 sm:grid-cols-4">
          <div>
            <label htmlFor="code" className="field-label">Código *</label>
            <input id="code" name="code" required placeholder="BEMVINDA10" className="field-input uppercase" />
          </div>
          <div>
            <label htmlFor="type" className="field-label">Tipo</label>
            <select id="type" name="type" className="field-input">
              <option value="PERCENT">Percentual (%)</option>
              <option value="FIXED">Valor fixo (R$)</option>
            </select>
          </div>
          <div>
            <label htmlFor="value" className="field-label">Valor *</label>
            <input id="value" name="value" required inputMode="decimal" placeholder="10" className="field-input" />
          </div>
          <div>
            <label htmlFor="minSubtotal" className="field-label">Compra mínima (R$)</label>
            <input id="minSubtotal" name="minSubtotal" inputMode="decimal" placeholder="0" className="field-input" />
          </div>
          <div>
            <label htmlFor="maxRedemptions" className="field-label">Limite de usos</label>
            <input id="maxRedemptions" name="maxRedemptions" type="number" min={1} placeholder="Sem limite" className="field-input" />
          </div>
          <div>
            <label htmlFor="startsAt" className="field-label">Início</label>
            <input id="startsAt" name="startsAt" type="datetime-local" className="field-input" />
          </div>
          <div>
            <label htmlFor="endsAt" className="field-label">Fim</label>
            <input id="endsAt" name="endsAt" type="datetime-local" className="field-input" />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-[#24483D]" />
              Ativo
            </label>
            <Button type="submit" size="sm">Criar cupom</Button>
          </div>
        </form>
      </section>

      <div className="space-y-3">
        {coupons.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white px-5 py-8 text-[12.5px] text-muted">Nenhum cupom cadastrado.</p>
        ) : (
          coupons.map((coupon) => (
            <details key={coupon.id} className="rounded-2xl border border-line bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] tracking-wide text-forest">{coupon.code}</span>
                  <StatusPill tone={coupon.active ? 'green' : 'gray'}>{coupon.active ? 'Ativo' : 'Inativo'}</StatusPill>
                </div>
                <p className="text-[11px] text-muted">
                  {coupon.type === 'PERCENT' ? `${coupon.value}% off` : `${brl(coupon.value)} off`} ·{' '}
                  {coupon._count.redemptions}
                  {coupon.maxRedemptions ? `/${coupon.maxRedemptions}` : ''} usos
                  {coupon.endsAt ? ` · até ${formatDate(coupon.endsAt)}` : ''}
                </p>
              </summary>
              <div className="border-t border-line p-5">
                <form action={saveCouponAction} className="grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="id" value={coupon.id} />
                  <div>
                    <label htmlFor={`code-${coupon.id}`} className="field-label">Código</label>
                    <input id={`code-${coupon.id}`} name="code" defaultValue={coupon.code} className="field-input uppercase" />
                  </div>
                  <div>
                    <label htmlFor={`type-${coupon.id}`} className="field-label">Tipo</label>
                    <select id={`type-${coupon.id}`} name="type" defaultValue={coupon.type} className="field-input">
                      <option value="PERCENT">Percentual (%)</option>
                      <option value="FIXED">Valor fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`value-${coupon.id}`} className="field-label">Valor</label>
                    <input
                      id={`value-${coupon.id}`}
                      name="value"
                      defaultValue={coupon.type === 'PERCENT' ? coupon.value : (coupon.value / 100).toFixed(2)}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label htmlFor={`min-${coupon.id}`} className="field-label">Compra mínima (R$)</label>
                    <input
                      id={`min-${coupon.id}`}
                      name="minSubtotal"
                      defaultValue={coupon.minSubtotalCents ? (coupon.minSubtotalCents / 100).toFixed(2) : ''}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label htmlFor={`max-${coupon.id}`} className="field-label">Limite de usos</label>
                    <input id={`max-${coupon.id}`} name="maxRedemptions" type="number" min={1} defaultValue={coupon.maxRedemptions ?? ''} className="field-input" />
                  </div>
                  <div>
                    <label htmlFor={`start-${coupon.id}`} className="field-label">Início</label>
                    <input id={`start-${coupon.id}`} name="startsAt" type="datetime-local" defaultValue={toInputValue(coupon.startsAt)} className="field-input" />
                  </div>
                  <div>
                    <label htmlFor={`end-${coupon.id}`} className="field-label">Fim</label>
                    <input id={`end-${coupon.id}`} name="endsAt" type="datetime-local" defaultValue={toInputValue(coupon.endsAt)} className="field-input" />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-[12px]">
                      <input type="checkbox" name="active" defaultChecked={coupon.active} className="h-4 w-4 accent-[#24483D]" />
                      Ativo
                    </label>
                    <Button type="submit" size="sm">Salvar</Button>
                  </div>
                </form>
                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3">
                  <form action={toggleCouponAction}>
                    <input type="hidden" name="id" value={coupon.id} />
                    <button type="submit" className="text-[11px] text-muted underline underline-offset-4 hover:text-forest">
                      {coupon.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </form>
                  <form action={deleteCouponAction}>
                    <input type="hidden" name="id" value={coupon.id} />
                    <button type="submit" className="text-[11px] text-[#9B3A2E] underline underline-offset-4">
                      Excluir
                    </button>
                  </form>
                  {coupon._count.redemptions > 0 ? (
                    <span className="text-[10.5px] text-muted">Cupons já usados são desativados, não excluídos.</span>
                  ) : null}
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
