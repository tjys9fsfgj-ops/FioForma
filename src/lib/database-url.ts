/**
 * O banco gerenciado entrega o DSN com o parâmetro `ssl={"rejectUnauthorized":true}`.
 * O driver do Prisma espera `sslaccept=strict`. Normalizamos em um único lugar para
 * que o mesmo DSN funcione no app, nos scripts e no container de produção.
 */
export function normalizeDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    if (url.searchParams.has('ssl')) {
      url.searchParams.delete('ssl');
      url.searchParams.set('sslaccept', 'strict');
    }
    return url.toString();
  } catch {
    return raw;
  }
}
