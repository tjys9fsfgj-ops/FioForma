import { boxedCornerMm, roundedPiece, type Molde, type Outline } from '../geometria';
import { SEAM_MM, SIZE_DASH } from '../medidas';

/** comprimento × altura × fundo, em mm */
const DIMS = { P: { l: 220, h: 140, d: 80 }, M: { l: 260, h: 160, d: 100 } } as const;
type NecSize = keyof typeof DIMS;
const SIZES: NecSize[] = ['P', 'M'];

const corner = (s: NecSize) => boxedCornerMm(DIMS[s].d, SEAM_MM);
/** Altura do painel = altura pronta + recorte do canto + margem do zíper. */
const panel = (s: NecSize) => ({ widthMm: DIMS[s].l + 2 * SEAM_MM, heightMm: DIMS[s].h + corner(s) + SEAM_MM });

const cornerOutlines: Outline[] = SIZES.map((s) => ({
  label: s,
  size: s,
  ...roundedPiece(corner(s), corner(s), {}, 0),
  dash: SIZE_DASH[s],
}));

export const necessaireBox: Molde = {
  number: '005',
  slug: 'necessaire-box',
  name: 'Nécessaire Box',
  shortName: 'Nécessaire',
  tagline: 'Forrada, com zíper e fundo quadrado que fica em pé. Em dois tamanhos.',
  description: `Nécessaire de fundo boxe, forrada, com abas no zíper para um acabamento limpo nas pontas. Boa para treinar zíper.

**O que você recebe**
- Dois tamanhos: P (zíper de 22 cm, 14 cm de altura, base 14 × 8 cm) e M (zíper de 26 cm, 16 cm de altura, base 16 × 10 cm)
- Medidas de corte e gabarito do canto boxe
- PDF A4 com plano de corte, gabarito e passo a passo`,
  priceCents: 700,
  category: 'acessorios',
  sizes: SIZES,
  yardageNote: 'por tamanho',
  variants: [
    {
      id: 'unica',
      label: 'nécessaire',
      pieces: [
        {
          id: 'canto',
          name: 'Gabarito do canto boxe',
          cut: 'Use para recortar os 2 cantos de baixo de cada painel',
          count: 1,
          onFold: false,
          grain: 'vertical',
          outlines: cornerOutlines,
        },
      ],
      directCuts: [
        { name: 'Painel externo', cut: 'Corte 2×', count: 2, ...panel('M'), bySize: { P: panel('P'), M: panel('M') } },
        { name: 'Forro', cut: 'Corte 2×', count: 2, ...panel('M'), bySize: { P: panel('P'), M: panel('M') } },
        { name: 'Aba do zíper', cut: 'Corte 2×', count: 2, widthMm: 40, heightMm: 60, note: 'Dobrada ao meio: cobre as pontas do zíper.' },
      ],
    },
  ],
  chart: {
    title: 'Medidas da peça pronta',
    notes: 'O comprimento é medido na linha do zíper; a base fica menor por causa do fundo boxe.',
    rows: SIZES.map((s) => ({
      size: s,
      extra: [
        { label: 'Comprimento (zíper)', value: `${DIMS[s].l / 10} cm` },
        { label: 'Altura', value: `${DIMS[s].h / 10} cm` },
        { label: 'Base', value: `${(DIMS[s].l - DIMS[s].d) / 10} × ${DIMS[s].d / 10} cm` },
        { label: 'Zíper', value: `${DIMS[s].l / 10 + 5} cm` },
      ],
    })),
  },
  fabric: 'Externo: lona leve, sarja, linho ou tecido plastificado. Forro: tricoline ou nylon.',
  notions: 'Zíper comum (comprimento na tabela), entretela leve (opcional), linha.',
  steps: [
    { title: 'Corte', text: 'Corte painéis, forro e abas com as medidas do seu tamanho. Recorte os cantos de baixo com o gabarito.' },
    { title: 'Abas do zíper', text: 'Dobre as abas ao meio e costure uma em cada ponta do zíper.' },
    { title: 'Zíper', text: 'Monte um sanduíche: painel externo, zíper e forro. Costure, vire e pespontue. Repita no outro lado.' },
    { title: 'Laterais e fundo', text: 'Abra o zíper até a metade. Costure os painéis externos entre si e os forros entre si, deixando 8 cm abertos no fundo do forro.' },
    { title: 'Fundo boxe', text: 'Abra cada canto recortado, alinhe as costuras e costure reto. Faça nos quatro cantos.' },
    { title: 'Acabamento', text: 'Vire pela abertura do forro, feche a abertura com pesponto rente e ajuste os cantos.' },
  ],
  faq: [
    { question: 'Qual zíper uso?', answer: 'Zíper comum de nylon, 5 cm maior que o comprimento da nécessaire.' },
    { question: 'Posso usar tecido plastificado?', answer: 'Pode. Use agulha 90 e não passe ferro no plastificado.' },
  ],
  flat: 'M18 52 H82 V100 H18 Z M18 52 L30 40 H94 L82 52 M94 40 V88 L82 100 M24 58 H76',
};
