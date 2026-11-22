import { foldWedge, type Molde, type Outline, type Variant } from '../geometria';
import { BODY, SEAM_MM, SIZES, SIZE_DASH } from '../medidas';

const LENGTHS_CM = [50, 60, 70];
/** Folga na cintura: o viés do godê cede, 1 cm basta. */
const EASE_MM = 10;

/** totalAngle: 360 (godê inteiro) ou 180 (meio-godê), dividido entre `pieces` peças. */
function outlines(pieces: number, totalAngle: number): Outline[] {
  // cada peça aberta cobre totalAngle/peças; desenhamos metade (na dobra)
  const openAngle = totalAngle / pieces;
  const drawnAngle = openAngle / 2;
  const list: Outline[] = [];
  for (const size of SIZES) {
    const waistSeam = BODY[size].waist * 10 + EASE_MM;
    // círculo completo de cintura = cintura × (360 / ângulo total da saia)
    const r = (waistSeam * (360 / totalAngle)) / (2 * Math.PI);
    for (const length of LENGTHS_CM) {
      const { seam, cut } = foldWedge(r, r + length * 10, drawnAngle, SEAM_MM);
      list.push({ label: `${size} · ${length} cm`, size, seam, cut, dash: SIZE_DASH[size] });
    }
  }
  return list;
}

export const saiaGode: Molde = {
  number: '001',
  slug: 'saia-gode',
  name: 'Saia Godê',
  shortName: 'Saia Godê',
  tagline: 'Godê inteiro ou meio-godê, três comprimentos, cós com botão. O clássico que roda.',
  description: `Uma saia de cintura marcada e barra que gira, desenhada só com círculos — por isso o molde fecha certinho na cintura, sem prova.

**O que você recebe**
- Duas versões no mesmo download: **godê inteiro** (muito volume) e **meio-godê** (volume moderado)
- Três comprimentos marcados na mesma peça: 50, 60 e 70 cm
- PDF A4 para imprimir em casa, com teste de escala e mapa de montagem das folhas
- PDF A0 para imprimir em gráfica numa folha só
- Ficha com metragem por tamanho, plano de corte e passo a passo

**Indicado para** primeira saia: são poucas peças, só costuras retas e um cós.`,
  priceCents: 0,
  category: 'saia',
  sizes: [...SIZES],
  yardageNote: 'para o comprimento de 70 cm; comprimentos menores gastam menos',
  variants: (
    [
    {
      id: 'inteira',
      label: 'godê inteiro',
      pieces: [
        {
          id: 'saia',
          name: 'Saia (godê inteiro)',
          cut: 'Corte 4× com a borda reta indicada na dobra',
          count: 4,
          onFold: true,
          grain: 'horizontal',
          outlines: outlines(4, 360),
        },
      ],
      directCuts: [],
    },
    {
      id: 'meia',
      label: 'meio-godê',
      pieces: [
        {
          id: 'saia',
          name: 'Saia (meio-godê)',
          cut: 'Corte 2× com a borda reta indicada na dobra',
          count: 2,
          onFold: true,
          grain: 'horizontal',
          outlines: outlines(2, 180),
        },
      ],
      directCuts: [],
    },
    ] satisfies Variant[]
  ).map((variant) => ({
    ...variant,
    directCuts: [
      {
        name: 'Cós',
        cut: 'Corte 1× no fio',
        count: 1,
        widthMm: BODY.M.waist * 10 + EASE_MM + 30 + 2 * SEAM_MM,
        heightMm: 80,
        note: 'Comprimento = cintura + 1 cm de folga (a mesma da saia) + 3 cm de transpasse + margens. Largura final de 3 cm, dobrado ao meio.',
        bySize: Object.fromEntries(
          SIZES.map((size) => [size, { widthMm: BODY[size].waist * 10 + EASE_MM + 30 + 2 * SEAM_MM, heightMm: 80 }]),
        ),
      },
    ],
  })),
  chart: {
    title: 'Medidas do corpo',
    notes: 'Escolha o tamanho pela cintura. Os três comprimentos são medidos da cintura até a barra, sem o cós.',
    rows: SIZES.map((size) => ({
      size,
      waistCm: BODY[size].waist,
      hipCm: BODY[size].hip,
      extra: [{ label: 'Comprimentos', value: '50 · 60 · 70 cm' }],
    })),
  },
  fabric:
    'Tecidos com caimento: viscose, crepe, tricoline, linho leve ou cetim. Evite tecidos muito encorpados no godê inteiro.',
  notions: 'Zíper invisível de 20 cm, 1 botão de 15 mm, 0,10 m de entretela para o cós, linha.',
  steps: [
    {
      title: 'Prepare o molde',
      text: 'Imprima em escala 100%, confira o quadrado de 5 cm e monte as folhas pelo mapa. Recorte a linha do seu tamanho e do comprimento escolhido.',
    },
    {
      title: 'Corte',
      text: 'Dobre o tecido e apoie a borda reta marcada "DOBRA" exatamente na dobra. Corte as peças da saia e o cós conforme o plano de corte.',
    },
    {
      title: 'Deixe o viés assentar',
      text: 'Pendure as peças por 24 horas antes de costurar. O viés estica e, se você pular essa etapa, a barra fica desigual.',
    },
    {
      title: 'Costure as laterais',
      text: 'Una as peças pelas laterais, direito com direito, a 1 cm. Deixe 20 cm abertos no topo de uma das laterais para o zíper.',
    },
    {
      title: 'Zíper',
      text: 'Pregue o zíper invisível na abertura e feche o restante da costura logo abaixo dele.',
    },
    {
      title: 'Cós',
      text: 'Cole a entretela no cós, costure o cós na cintura, dobre ao meio e feche pelo avesso. Faça a casa e pregue o botão no transpasse.',
    },
    {
      title: 'Barra',
      text: 'Vista e confira o comprimento. Faça barra de 1 cm dobrada duas vezes (5 mm + 5 mm).',
    },
  ],
  faq: [
    {
      question: 'Qual a diferença entre godê inteiro e meio-godê?',
      answer: 'O godê inteiro é um círculo completo: gira muito e gasta mais tecido. O meio-godê é meio círculo: menos volume, caimento mais discreto.',
    },
    {
      question: 'Por que é grátis?',
      answer: 'É o nosso molde de boas-vindas, para você conhecer como são os arquivos da FioForma antes de comprar.',
    },
  ],
  flat: 'M34 22 H66 L84 104 Q50 112 16 104 Z M34 29 H66',
};
