import Link from "next/link";

// Build a compact list of page numbers with gaps, e.g. 1 … 4 5 [6] 7 8 … 20.
function pageWindow(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const withGaps = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) withGaps.push("gap");
    withGaps.push(p);
    prev = p;
  }
  return withGaps;
}

/**
 * Server-rendered pagination. Uses links (not client state) so pages stay
 * shareable, crawlable, and keep the SSR data flow.
 *
 * @param {{ page: number, totalPages: number, search?: string }} props
 */
export default function Pagination({ page, totalPages, search = "" }) {
  if (totalPages <= 1) return null;

  const href = (p) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/listings?${qs}` : "/listings";
  };

  const baseItem =
    "min-w-10 h-10 px-3 inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors";

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-12"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${baseItem} border-gray-300 text-gray-700 hover:bg-gray-50`}>
          Previous
        </Link>
      ) : (
        <span className={`${baseItem} border-gray-200 text-gray-300 cursor-not-allowed`}>
          Previous
        </span>
      )}

      {pageWindow(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400 select-none">
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className={`${baseItem} border-gray-900 bg-gray-900 text-white`}
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={`${baseItem} border-gray-300 text-gray-700 hover:bg-gray-50`}
          >
            {item}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={`${baseItem} border-gray-300 text-gray-700 hover:bg-gray-50`}>
          Next
        </Link>
      ) : (
        <span className={`${baseItem} border-gray-200 text-gray-300 cursor-not-allowed`}>
          Next
        </span>
      )}
    </nav>
  );
}
