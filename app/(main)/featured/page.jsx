import Link from "next/link";
import ListingCard from "@/app/components/ListingCard";
import { getListings } from "@/app/lib/listings";

// 4-up grid on desktop, so each image is at most a quarter of the page width.
const CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";

const Featured = async () => {
  const { listings } = await getListings({ page: 1, limit: 4 });

  return (
    <div className="w-full bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Listings Near You
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover amazing properties in your area
          </p>
        </div>

        {/* Cards Grid */}
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} sizes={CARD_SIZES} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No listings available yet</p>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/listings"
            className="inline-block px-8 py-3 border border-gray-300 text-gray-900 rounded-md font-semibold hover:bg-gray-50 transition-colors"
          >
            View All Listings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Featured;
