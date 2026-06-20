import ListingCard from "@/app/components/ListingCard";
import Pagination from "@/app/components/Pagination";
import { getListings } from "@/app/lib/listings";

// Listings depend on the ?search and ?page query params, so render per request.
export const dynamic = "force-dynamic";

// 3-up grid on desktop.
const CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export default async function ListingsPage({ searchParams }) {
  const params = await searchParams;

  const rawSearch = params?.search;
  const search = (Array.isArray(rawSearch) ? rawSearch[0] : rawSearch) || "";

  const rawPage = params?.page;
  const page = Number.parseInt(Array.isArray(rawPage) ? rawPage[0] : rawPage, 10) || 1;

  const { listings, total, page: currentPage, totalPages } = await getListings({
    search,
    page,
  });

  return (
    <div className="w-full bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {total > 0 && (
          <p className="text-sm text-gray-500 mb-6">
            {total} listing{total === 1 ? "" : "s"}
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} sizes={CARD_SIZES} />
              ))}
            </div>

            <Pagination page={currentPage} totalPages={totalPages} search={search} />
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            {search
              ? `No listings found for "${search}"`
              : "No listings available yet"}
          </div>
        )}
      </div>
    </div>
  );
}
