'use client';

import { useState } from 'react';
import { Mat } from '@/components/ui/mat';
import { cn } from '@/lib/utils';

type GalleryImage = { id: string; mediaId: string; alt: string; kind: string };

export function Gallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <Mat>
        <span className="flex h-full items-center justify-center font-serif text-[20px] italic text-muted">{productName}</span>
      </Mat>
    );
  }

  const current = images[active] ?? images[0];

  return (
    <div className="mx-auto max-w-[560px]">
      <Mat>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/media/${current.mediaId}`} alt={current.alt || productName} className="h-full w-full object-cover" />
      </Mat>

      {images.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3" role="tablist" aria-label="Imagens do molde">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={image.alt || `Imagem ${index + 1}`}
              onClick={() => setActive(index)}
              className={cn(
                'relative aspect-[3/4] overflow-hidden border bg-paper p-1 transition-colors',
                index === active ? 'border-wine' : 'border-rule hover:border-ink/40',
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
