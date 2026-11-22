import { cn } from '@/lib/utils';

/**
 * Placeholder 4:5 para as fotos que o dono ainda vai cadastrar.
 * Desenha uma peça de molde (contorno, margem de costura pontilhada, fio do tecido e piques)
 * sobre um fundo colorido, sem simular foto de produto.
 */
const tints = [
  { bg: '#D9E2D5', ink: '#7A3B3B', soft: '#B9C7B4' },
  { bg: '#F0DED5', ink: '#7A3F2E', soft: '#E3C3B3' },
  { bg: '#E9E4D6', ink: '#7A3B3B', soft: '#D4CCB6' },
  { bg: '#CBD9D0', ink: '#1B382F', soft: '#A9BFB1' },
];

export function PatternPlaceholder({
  label = 'Foto da peça',
  seed = 0,
  className,
  tone = 'paper',
}: {
  label?: string;
  seed?: number;
  className?: string;
  tone?: 'paper' | 'white';
}) {
  const tint = tints[Math.abs(seed) % tints.length];
  const bodice =
    'M72 66C86 58 114 58 128 66L152 76C158 108 152 150 148 192C122 202 78 202 52 192C48 150 42 108 48 76Z';

  return (
    <div
      className={cn('relative flex h-full w-full flex-col items-center justify-end overflow-hidden', className)}
      style={{ backgroundColor: tone === 'white' ? '#F7F6F2' : tint.bg }}
    >
      <svg
        viewBox="0 0 200 250"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle cx="168" cy="40" r="46" fill={tint.soft} opacity="0.55" />
        <circle cx="26" cy="226" r="34" fill={tint.soft} opacity="0.45" />
        <g transform="translate(-2 2)">
          <path d={bodice} fill="#FFFFFF" fillOpacity="0.55" stroke={tint.ink} strokeWidth="1.1" />
          <path
            d={bodice}
            fill="none"
            stroke={tint.ink}
            strokeWidth="0.8"
            strokeDasharray="3 3.5"
            opacity="0.55"
            transform="translate(100 130) scale(1.09) translate(-100 -130)"
          />
          <path d="M100 96V168" stroke={tint.ink} strokeWidth="0.9" />
          <path d="M100 92l-3 7h6l-3-7ZM100 172l-3-7h6l-3 7Z" fill={tint.ink} />
          <path d="M72 66v-5M128 66v-5M48 140h-5M152 140h5" stroke={tint.ink} strokeWidth="1.1" />
        </g>
      </svg>
      <span className="relative mb-4 rounded-full bg-paper/85 px-3 py-1 text-[10.5px] font-semibold tracking-[0.04em] text-ink/70 backdrop-blur">
        {label}
      </span>
    </div>
  );
}
