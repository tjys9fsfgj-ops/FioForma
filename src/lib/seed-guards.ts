/**
 * Regras que protegem o banco de produção quando o seed roda a cada deploy.
 */

export type SeedStamp = { hash: string; at: Date };

/**
 * Aplicar o conteúdo do seed num registro?
 * - primeira vez (sem carimbo): sim;
 * - mesmo conteúdo do último seed: não;
 * - conteúdo novo, mas o registro foi editado no painel depois do último seed: não (preserva a edição);
 * - conteúdo novo e ninguém mexeu: sim.
 */
export function shouldApplySeed(input: { stored: SeedStamp | null; hash: string; recordUpdatedAt: Date | null }): boolean {
  const { stored, hash, recordUpdatedAt } = input;
  if (!stored) return true;
  if (stored.hash === hash) return false;
  if (recordUpdatedAt && recordUpdatedAt.getTime() > stored.at.getTime() + 1000) return false;
  return true;
}

/**
 * Criar o administrador inicial? Nunca se já existe um admin; em produção,
 * só com SEED_ADMIN_PASSWORD definida (a senha padrão do código é pública).
 */
export function adminSeedPlan(input: { adminCount: number; env: NodeJS.ProcessEnv }): 'skip' | 'create' {
  if (input.adminCount > 0) return 'skip';
  if (input.env.NODE_ENV === 'production' && !input.env.SEED_ADMIN_PASSWORD?.trim()) {
    throw new Error('Defina SEED_ADMIN_PASSWORD para criar o primeiro administrador em produção.');
  }
  return 'create';
}
