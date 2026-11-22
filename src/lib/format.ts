import type { Difficulty, FileFormat, OrderStatus, PaymentStatus, ProductStatus } from '@prisma/client';

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function brl(cents: number): string {
  return brlFormatter.format(cents / 100);
}

/** 12990 -> "129,90" (para inputs e mensagens) */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** "129,90" | "129.90" | "R$ 129,90" -> 12990 */
export function inputToCents(value: string | null | undefined): number | null {
  if (!value) return null;
  const raw = value.replace(/[^\d,.-]/g, '').trim();
  if (!raw) return null;

  // Aceita "19,90", "19.90", "1.234,56" e "1,234.56" sem confundir centavos com milhar.
  let normalized: string;
  if (raw.includes(',')) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d+\.\d{1,2}$/.test(raw)) {
    normalized = raw;
  } else {
    normalized = raw.replace(/\./g, '');
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(date),
  );
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

export const difficultyLabels: Record<Difficulty, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
};

export const difficultyDescriptions: Record<Difficulty, string> = {
  INICIANTE: 'Primeiras costuras: poucas peças, retas e acabamento simples.',
  INTERMEDIARIO: 'Já costurou algumas peças: curvas, zíper e forro sem sustos.',
  AVANCADO: 'Modelagem com detalhes: drapeados, alfaiataria e ajustes finos.',
};

export const formatLabels: Record<FileFormat, string> = {
  A4: 'A4 (impressora doméstica)',
  A0: 'A0 (plotter)',
  PROJETOR: 'Projetor',
  OUTRO: 'Outro',
};

export const formatShortLabels: Record<FileFormat, string> = {
  A4: 'A4',
  A0: 'A0',
  PROJETOR: 'Projetor',
  OUTRO: 'Outro',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  FAILED: 'Falhou',
  EXPIRED: 'Expirado',
  CANCELED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Aguardando',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  REFUNDED: 'Reembolsado',
  EXPIRED: 'Expirado',
};

export const productStatusLabels: Record<ProductStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
