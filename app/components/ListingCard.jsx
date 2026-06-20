import Link from "next/link";
import Image from "next/image";
import { MapPin, DollarSign, Images } from "lucide-react";
import { normalizeListingImages } from "@/app/lib/images";

/**
 * Presentational card for a single listing. Server-rendered — no client JS.
 *
 * @param {{ listing: object, sizes?: string }} props
 *   `sizes` tells next/image how wide the image renders at each breakpoint so it
 *   doesn't download a desktop-sized image onto a phone.
 */
export default function ListingCard({ listing, sizes = "100vw" }) {
  const images = normalizeListingImages(listing);
  const cover = images[0]?.url;

  return (
    <Link
      href={`/listings/${listing._id}`}
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer block"
    >
      <div className="relative w-full h-48 bg-gray-100">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes={sizes}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-xs">
            <Images className="h-3.5 w-3.5" />
            {images.length}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>

        <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>
            {listing.location}, {listing.country}
          </span>
        </div>

        <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <DollarSign className="h-5 w-5" />
          <span>${listing.price}/month</span>
        </div>
      </div>
    </Link>
  );
}
