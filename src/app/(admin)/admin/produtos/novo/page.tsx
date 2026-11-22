import Link from 'next/link';
import { createProductAction } from '@/app/actions/admin-products';
import { AdminHeader } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/product-form';
import { prisma } from '@/lib/prisma';

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.collection.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div>
      <AdminHeader
        eyebrow="Catálogo"
        title="Novo molde"
        description="Depois de criar, você poderá enviar fotos e PDFs nesta mesma página. O molde fica em rascunho até você publicar."
        action={
          <Link href="/admin/produtos" className="rounded-full border border-line bg-paper px-3 py-2 text-[12px] hover:border-wine">
            Voltar
          </Link>
        }
      />
      <ProductForm categories={categories} collections={collections} action={createProductAction} />
    </div>
  );
}
