import type { Molde } from '../geometria';
import { aventalRetro } from './avental-retro';
import { bolsaTote } from './bolsa-tote';
import { necessaireBox } from './necessaire-box';
import { saiaFranzida } from './saia-franzida';
import { saiaGode } from './saia-gode';

/** Os moldes publicados, na ordem do número do modelo. */
export const moldes: Molde[] = [saiaGode, saiaFranzida, aventalRetro, bolsaTote, necessaireBox];
