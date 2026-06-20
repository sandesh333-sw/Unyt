// Shown instantly while the server renders the listings grid, so navigation
// feels responsive instead of blocking on the previous page.
export default function Loading() {
  return (
    <div className="w-full bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg overflow-hidden animate-pulse"
            >
              <div className="w-full h-48 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
