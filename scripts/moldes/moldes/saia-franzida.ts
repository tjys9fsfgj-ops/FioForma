import type { Molde } from '../geometria';
import { BODY, SEAM_MM, SIZES } from '../medidas';

const LENGTH_MM = 600;
const CHANNEL_MM = 40;
const HEM_MM = 10;

const panel = (hipCm: number) => ({
  widthMm: Math.round((hipCm * 10 * 1.5) / 2) + 2 * SEAM_MM,
  heightMm: LENGTH_MM + CHANNEL_MM + HEM_MM,
});

export const saiaFranzida: Molde = {
  number: '002',
  slug: 'saia-franzida',
  name: 'Saia Franzida com Elástico',
  shortName: 'Saia Franzida',
  tagline: 'Dois retângulos, um elástico e uma tarde. A saia midi que vai com tudo.',
  description: `Saia de cintura elástica e franzido leve, sem zíper e sem botão. O molde vem com as medidas exatas de corte por tamanho — você corta direto no tecido, sem imprimir folhas.

**O que você recebe**
- Medidas de corte de cada retângulo, do PP ao GG
- Comprimento do elástico por tamanho
- Plano de corte e passo a passo ilustrado
- PDF A4

**Indicado para** quem está começando: são só costuras retas.`,
  priceCents: 900,
  category: 'saia',
  sizes: [...SIZES],
  yardageNote: 'comprimento final de 60 cm',
  variants: [
    {
      id: 'unica',
      label: 'saia franzida',
      pieces: [],
      directCuts: [
        {
          name: 'Painel (frente e costas)',
          cut: 'Corte 2× no fio',
          count: 2,
          ...panel(BODY.M.hip),
          note: 'Largura = metade de 1,5× o quadril + margens. Altura = 60 cm + 4 cm de canal + 1 cm de barra.',
          bySize: Object.fromEntries(SIZES.map((size) => [size, panel(BODY[size].hip)])),
        },
      ],
    },
  ],
  chart: {
    title: 'Medidas do corpo',
    notes: 'Escolha pelo quadril: a saia precisa passar por ele. A cintura indica o elástico.',
    rows: SIZES.map((size) => ({
      size,
      waistCm: BODY[size].waist,
      hipCm: BODY[size].hip,
      extra: [{ label: 'Elástico', value: `${BODY[size].waist - 5} cm` }],
    })),
  },
  fabric: 'Tecidos leves e médios: viscose, tricoline, linho, cambraia, crepe.',
  notions: 'Elástico de 2,5 cm de largura (comprimento na tabela), alfinete de segurança, linha.',
  steps: [
    { title: 'Corte', text: 'Corte dois retângulos com as medidas do seu tamanho. Não precisa imprimir folhas para esta saia.' },
    { title: 'Laterais', text: 'Una os dois retângulos pelas laterais, direito com direito, a 1 cm. Chuleie ou faça costura francesa.' },
    {
      title: 'Canal do elástico',
      text: 'Dobre 1 cm e depois 3 cm para o avesso no topo. Costure rente à primeira dobra, deixando 5 cm abertos.',
    },
    { title: 'Elástico', text: 'Passe o elástico com o alfinete de segurança, sobreponha as pontas 2 cm e costure em zigue-zague.' },
    { title: 'Feche o canal', text: 'Costure os 5 cm abertos e distribua o franzido por igual.' },
    { title: 'Barra', text: 'Dobre 5 mm duas vezes e costure.' },
  ],
  faq: [
    { question: 'Preciso imprimir?', answer: 'Não. As medidas de corte estão na ficha; o PDF traz o plano de corte e o passo a passo.' },
    { question: 'Dá para fazer mais longa?', answer: 'Sim. Some na altura do retângulo o quanto quiser a mais de comprimento.' },
  ],
  flat: 'M36 22 H64 L80 104 Q50 110 20 104 Z M36 28 H64 M40 22 V28 M46 22 V28 M52 22 V28 M58 22 V28',
};
