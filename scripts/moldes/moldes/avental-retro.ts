import { roundedPiece, type Molde } from '../geometria';
import { SEAM_MM } from '../medidas';

const bib = roundedPiece(260, 280, { tl: 40, tr: 40 }, SEAM_MM);
const skirt = roundedPiece(700, 550, { bl: 80, br: 80 }, SEAM_MM);
const pocket = roundedPiece(200, 180, { bl: 30, br: 30 }, SEAM_MM);

export const aventalRetro: Molde = {
  number: '003',
  slug: 'avental-retro',
  name: 'Avental Retrô',
  shortName: 'Avental Retrô',
  tagline: 'Peitilho de cantos redondos, bolso grande e laço nas costas. Cozinha de vó, acabamento de ateliê.',
  description: `Avental inteiro, com peitilho, alça de pescoço e tiras longas para amarrar. Os cantos arredondados dão o ar dos aventais dos anos 50.

**O que você recebe**
- Moldes do peitilho, da saia e do bolso em tamanho real
- Medidas de corte das alças e tiras
- PDF A4 e A0, plano de corte e passo a passo

**Tamanho único**, ajustável pela alça e pelo laço.`,
  priceCents: 900,
  category: 'acessorios',
  sizes: ['Único'],
  yardageNote: 'tamanho único',
  variants: [
    {
      id: 'unica',
      label: 'avental',
      pieces: [
        {
          id: 'peitilho',
          name: 'Peitilho',
          cut: 'Corte 2× (tecido e forro)',
          count: 2,
          onFold: false,
          grain: 'vertical',
          outlines: [{ label: 'Único', size: 'Único', ...bib, dash: [] }],
        },
        {
          id: 'saia',
          name: 'Saia do avental',
          cut: 'Corte 1×',
          count: 1,
          onFold: false,
          grain: 'vertical',
          outlines: [{ label: 'Único', size: 'Único', ...skirt, dash: [] }],
        },
        {
          id: 'bolso',
          name: 'Bolso',
          cut: 'Corte 2× (tecido e forro)',
          count: 2,
          onFold: false,
          grain: 'vertical',
          outlines: [{ label: 'Único', size: 'Único', ...pocket, dash: [] }],
        },
      ],
      directCuts: [
        { name: 'Alça do pescoço', cut: 'Corte 1×', count: 1, widthMm: 620, heightMm: 80, note: 'Dobrada ao meio no comprimento: fica com 3 cm.' },
        { name: 'Tira da cintura', cut: 'Corte 2×', count: 2, widthMm: 920, heightMm: 80, note: 'Dobrada ao meio no comprimento: fica com 3 cm.' },
        { name: 'Cós', cut: 'Corte 1×', count: 1, widthMm: 520, heightMm: 100, note: 'Largura final de 4 cm.' },
      ],
    },
  ],
  chart: {
    title: 'Medidas da peça pronta',
    notes: 'Tamanho único. A altura no corpo se ajusta pela alça do pescoço.',
    rows: [
      {
        size: 'Único',
        extra: [
          { label: 'Peitilho', value: '26 × 28 cm' },
          { label: 'Saia', value: '70 × 55 cm' },
          { label: 'Comprimento total', value: '87 cm' },
        ],
      },
    ],
  },
  fabric: 'Tricoline, sarja leve, linho ou algodão cru. Para o forro, tricoline.',
  notions: '0,20 m de forro para peitilho e bolso, linha. Opcional: viés pronto para enfeitar o bolso.',
  steps: [
    { title: 'Corte', text: 'Corte peitilho, bolso, saia, alça, tiras e cós conforme o plano de corte.' },
    { title: 'Alças e tiras', text: 'Dobre cada tira ao meio no comprimento, direito com direito, costure a 1 cm, vire e passe a ferro.' },
    {
      title: 'Peitilho',
      text: 'Prenda as pontas da alça do pescoço nos cantos de cima do peitilho. Costure peitilho e forro pelos lados e pelo topo, vire e passe.',
    },
    { title: 'Bolso', text: 'Costure bolso e forro em volta deixando 6 cm abertos, vire, passe e pespontue na saia.' },
    { title: 'Saia', text: 'Faça bainha de 1 cm dobrada nas laterais e na barra, acompanhando as curvas com piques.' },
    {
      title: 'Cós e montagem',
      text: 'Franza levemente o topo da saia até 50 cm. Monte o cós entre a saia e o peitilho, prendendo as tiras da cintura nas pontas.',
    },
  ],
  faq: [
    { question: 'Serve em qualquer corpo?', answer: 'Sim: o avental é ajustado pela alça do pescoço e pelo laço nas costas.' },
    { question: 'Posso fazer sem forro?', answer: 'Pode. Nesse caso, faça bainha de 1 cm em volta do peitilho e do bolso.' },
  ],
  flat: 'M37 16 H63 V44 H37 Z M37 16 L30 6 M63 16 L70 6 M30 44 H70 L80 110 H20 Z M40 62 H60 V80 H40 Z M20 44 L4 48 M80 44 L96 48',
};
