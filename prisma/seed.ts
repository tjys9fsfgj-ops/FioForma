/**
 * Seed do FioForma.
 *
 * Cria o administrador, a estrutura de catálogo, páginas legais (rascunhos),
 * conteúdo editorial e moldes de demonstração com PDFs provisórios.
 *
 * Rodar com: pnpm db:seed
 * Nada aqui é conteúdo real da loja: os moldes marcados como demo devem ser
 * substituídos pelos arquivos verdadeiros no painel.
 */
import { seedMoldes } from './seed-moldes';
import { PrismaClient, type FileFormat, type Difficulty } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

// O banco gerenciado entrega `ssl={"rejectUnauthorized":true}`; o Prisma espera sslaccept=strict.
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    if (url.searchParams.has('ssl')) {
      url.searchParams.delete('ssl');
      url.searchParams.set('sslaccept', 'strict');
      process.env.DATABASE_URL = url.toString();
    }
  } catch {
    // mantém a URL original
  }
}

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/* PDF de demonstração (uma página A4 com aviso)                       */
/* ------------------------------------------------------------------ */

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function demoPdf(title: string): Buffer {
  const lines = [
    'FioForma - arquivo de demonstracao',
    title,
    '',
    'Este PDF existe apenas para testar a entrega automatica.',
    'Substitua pelo molde real no painel: Produtos > Arquivos.',
    '',
    'O arquivo real deve conter:',
    '- paginas em A4 com escala 100% e teste de impressao',
    '- versao A0 para grafica',
    '- camadas por tamanho quando disponivel',
  ];

  const text = lines
    .map((line, index) => {
      const y = 760 - index * 26;
      const size = index === 0 ? 16 : index === 1 ? 13 : 11;
      return `BT /F1 ${size} Tf 60 ${y} Td (${escapePdfText(line)}) Tj ET`;
    })
    .join('\n');

  const content = `q 0.96 0.95 0.92 rg 0 0 595 842 re f Q\n${text}`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

/* ------------------------------------------------------------------ */
/* Conteúdo                                                            */
/* ------------------------------------------------------------------ */

const sizes = ['PP', 'P', 'M', 'G'];

const collections = [
  { slug: 'basicos', name: 'Básicos', description: 'Peças que resolvem o dia a dia e voltam sempre.', sortOrder: 1 },
  { slug: 'verao', name: 'Verão', description: 'Tecidos leves, caimento solto, costura fresca.', sortOrder: 2 },
  { slug: 'alfaiataria', name: 'Alfaiataria', description: 'Estrutura, ombro e caimento pensados no detalhe.', sortOrder: 3 },
];

const categories = [
  { slug: 'vestido', name: 'Vestido', sortOrder: 1 },
  { slug: 'camisa', name: 'Camisa', sortOrder: 2 },
  { slug: 'saia', name: 'Saia', sortOrder: 3 },
  { slug: 'calca', name: 'Calça', sortOrder: 4 },
  { slug: 'blusa', name: 'Blusa', sortOrder: 5 },
  { slug: 'shorts', name: 'Shorts', sortOrder: 6 },
  { slug: 'acessorios', name: 'Acessórios', sortOrder: 7 },
];

type DemoProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  difficulty: Difficulty;
  category: string;
  collection: string;
  fabric: string;
  yardage: string;
  notions: string;
  pages: number;
  measures: { size: string; bust: number; waist: number; hip: number }[];
  faq: { question: string; answer: string }[];
};

const products: DemoProduct[] = [
  {
    slug: 'vestido-linho-solta',
    name: 'Vestido Linho Solta',
    tagline: 'Decote redondo, manga curta e caimento reto — o vestido que resolve o verão inteiro.',
    description: `Um vestido de modelagem solta, sem pences, pensado para linho e tecidos de caimento firme. O decote é redondo e rente, a manga é curta e levemente ampla, e o comprimento fica na altura do joelho.

**O que você recebe**
- Molde em A4 com escala 100% e teste de impressão
- Versão A0 para plotter ou gráfica
- Arquivo para projetor com camadas por tamanho
- Ficha técnica com metragem, aviamentos e ordem de costura

**Indicado para** quem já costurou alguma peça simples e quer um projeto rápido, com poucas curvas e acabamento limpo.`,
    priceCents: 1900,
    difficulty: 'INTERMEDIARIO',
    category: 'vestido',
    collection: 'verao',
    fabric: 'Linho, viscose de gramatura média ou mistura de algodão e linho. Evite malha e tecidos muito escorregadios.',
    yardage: 'PP–P: 2,20 m · M–G: 2,60 m (tecido de 1,40 m de largura)',
    notions: 'Linha de algodão, entretela fina para o decote, 1 botão de 12 mm (opcional)',
    pages: 26,
    measures: [
      { size: 'PP', bust: 82, waist: 64, hip: 90 },
      { size: 'P', bust: 86, waist: 68, hip: 94 },
      { size: 'M', bust: 90, waist: 72, hip: 98 },
      { size: 'G', bust: 96, waist: 78, hip: 104 },
    ],
    faq: [
      { question: 'Preciso de overloque?', answer: 'Não. O molde prevê acabamento com costura francesa ou zig-zague simples.' },
      { question: 'Serve para iniciante?', answer: 'Serve para quem já costurou pelo menos uma peça. As instruções indicam a ordem de montagem passo a passo.' },
    ],
  },
  {
    slug: 'camisa-oversized',
    name: 'Camisa Oversized',
    tagline: 'Ombro caído, bolso aplicado e punho largo. Alfaiataria leve para o dia a dia.',
    description: `Camisa de modelagem ampla com ombro caído, carcela com botões e bolso aplicado no peito. O punho é largo e pode ser dobrado.

**O que você recebe**
- Molde em A4 com escala 100% e teste de impressão
- Versão A0 para plotter
- Camadas separadas por tamanho
- Ficha técnica com entretela, posicionamento de botões e acabamento de bainha

**Dica de tecido** prefira popeline, tricoline de algodão ou linho fino. Tecidos muito fluidos mudam o caimento.`,
    priceCents: 1700,
    difficulty: 'INTERMEDIARIO',
    category: 'camisa',
    collection: 'alfaiataria',
    fabric: 'Popeline, tricoline, linho fino ou mistura de algodão.',
    yardage: 'PP–M: 1,80 m · G: 2,10 m (tecido de 1,40 m)',
    notions: '7 botões de 12 mm, entretela para colarinho, carcela e punho',
    pages: 24,
    measures: [
      { size: 'PP', bust: 84, waist: 66, hip: 92 },
      { size: 'P', bust: 88, waist: 70, hip: 96 },
      { size: 'M', bust: 92, waist: 74, hip: 100 },
      { size: 'G', bust: 98, waist: 80, hip: 106 },
    ],
    faq: [
      { question: 'O molde inclui colarinho?', answer: 'Sim, colarinho e pé de colarinho com entretela e marcação de viés.' },
    ],
  },
  {
    slug: 'saia-midi-envelope',
    name: 'Saia Midi Envelope',
    tagline: 'Transpasse lateral, cintura marcada e comprimento midi. Duas horas de costura.',
    description: `Saia midi com transpasse lateral e fechamento por botão interno. A cintura é reta e o cós tem 3 cm.

**O que você recebe**
- Molde em A4 com escala 100% e teste de impressão
- Versão A0
- Instruções de corte e montagem em português
- Tabela de medidas em centímetros

Projeto indicado para quem está começando: são poucas peças e nenhuma curva complexa.`,
    priceCents: 1500,
    difficulty: 'INICIANTE',
    category: 'saia',
    collection: 'verao',
    fabric: 'Sarja leve, linho, crepe de viscose ou alfaiataria fina.',
    yardage: 'PP–G: 1,20 m (tecido de 1,40 m)',
    notions: '1 botão interno de 18 mm, entretela para o cós, zíper invisível de 22 cm (opcional)',
    pages: 18,
    measures: [
      { size: 'PP', bust: 82, waist: 62, hip: 88 },
      { size: 'P', bust: 86, waist: 66, hip: 92 },
      { size: 'M', bust: 90, waist: 70, hip: 96 },
      { size: 'G', bust: 96, waist: 76, hip: 102 },
    ],
    faq: [
      { question: 'Preciso de zíper?', answer: 'O molde fecha com transpasse e botão. O zíper é opcional para quem quer mais segurança.' },
    ],
  },
  {
    slug: 'calca-pantalona',
    name: 'Calça Pantalona',
    tagline: 'Cintura alta, pregas frontais e perna ampla. A calça que alonga.',
    description: `Calça pantalona de cintura alta, com duas pregas frontais e bolsos laterais embutidos. O cós tem passantes e fechamento com zíper e botão.

**O que você recebe**
- Molde em A4 com escala 100% e teste de impressão
- Versão A0 para gráfica
- Camadas por tamanho
- Ficha técnica com ajuste de comprimento e ordem de montagem

É o projeto mais completo do catálogo: envolve cós, zíper, bolsos e bainha. Recomendado para quem já fez uma calça ou quer aprender com calma.`,
    priceCents: 1900,
    difficulty: 'AVANCADO',
    category: 'calca',
    collection: 'alfaiataria',
    fabric: 'Alfaiataria com elastano, sarja de algodão ou crepe de poliéster.',
    yardage: 'PP–M: 2,00 m · G: 2,30 m (tecido de 1,50 m)',
    notions: 'Zíper de 18 cm, 1 botão de 18 mm, entretela para cós e bolsos, linha de alinhavo',
    pages: 32,
    measures: [
      { size: 'PP', bust: 82, waist: 62, hip: 88 },
      { size: 'P', bust: 86, waist: 66, hip: 92 },
      { size: 'M', bust: 90, waist: 70, hip: 96 },
      { size: 'G', bust: 96, waist: 76, hip: 102 },
    ],
    faq: [
      { question: 'Dá para fazer sem zíper?', answer: 'Não recomendo: a cintura alta pede abertura. O molde já inclui a marcação do zíper.' },
      { question: 'O molde tem bolso?', answer: 'Sim, bolso lateral embutido com vista e forro em algodão.' },
    ],
  },
  {
    slug: 'blusa-ombro-fluido',
    name: 'Blusa Ombro Fluido',
    tagline: 'Manga ampla, decote canoa e caimento leve. Projeto de uma tarde.',
    description: `Blusa de decote canoa e manga ampla, com caimento fluido e bainha curva. São apenas três peças: frente, costas e mangas.

**O que você recebe**
- Molde em A4 com escala 100% e teste de impressão
- Versão A0
- Instruções ilustradas de montagem
- Tabela de medidas

**Indicado para** quem está na primeira ou segunda peça: não tem zíper, não tem pences e o acabamento é simples.`,
    priceCents: 1200,
    difficulty: 'INICIANTE',
    category: 'blusa',
    collection: 'verao',
    fabric: 'Viscose, crepe georgette, seda sintética ou malha fina de algodão.',
    yardage: 'PP–G: 1,40 m (tecido de 1,40 m)',
    notions: 'Linha fina, entretela para o decote (opcional)',
    pages: 16,
    measures: [
      { size: 'PP', bust: 82, waist: 64, hip: 90 },
      { size: 'P', bust: 86, waist: 68, hip: 94 },
      { size: 'M', bust: 90, waist: 72, hip: 98 },
      { size: 'G', bust: 96, waist: 78, hip: 104 },
    ],
    faq: [
      { question: 'Serve para malha?', answer: 'Serve para malha fina com pouca elasticidade. Malha muito elástica pede ajuste no molde.' },
    ],
  },
  {
    slug: 'shorts-alfaiataria',
    name: 'Shorts Alfaiataria',
    tagline: 'Cós reto, prega única e comprimento médio. Do trabalho ao fim de semana.',
    description: `Shorts de alfaiataria com cós reto, uma prega frontal e bolsos laterais. O comprimento fica no meio da coxa.

**O que você recebe**
- Molde em A4 com escala 100% e teste de impressão
- Versão A0
- Camadas por tamanho
- Ficha técnica com ajuste de quadril

Projeto rápido, com acabamento de cós e bainha simples.`,
    priceCents: 1400,
    difficulty: 'INICIANTE',
    category: 'shorts',
    collection: 'verao',
    fabric: 'Sarja de algodão, linho médio, alfaiataria leve.',
    yardage: 'PP–G: 1,10 m (tecido de 1,40 m)',
    notions: 'Zíper de 15 cm, 1 botão de 18 mm, entretela para cós',
    pages: 20,
    measures: [
      { size: 'PP', bust: 82, waist: 62, hip: 88 },
      { size: 'P', bust: 86, waist: 66, hip: 92 },
      { size: 'M', bust: 90, waist: 70, hip: 96 },
      { size: 'G', bust: 96, waist: 76, hip: 102 },
    ],
    faq: [
      { question: 'Tem forro?', answer: 'Não. O molde é para shorts sem forro, com acabamento de cós e bainha.' },
    ],
  },
];

const legalDraftNotice =
  '> **Rascunho para revisão jurídica.** Este texto foi escrito como ponto de partida e precisa ser validado por advogado antes da publicação. Ajuste prazos, dados da empresa e condições conforme o seu caso.\n\n';

const pages = [
  {
    slug: 'sobre',
    title: 'Sobre o ateliê',
    excerpt: 'Moldes digitais feitos com cuidado de ateliê, para costurar em casa.',
    contentMd: `## Costurar começa no molde

A FioForma nasceu de uma ideia simples: um molde bem desenhado economiza tecido, tempo e frustração. Cada arquivo traz o que você precisa saber antes de cortar, escrito com clareza e em português.

## Como trabalhamos

Os primeiros moldes da loja são de modelagem geométrica — saias de círculo e de retângulo, avental, bolsa e nécessaire — calculados com precisão a partir de uma tabela de medidas única, do PP ao GG. Cada PDF tem teste de escala, folhas numeradas com mapa de montagem, plano de corte e passo a passo.

## O que você leva

- PDF A4 para imprimir em casa e, nos moldes com peças grandes, PDF A0 para gráfica
- Ficha técnica com tecido, metragem por tamanho e aviamentos
- Tabela de medidas em centímetros
- Re-download ilimitado na sua biblioteca`,
    status: 'PUBLISHED' as const,
    kind: 'PAGE' as const,
  },
  {
    slug: 'guias',
    title: 'Guias de impressão e costura',
    excerpt: 'Como imprimir o molde na escala certa, unir as folhas e escolher o tamanho.',
    contentMd: `## Antes de imprimir

Imprima sempre em **escala 100%** (ou "tamanho real"). Nunca use "ajustar à página": isso reduz o molde e a peça não veste.

## O teste de impressão

Antes das folhas do molde, o PDF traz uma página de teste com um quadrado de 5 × 5 cm e uma régua de 10 cm. Imprima só essa página e meça: se estiver menor ou maior, ajuste a escala do seu leitor de PDF antes de imprimir o resto.

## Unindo as folhas

1. Cada folha tem um nome: a letra é a coluna e o número é a linha (A1, A2, B1…). A página de teste mostra o mapa.
2. Corte a margem branca da esquerda e de cima de cada folha.
3. Apoie a folha sobre a vizinha, encostando a borda na linha tracejada a 1 cm da beirada, e confira se os traços continuam.
4. Cole com fita adesiva fina e recorte o contorno do seu tamanho — cada tamanho tem um tipo de traço, explicado na legenda.

## Escolhendo o tamanho

Meça o corpo sem roupa por cima e compare com a tabela do molde. Entre dois tamanhos, escolha o maior: é mais fácil ajustar para dentro do que para fora.

## Peças retangulares

Quando a peça é um retângulo (cós, alças, painéis de saia franzida), o molde não manda folhas: a ficha e o plano de corte trazem as medidas exatas, já com margem. Marque direto no avesso do tecido com régua e giz.

## Impressão em gráfica

Nos moldes com peças grandes há um PDF A0: uma folha só, sem emendas. Peça impressão em tamanho real e confira o quadrado de 5 cm antes de cortar.`,
    status: 'PUBLISHED' as const,
    kind: 'PAGE' as const,
  },
  {
    slug: 'faq',
    title: 'Perguntas frequentes',
    excerpt: 'Dúvidas sobre arquivos, impressão, licença de uso e re-download.',
    contentMd: `## Como recebo o molde?

O download fica disponível na sua biblioteca assim que o pagamento é confirmado. Você também recebe um e-mail com o link.

## Posso imprimir em casa?

Sim. Todos os moldes têm versão A4 com teste de impressão e instruções de montagem.

## Posso vender as peças que costurar?

Sim, sem limite de peças. O que não pode é compartilhar, revender ou redistribuir o arquivo em PDF.

## Perdi o arquivo. Pago de novo?

Não. O re-download é ilimitado na sua biblioteca, enquanto a loja existir.

## Consigo abrir no celular?

Sim, mas imprimir pelo computador é mais seguro para manter a escala.

## E se o molde não servir?

Confira a tabela de medidas antes de comprar e a tabela de ajustes na ficha técnica. Se ainda tiver dúvida, fale com o suporte.`,
    status: 'PUBLISHED' as const,
    kind: 'PAGE' as const,
  },
  {
    slug: 'licenca',
    title: 'Licença de uso',
    excerpt: 'O que você pode e o que não pode fazer com os moldes.',
    contentMd: `${legalDraftNotice}## O que está incluído

Ao comprar um molde, você recebe uma licença pessoal, vitalícia e não exclusiva para usar o arquivo.

## Você pode

- Costurar quantas peças quiser, para uso próprio ou para vender.
- Vender as peças prontas em loja física, online ou sob encomenda, sem limite de unidades.
- Imprimir o molde quantas vezes precisar, em casa ou em gráfica.
- Adaptar o molde para o seu corpo ou para o seu estilo.

## Você não pode

- Compartilhar, doar, vender ou redistribuir o arquivo em PDF.
- Publicar o arquivo em grupos, drives, marketplaces ou redes sociais.
- Usar o molde para criar um curso pago que entregue o arquivo.
- Revender o molde como produto digital, mesmo alterado.

## Crédito

O crédito ao ateliê nas peças vendidas é bem-vindo, mas não obrigatório.

## Dúvidas

Se a sua situação não estiver prevista aqui, fale com o suporte antes de usar.`,
    status: 'PUBLISHED' as const,
    kind: 'PAGE' as const,
  },
  {
    slug: 'termos',
    title: 'Termos de compra',
    excerpt: 'Condições de compra, entrega digital e responsabilidades.',
    contentMd: `${legalDraftNotice}## Objeto

Este site vende moldes de costura em formato digital (PDF). Não há envio de produto físico.

## Cadastro e compra

A compra pode ser feita como visitante ou com conta. Os dados informados são usados para entregar o arquivo, emitir comprovante e prestar suporte.

## Pagamento

Aceitamos Pix e cartão de crédito por meio do Mercado Pago. O pedido é confirmado somente após a aprovação do pagamento pelo gateway.

## Entrega

A entrega é digital e automática. O acesso fica disponível na biblioteca e o link também é enviado por e-mail.

## Preço

Os preços são em reais e incluem os impostos aplicáveis. O valor cobrado é sempre o exibido no checkout no momento da compra.

## Suporte

Problemas de download, arquivo corrompido ou dúvida de impressão são resolvidos pelo canal de atendimento informado no site.

## Foro

Aplica-se a legislação brasileira, em especial o Código de Defesa do Consumidor.`,
    status: 'PUBLISHED' as const,
    kind: 'PAGE' as const,
  },
  {
    slug: 'privacidade',
    title: 'Política de privacidade',
    excerpt: 'Como tratamos seus dados, conforme a LGPD.',
    contentMd: `${legalDraftNotice}## Quais dados coletamos

- Nome, e-mail e telefone informados na compra ou no contato.
- Histórico de pedidos, downloads e acessos à conta.
- Dados técnicos de navegação, como endereço IP (armazenado de forma anonimizada) e tipo de dispositivo.

## Para que usamos

- Entregar os arquivos comprados e manter sua biblioteca.
- Enviar confirmações, links de acesso e avisos sobre o pedido.
- Prestar suporte e cumprir obrigações fiscais.
- Enviar novidades, apenas se você autorizar.

## Com quem compartilhamos

Apenas com prestadores necessários para a operação: gateway de pagamento (Mercado Pago), serviço de e-mail e hospedagem. Não vendemos dados.

## Seus direitos

Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados. Basta escrever para o e-mail de suporte. Pedidos de exclusão não apagam registros fiscais obrigatórios.

## Cookies

Usamos cookies essenciais para sessão e carrinho. Cookies de medição só são ativados com consentimento.

## Segurança

Senhas são armazenadas com hash, downloads exigem autenticação e o acesso aos arquivos é registrado.`,
    status: 'PUBLISHED' as const,
    kind: 'PAGE' as const,
  },
  {
    slug: 'reembolso',
    title: 'Política de reembolso',
    excerpt: 'Como funciona o arrependimento em produtos digitais.',
    contentMd: `${legalDraftNotice}## Produto digital

Por ser um arquivo digital entregue imediatamente, a compra é definitiva depois do download. Ainda assim, queremos resolver qualquer problema.

## Quando devolvemos

- Arquivo corrompido ou ilegível que não conseguimos substituir.
- Molde com erro de modelagem confirmado pela equipe.
- Cobrança duplicada ou pagamento aprovado sem entrega.

## Quando não devolvemos

- Dúvida de tamanho resolvida pela tabela de medidas disponível na página do produto.
- Expectativa de resultado que depende de tecido, ajuste ou habilidade de costura.
- Arquivo já baixado e usado, fora dos casos acima.

## Como pedir

Escreva para o e-mail de suporte em até 7 dias corridos após a compra, informando o número do pedido e o problema. Respondemos em até 2 dias úteis.

## Prazo do estorno

O estorno é processado pelo Mercado Pago e pode levar de 5 a 10 dias úteis para aparecer na fatura, conforme o meio de pagamento.`,
    status: 'PUBLISHED' as const,
    kind: 'PAGE' as const,
  },
  {
    slug: 'como-escolher-o-tamanho',
    title: 'Como escolher o tamanho sem errar',
    excerpt: 'Três medidas, uma tabela e um truque simples para acertar de primeira.',
    contentMd: `## Meça o corpo, não a roupa

Use fita métrica de costura, sem roupa por cima e sem apertar. Anote circunferência de busto, cintura e quadril.

## Compare com a tabela do molde

Cada molde tem a própria tabela, porque a modelagem muda. Compare suas medidas com a tabela da página do produto, não com a de outra peça.

## Entre dois tamanhos

Escolha o maior. Ajustar para dentro é simples; para fora, nem sempre.

## Confira a folga de modelagem

A tabela mostra as medidas do corpo. A folga (o espaço entre corpo e tecido) já está no molde e varia conforme o caimento: solto, justo ou reto.

## Faça uma prova em tecido barato

Antes de cortar o tecido final, costure uma prova em algodão cru ou lençol velho. É o jeito mais rápido de descobrir se o caimento é o que você quer.`,
    status: 'PUBLISHED' as const,
    kind: 'POST' as const,
  },
  {
    slug: 'imprimir-molde-em-casa',
    title: 'Imprimir molde em casa: o guia sem drama',
    excerpt: 'Escala, papel, colagem e o teste que evita retrabalho.',
    contentMd: `## 1. Escala 100%

No leitor de PDF, escolha "tamanho real" ou "100%". Desmarque "ajustar à página".

## 2. Papel

Papel sulfite 75 g resolve. Para moldes muito grandes, 90 g ajuda a não enrugar na hora de colar.

## 3. Teste de impressão

Meça o quadrado de 5 cm da primeira página. Se estiver errado, ajuste a escala e imprima de novo — antes de gastar tinta no molde inteiro.

## 4. Colagem

Corte as margens direita e inferior, alinhe pelas letras e cole com fita fina. Confira as linhas de encaixe antes de recortar.

## 5. Recorte

Recorte o tamanho escolhido. Se quiser guardar todos os tamanhos, use papel manteiga para copiar o contorno.

## 6. Guarde o arquivo

Dobre ou enrole sem vincar as linhas de costura. O arquivo continua na sua biblioteca para reimprimir quando quiser.`,
    status: 'PUBLISHED' as const,
    kind: 'POST' as const,
  },
  {
    slug: 'tecidos-para-comecar',
    title: 'Tecidos para começar a costurar sem susto',
    excerpt: 'O que é fácil de cortar, de costurar e de passar — e o que evitar no início.',
    contentMd: `## Fáceis

**Algodão e tricoline** não escorregam, aceitam bem o ferro e perdoam pontos tortos. **Sarja leve** tem corpo e ajuda o caimento.

## Intermediários

**Linho** amassa e desfia, mas o resultado compensa. **Viscose** tem caimento bonito e exige cuidado no corte.

## Difíceis no começo

**Seda**, **georgette** e **malha muito elástica** escorregam ou esticam. Deixe para depois de duas ou três peças.

## Sempre lave antes

Lave e seque o tecido antes de cortar. A maioria encolhe na primeira lavagem, e o molde foi calculado com o tecido já estabilizado.

## Teste de caimento

Dobre o tecido e veja se ele cai com o corpo que você quer. Se estiver muito mole, use entretela leve ou escolha outro tecido.`,
    status: 'PUBLISHED' as const,
    kind: 'POST' as const,
  },
];

/* ------------------------------------------------------------------ */
/* Seed                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@fioforma.com.br').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'FioForma@2026';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: 'Equipe FioForma',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      emailVerifiedAt: new Date(),
    },
    update: { role: 'ADMIN' },
  });
  console.log(`admin: ${admin.email}`);

  const collectionIds = new Map<string, string>();
  for (const collection of collections) {
    const row = await prisma.collection.upsert({
      where: { slug: collection.slug },
      create: { ...collection, published: true },
      update: { name: collection.name, description: collection.description, sortOrder: collection.sortOrder },
    });
    collectionIds.set(collection.slug, row.id);
  }

  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name, sortOrder: category.sortOrder },
    });
    categoryIds.set(category.slug, row.id);
  }
  console.log(`catálogo: ${collections.length} coleções, ${categories.length} categorias`);

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        priceCents: item.priceCents,
        difficulty: item.difficulty,
        status: 'PUBLISHED',
        isDemo: true,
        sizesIncluded: JSON.stringify(sizes),
        categoryId: categoryIds.get(item.category) ?? null,
        collectionId: collectionIds.get(item.collection) ?? null,
        seoTitle: `${item.name} — molde de costura em PDF`,
        seoDescription: item.tagline,
        publishedAt: new Date(),
      },
      update: {
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        priceCents: item.priceCents,
        difficulty: item.difficulty,
        categoryId: categoryIds.get(item.category) ?? null,
        collectionId: collectionIds.get(item.collection) ?? null,
      },
    });

    await prisma.productSpec.upsert({
      where: { productId: product.id },
      create: {
        productId: product.id,
        fabricRecommendation: item.fabric,
        yardage: item.yardage,
        notions: item.notions,
        seamAllowance: '1 cm incluso em todas as bordas',
        includedFormats: JSON.stringify(['A4', 'A0', 'PROJETOR']),
        layersAvailable: true,
        projectorAvailable: true,
        pageCount: item.pages,
        printInstructions:
          'Imprima em escala 100% (tamanho real). Confira o quadrado de 5 cm na primeira página antes de cortar. Una as folhas pelas letras de referência.',
        faq: JSON.stringify(item.faq),
      },
      update: {
        fabricRecommendation: item.fabric,
        yardage: item.yardage,
        notions: item.notions,
        pageCount: item.pages,
        faq: JSON.stringify(item.faq),
      },
    });

    const existingChart = await prisma.sizeChart.findFirst({ where: { productId: product.id } });
    if (!existingChart) {
      await prisma.sizeChart.create({
        data: {
          productId: product.id,
          title: 'Tabela de medidas',
          unit: 'cm',
          notes: 'Medidas do corpo, em centímetros. A folga de modelagem já está incluída no molde.',
          rows: {
            create: item.measures.map((measure, index) => ({
              size: measure.size,
              bustCm: measure.bust,
              waistCm: measure.waist,
              hipCm: measure.hip,
              sortOrder: index,
            })),
          },
        },
      });
    }

    const existingFile = await prisma.productFile.findFirst({ where: { productId: product.id } });
    if (!existingFile) {
      const pdf = demoPdf(`${item.name} (${item.slug})`);
      const checksum = createHash('sha256').update(pdf).digest('hex');
      const media = await prisma.mediaAsset.create({
        data: {
          storageKey: `demo/${item.slug}-a4.pdf`,
          fileName: `${item.slug}-a4-demo.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: pdf.byteLength,
          visibility: 'PRIVATE',
          driver: 'db',
          data: new Uint8Array(pdf),
        },
      });
      await prisma.productFile.create({
        data: {
          productId: product.id,
          mediaId: media.id,
          fileName: `${item.slug}-a4.pdf`,
          format: 'A4' as FileFormat,
          pages: 1,
          sizeBytes: pdf.byteLength,
          checksum,
        },
      });
    }
  }
  console.log(`produtos demo: ${products.length}`);

  // Os demonstrativos saem da loja (ficam como rascunho) e entram os moldes reais.
  const hidden = await prisma.product.updateMany({ where: { isDemo: true }, data: { status: 'DRAFT' } });
  console.log(`demos ocultos: ${hidden.count}`);
  const moldes = await seedMoldes(prisma);
  console.log(`moldes reais: ${moldes.created} criados, ${moldes.updated} atualizados`);

  const postSlugs = pages.filter((page) => page.kind === 'POST').map((page) => page.slug);
  for (const page of pages) {
    // posts do blog com datas espaçadas (7, 14, 21 dias atrás) na primeira criação
    const postIndex = postSlugs.indexOf(page.slug);
    const publishedAt =
      postIndex >= 0 ? new Date(Date.now() - (postSlugs.length - postIndex) * 7 * 24 * 60 * 60 * 1000) : new Date();
    await prisma.page.upsert({
      where: { slug: page.slug },
      create: {
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        contentMd: page.contentMd,
        kind: page.kind,
        status: page.status,
        seoTitle: page.title,
        seoDescription: page.excerpt,
        publishedAt,
      },
      update: {
        title: page.title,
        excerpt: page.excerpt,
        contentMd: page.contentMd,
        kind: page.kind,
        status: page.status,
      },
    });
  }
  console.log(`páginas e posts: ${pages.length}`);

  await prisma.coupon.upsert({
    where: { code: 'BEMVINDA10' },
    create: {
      code: 'BEMVINDA10',
      type: 'PERCENT',
      value: 10,
      active: true,
      maxRedemptions: 50,
    },
    update: {},
  });

  await prisma.setting.upsert({
    where: { key: 'store.announcement' },
    create: { key: 'store.announcement', value: '' },
    update: {},
  });

  console.log('seed concluído');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
