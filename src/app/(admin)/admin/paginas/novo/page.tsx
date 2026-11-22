import { AdminHeader } from '@/components/admin/ui';
import { PageForm } from '@/components/admin/page-form';
import { FormMessage } from '@/components/ui/field';

export default async function NewPagePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div>
      <AdminHeader
        eyebrow="Conteúdo"
        title="Nova página"
        description="Escreva em Markdown. Você pode deixar como rascunho e publicar quando o texto estiver revisado."
      />
      {erro ? <div className="mb-4"><FormMessage>Título e conteúdo são obrigatórios.</FormMessage></div> : null}
      <PageForm />
    </div>
  );
}
