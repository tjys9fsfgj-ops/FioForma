'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PatternPlaceholder } from './pattern-placeholder';

type GalleryImage = { id: string; mediaId: string; alt: string; kind: string };

const kindLabels: Record<string, string> = {
  PECA: 'Peça pronta',
  DETALHE: 'Detalhe',
  MOLDE: 'Prévia do molde',
};

export function Gallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-[2rem] ring-1 ring-line">
        <PatternPlaceholder label="Foto da peça" seed={0} />
      </div>
    );
  }

  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-sand ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/media/${current.mediaId}`}
          alt={current.alt || productName}
          className="h-full w-full object-cover"
        />
        <span className="absolute bottom-4 left-4 rounded-full bg-paper/90 px-3 py-1 text-[11px] font-semibold text-ink/70 backdrop-blur">
          {kindLabels[current.kind] ?? 'Foto'}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3" role="tablist" aria-label="Fotos do molde">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Ver ${kindLabels[image.kind] ?? 'foto'} ${index + 1}`}
              onClick={() => setActive(index)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-2xl border-2 bg-sand transition-colors',
                index === active ? 'border-wine' : 'border-transparent hover:border-wine/40',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${image.mediaId}`} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
