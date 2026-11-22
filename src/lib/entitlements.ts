import { prisma } from './prisma';

export async function getLibrary(user: { id: string; email: string }) {
  return prisma.entitlement.findMany({
    where: {
      revokedAt: null,
      OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
    },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          files: { orderBy: { format: 'asc' } },
          spec: true,
        },
      },
      order: { select: { number: true, paidAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export type LibraryItem = Awaited<ReturnType<typeof getLibrary>>[number];

export async function getEntitlementWithFiles(entitlementId: string) {
  return prisma.entitlement.findUnique({
    where: { id: entitlementId },
    include: {
      product: { include: { files: true } },
      downloads: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
}

export async function userOwnsProduct(user: { id: string; email: string }, productId: string) {
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      productId,
      revokedAt: null,
      OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
    },
  });
  return Boolean(entitlement);
}

export async function countDownloads(entitlementId: string, since: Date): Promise<number> {
  return prisma.downloadLog.count({
    where: { entitlementId, createdAt: { gte: since } },
  });
}
