import { prisma } from './prisma';

export async function logAudit(input: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ipHash?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        meta: input.meta ? JSON.stringify(input.meta).slice(0, 4000) : null,
        ipHash: input.ipHash ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] falha ao registrar', input.action, error);
  }
}
