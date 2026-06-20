'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Listing image gallery: one large image with prev/next controls and a
 * thumbnail strip. Falls back gracefully to a single image (or a placeholder).
 *
 * @param {{ images: { url: string }[], alt: string }} props
 */
export default function ImageGallery({ images = [], alt = '' }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400">No image available</p>
      </div>
    )
  }

  const hasMultiple = images.length > 1
  const go = (next) => setActive((next + images.length) % images.length)

  return (
    <div>
      {/* Main image */}
      <div className="relative w-full h-96 bg-gray-100 group">
        <Image
          key={images[active].url}
          src={images[active].url}
          alt={`${alt} — image ${active + 1} of ${images.length}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 text-gray-900 flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 text-gray-900 flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-xs">
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.url}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative h-16 w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                i === active ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={img.url}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
