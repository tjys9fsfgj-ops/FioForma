import { saveSettingsAction } from '@/app/actions/admin-settings';
import { AdminCard, AdminHeader } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/field';
import { getSettings } from '@/lib/settings';

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className={ok ? 'text-[11px] font-medium text-forest' : 'text-[11px] font-medium text-[#8A342A]'}>
        {ok ? 'Configurado' : 'Pendente'}
      </span>
    </li>
  );
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const settings = await getSettings();

  const gateway = process.env.PAYMENT_GATEWAY ?? 'simulator';
  const emailProvider = process.env.EMAIL_PROVIDER ?? 'console';
  const storage = process.env.STORAGE_DRIVER ?? 'db';
  const mpConfigured = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_WEBHOOK_SECRET);
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const siteUrlConfigured = Boolean(process.env.NEXT_PUBLIC_SITE_URL);
  const s3Configured = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);

  return (
    <div>
      <AdminHeader
        eyebrow="Sistema"
        title="Configurações"
        description="Dados públicos da loja e situação das integrações. Chaves e senhas ficam apenas nas variáveis de ambiente do servidor."
      />

      {ok ? <div className="mb-4"><FormMessage tone="success">Configurações salvas.</FormMessage></div> : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <form action={saveSettingsAction} className="rounded-2xl space-y-4 border border-line bg-white p-5">
          <h2 className="font-serif text-[17px] text-forest">Identidade e atendimento</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="storeName" className="field-label">Nome da loja</label>
              <input id="storeName" name="storeName" defaultValue={settings.storeName} className="field-input" />
            </div>
            <div>
              <label htmlFor="instagram" className="field-label">Instagram</label>
              <input id="instagram" name="instagram" defaultValue={settings.instagram} placeholder="@sua-loja" className="field-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tagline" className="field-label">Assinatura curta</label>
              <input id="tagline" name="tagline" defaultValue={settings.tagline} className="field-input" />
            </div>
            <div>
              <label htmlFor="whatsapp" className="field-label">WhatsApp (com DDI e DDD)</label>
              <input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} placeholder="+55 11 99999-9999" className="field-input" />
            </div>
            <div>
              <label htmlFor="email" className="field-label">E-mail de suporte</label>
              <input id="email" name="email" type="email" defaultValue={settings.email} placeholder="oi@sualoja.com.br" className="field-input" />
            </div>
            <div>
              <label htmlFor="supportHours" className="field-label">Horário de atendimento</label>
              <input id="supportHours" name="supportHours" defaultValue={settings.supportHours} className="field-input" />
            </div>
            <div>
              <label htmlFor="freeUpdatesNote" className="field-label">Nota sobre re-download</label>
              <input id="freeUpdatesNote" name="freeUpdatesNote" defaultValue={settings.freeUpdatesNote} className="field-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="announcement" className="field-label">Aviso no topo do site</label>
              <input
                id="announcement"
                name="announcement"
                defaultValue={settings.announcement}
                placeholder="Deixe em branco para esconder. Ex.: Frete não se aplica — entrega digital imediata."
                className="field-input"
              />
            </div>
          </div>
          <Button type="submit" size="sm">Salvar configurações</Button>
        </form>

        <div className="space-y-5">
          <AdminCard>
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-forest">Integrações</h2>
            </div>
            <ul className="px-5 py-2">
              <Status ok={gateway === 'mercadopago' && mpConfigured} label={`Pagamentos (${gateway})`} />
              <Status ok={emailProvider !== 'console' && (emailProvider !== 'resend' || resendConfigured)} label={`E-mail (${emailProvider})`} />
              <Status ok={storage === 'db' || s3Configured} label={`Arquivos (${storage === 's3' ? 'S3/R2' : 'banco de dados'})`} />
              <Status ok={siteUrlConfigured} label="URL pública do site" />
            </ul>
            <p className="border-t border-line px-5 py-3 text-[10.5px] leading-relaxed text-muted">
              O modo de pagamento de demonstração é bloqueado em produção. Para vender de verdade, configure
              MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET e PAYMENT_GATEWAY=mercadopago.
            </p>
          </AdminCard>

          <AdminCard>
            <div className="border-b border-line px-5 py-3">
              <h2 className="font-serif text-[17px] text-forest">Dados legais</h2>
            </div>
            <div className="space-y-2 px-5 py-4 text-[12px] leading-relaxed text-muted">
              <p>Razão social, CNPJ e endereço vêm de `src/config/brand.ts`.</p>
              <p>
                Enquanto estiverem como `[RAZÃO SOCIAL]`, `[CNPJ — MEI]` e `[ENDEREÇO]`, aparecem como
                pendência nas páginas legais. Preencha antes de publicar.
              </p>
              <p>Os textos de termos, privacidade e reembolso são rascunhos e precisam de revisão jurídica.</p>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
