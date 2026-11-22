import Link from 'next/link';
import { ProfileForm, SetPasswordForm } from '@/components/auth/forms';
import { requireUser } from '@/lib/session';

export default async function ProfilePage() {
  const user = await requireUser('/minha-conta/dados');

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">Dados pessoais</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
          Coletamos o mínimo para entregar sua compra: nome, e-mail e, se você informar, telefone para
          contato sobre o pedido.
        </p>
        <div className="rounded-2xl mt-6 border border-line bg-white p-5 sm:p-6">
          <ProfileForm name={user.name ?? ''} phone={user.phone ?? ''} marketingOptIn={false} />
          <p className="mt-4 border-t border-line pt-3 text-[11.5px] text-muted">
            E-mail da conta: <span className="text-ink">{user.email}</span>. Para trocar o e-mail, fale com o
            suporte.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[22px] text-forest">
          {user.passwordHash ? 'Alterar senha' : 'Definir uma senha'}
        </h2>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
          {user.passwordHash
            ? 'Use uma senha com pelo menos 8 caracteres e diferente de outras que você já usa.'
            : 'Sua compra foi feita como visitante. Defina uma senha para entrar sem depender do link de e-mail.'}
        </p>
        <div className="rounded-2xl mt-4 border border-line bg-white p-5 sm:p-6">
          <SetPasswordForm hasPassword={Boolean(user.passwordHash)} />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[22px] text-forest">Privacidade e seus dados</h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
          Você pode pedir uma cópia dos seus dados ou a exclusão da conta a qualquer momento, pelo canal de
          contato. Pedidos precisam ser mantidos por obrigação fiscal e contábil.
        </p>
        <Link href="/privacidade" className="mt-3 inline-block text-[12.5px] text-forest underline underline-offset-4">
          Ler a política de privacidade
        </Link>
      </section>
    </div>
  );
}
