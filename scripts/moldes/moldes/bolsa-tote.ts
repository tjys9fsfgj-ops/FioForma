import { boxedCornerMm, roundedPiece, type Molde } from '../geometria';
import { SEAM_MM } from '../medidas';

const WIDTH = 400;
const HEIGHT = 380;
const DEPTH = 100;

/** Gabarito do recorte do canto boxe: metade do fundo + 1 margem (6 cm para 10 cm de fundo). */
const CORNER = boxedCornerMm(DEPTH, SEAM_MM);
const corner = roundedPiece(CORNER, CORNER, {}, 0);

/** Altura do painel = altura pronta + recorte do canto + 3 cm de bainha na boca. */
const body = { widthMm: WIDTH + 2 * SEAM_MM, heightMm: HEIGHT + CORNER + 30 };

export const bolsaTote: Molde = {
  number: '004',
  slug: 'bolsa-tote',
  name: 'Bolsa Tote',
  shortName: 'Bolsa Tote',
  tagline: 'Forrada, com fundo de 10 cm, bolso interno e alça de ombro. A bolsa de todo dia.',
  description: `Bolsa tote grande, forrada, com fundo boxe que deixa a bolsa em pé. Cabe notebook de 13", caderno e a marmita.

**O que você recebe**
- Medidas de corte de todas as partes
- Gabarito do canto boxe em tamanho real
- PDF A4 com plano de corte, gabarito e passo a passo

**Medidas prontas:** 40 cm de largura na boca, base de 30 × 10 cm, 38 cm de altura e alças de 65 cm.`,
  priceCents: 700,
  category: 'acessorios',
  sizes: ['Único'],
  yardageNote: 'tamanho único',
  variants: [
    {
      id: 'unica',
      label: 'bolsa',
      pieces: [
        {
          id: 'canto',
          name: 'Gabarito do canto boxe',
          cut: 'Use para recortar os 2 cantos de baixo do corpo e do forro',
          count: 1,
          onFold: false,
          grain: 'vertical',
          outlines: [{ label: 'Único', size: 'Único', ...corner, dash: [] }],
        },
      ],
      directCuts: [
        { name: 'Corpo', cut: 'Corte 2× no tecido externo', count: 2, ...body, note: 'Recorte um quadrado de 6 × 6 cm nos dois cantos de baixo (use o gabarito).' },
        { name: 'Forro', cut: 'Corte 2× no forro', count: 2, ...body, note: 'Mesmo recorte de canto do corpo.' },
        { name: 'Alça', cut: 'Corte 2×', count: 2, widthMm: 670, heightMm: 100, note: 'Dobrada em quatro no comprimento: fica com 2,5 cm.' },
        { name: 'Bolso interno', cut: 'Corte 1× no forro', count: 1, widthMm: 220, heightMm: 380, note: 'Dobrado ao meio: fica com 20 × 18 cm.' },
      ],
    },
  ],
  chart: {
    title: 'Medidas da peça pronta',
    notes: 'Tamanho único.',
    rows: [
      {
        size: 'Único',
        extra: [
          { label: 'Largura na boca', value: '40 cm' },
          { label: 'Base', value: '30 × 10 cm' },
          { label: 'Altura', value: '38 cm' },
          { label: 'Alça', value: '65 cm' },
        ],
      },
    ],
  },
  fabric: 'Externo: lona, sarja, brim ou linho encorpado. Forro: tricoline.',
  notions: 'Entretela média (opcional, para o corpo), linha resistente.',
  steps: [
    { title: 'Corte', text: 'Corte corpo, forro, alças e bolso pelas medidas. Use o gabarito para recortar os cantos de baixo.' },
    { title: 'Alças', text: 'Dobre as bordas até o centro, dobre de novo ao meio e pespontue os dois lados.' },
    { title: 'Bolso interno', text: 'Dobre o bolso ao meio, costure as laterais, vire e pespontue numa das peças do forro.' },
    { title: 'Corpo e forro', text: 'Costure as laterais e o fundo do corpo, deixando os recortes de canto abertos. Repita no forro, deixando 12 cm abertos no fundo.' },
    { title: 'Fundo boxe', text: 'Abra cada canto, alinhe a costura lateral com a do fundo e costure reto. O fundo fica com 10 cm.' },
    { title: 'Montagem', text: 'Alinhave as alças no corpo, coloque o corpo dentro do forro (direito com direito), costure a boca, vire pela abertura e feche.' },
    { title: 'Acabamento', text: 'Pespontue a boca da bolsa a 5 mm da borda.' },
  ],
  faq: [
    { question: 'Precisa de entretela?', answer: 'Com lona, não. Com tecidos mais finos, a entretela deixa a bolsa em pé.' },
    { question: 'Dá para fazer sem forro?', answer: 'Dá, com acabamento de viés nas costuras internas. O passo a passo considera a versão forrada.' },
  ],
  flat: 'M20 50 H80 L76 112 H24 Z M34 50 Q34 16 50 16 Q66 16 66 50 M40 50 Q40 26 50 26 Q60 26 60 50',
};
