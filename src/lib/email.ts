import { brand } from '@/config/brand';
import { brl, formatDate } from './format';

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function provider(): 'resend' | 'console' {
  return process.env.EMAIL_PROVIDER === 'resend' && process.env.RESEND_API_KEY ? 'resend' : 'console';
}

export async function sendEmail(message: EmailMessage): Promise<{ delivered: boolean; provider: string }> {
  const selected = provider();

  if (selected === 'console') {
    console.info('[email:console]', {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    return { delivered: false, provider: 'console' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${brand.name} <nao-responda@fioforma.com.br>`,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('[email:resend] falha', response.status, detail.slice(0, 300));
    return { delivered: false, provider: 'resend' };
  }

  return { delivered: true, provider: 'resend' };
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#F7F6F2;color:#222725;font-family:Inter,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #DEDAD1;border-radius:4px;">
          <tr><td style="padding:28px 32px 8px;font-family:Georgia,serif;font-size:22px;letter-spacing:-0.02em;color:#7A3B3B;">${brand.wordmark}</td></tr>
          <tr><td style="padding:8px 32px 0;font-family:Georgia,serif;font-size:24px;line-height:1.25;">${title}</td></tr>
          <tr><td style="padding:16px 32px 32px;font-size:15px;line-height:1.65;color:#222725;">${body}</td></tr>
          <tr><td style="padding:16px 32px;border-top:1px solid #DEDAD1;font-size:12px;color:#6B716D;line-height:1.6;">
            ${brand.name} — ${brand.tagline}<br />
            Dúvidas: ${brand.support.email} · ${brand.support.whatsapp}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#7A3B3B;color:#FFFFFF;text-decoration:none;padding:14px 22px;border-radius:2px;font-weight:600;">${label}</a></p>`;
}

export type OrderEmailItem = { name: string; priceCents: number };

export async function sendOrderPaidEmail(input: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalCents: number;
  items: OrderEmailItem[];
  libraryUrl: string;
  accessUrl?: string;
  isGuest: boolean;
}) {
  const itemsHtml = input.items
    .map((item) => `<li style="margin-bottom:6px;">${item.name} — ${brl(item.priceCents)}</li>`)
    .join('');

  const accessBlock =
    input.isGuest && input.accessUrl
      ? `<p>Criamos um acesso para você acompanhar seus moldes. O link abaixo entra na sua biblioteca e permite definir uma senha:</p>${button(
          input.accessUrl,
          'Entrar na minha biblioteca',
        )}<p style="font-size:13px;color:#6B716D;">O link é de uso único e expira em 7 dias. Você também pode criar uma senha depois, dentro da sua conta.</p>`
      : button(input.libraryUrl, 'Baixar meus moldes');

  const html = layout(
    'Pagamento confirmado. Seus moldes estão liberados.',
    `<p>Oi, ${input.customerName.split(' ')[0] || 'tudo bem'}!</p>
     <p>Recebemos o pagamento do pedido <strong>${input.orderNumber}</strong> em ${formatDate(new Date())}.</p>
     <ul style="padding-left:18px;margin:16px 0;">${itemsHtml}</ul>
     <p style="font-size:15px;"><strong>Total:</strong> ${brl(input.totalCents)}</p>
     ${accessBlock}
     <p>Os arquivos ficam disponíveis para download ilimitado na sua biblioteca. Imprima em escala 100% e confira o gabarito de teste antes de cortar o tecido.</p>
     <p>Licença: você pode vender as peças que costurar, sem limite. Não compartilhe nem revenda os PDFs.</p>`,
  );

  return sendEmail({
    to: input.to,
    subject: `Pedido ${input.orderNumber} confirmado — seus moldes estão liberados`,
    html,
    text: `Pedido ${input.orderNumber} confirmado. Total ${brl(input.totalCents)}. Biblioteca: ${input.libraryUrl}${
      input.accessUrl ? ` | Acesso: ${input.accessUrl}` : ''
    }`,
  });
}

export async function sendPasswordResetEmail(input: { to: string; name?: string | null; resetUrl: string }) {
  const html = layout(
    'Redefinir sua senha',
    `<p>Oi${input.name ? `, ${input.name.split(' ')[0]}` : ''}.</p>
     <p>Recebemos um pedido para redefinir a senha da sua conta. O link vale por 1 hora e só pode ser usado uma vez.</p>
     ${button(input.resetUrl, 'Criar nova senha')}
     <p style="font-size:13px;color:#6B716D;">Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>`,
  );

  return sendEmail({
    to: input.to,
    subject: 'Redefinir sua senha na FioForma',
    html,
    text: `Redefina sua senha: ${input.resetUrl} (vale por 1 hora)`,
  });
}

export async function sendAccessLinkEmail(input: { to: string; name?: string | null; accessUrl: string }) {
  const html = layout(
    'Seu link de acesso',
    `<p>Oi${input.name ? `, ${input.name.split(' ')[0]}` : ''}.</p>
     <p>Use o link abaixo para entrar na sua conta e acessar seus moldes. Ele é de uso único e expira em 7 dias.</p>
     ${button(input.accessUrl, 'Entrar na minha conta')}`,
  );

  return sendEmail({
    to: input.to,
    subject: 'Seu link de acesso à FioForma',
    html,
    text: `Seu link de acesso: ${input.accessUrl}`,
  });
}

export async function sendContactNotification(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  const to = brand.support.email;
  if (/^\[.*\]$/.test(to)) return { delivered: false, provider: 'none' };

  return sendEmail({
    to,
    subject: `Contato do site: ${input.subject || 'sem assunto'}`,
    html: layout(
      'Nova mensagem pelo site',
      `<p><strong>${input.name}</strong> (${input.email}) escreveu:</p><p style="white-space:pre-line;">${input.message}</p>`,
    ),
    text: `${input.name} <${input.email}>\n${input.message}`,
  });
}
