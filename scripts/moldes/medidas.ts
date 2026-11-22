/** Tabela de medidas do corpo da FioForma, em centímetros. */
export const SIZES = ['PP', 'P', 'M', 'G', 'GG'] as const;
export type Size = (typeof SIZES)[number];

export const BODY: Record<Size, { waist: number; hip: number; bust: number }> = {
  PP: { waist: 62, hip: 88, bust: 82 },
  P: { waist: 66, hip: 92, bust: 86 },
  M: { waist: 70, hip: 96, bust: 90 },
  G: { waist: 76, hip: 102, bust: 96 },
  GG: { waist: 82, hip: 108, bust: 102 },
};

/** Margem de costura inclusa em todas as bordas, em milímetros. */
export const SEAM_MM = 10;

/** Largura de tecido usada no cálculo de metragem, em milímetros. */
export const FABRIC_WIDTH_MM = 1500;

/** Traço de cada tamanho no molde (padrão de tracejado em mm). */
export const SIZE_DASH: Record<string, number[]> = {
  PP: [],
  P: [6, 3],
  M: [2, 2],
  G: [8, 2, 2, 2],
  GG: [12, 4],
  Único: [],
};
