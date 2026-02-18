"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, DollarSign } from "lucide-react"

export default function ListingContent() {
  const searchParams = useSearchParams()
  const search = searchParams.get("search") || ""

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      try {
        const url = search
          ? `/api/listings?search=${encodeURIComponent(search)}`
          : "/api/listings"

        const res = await fetch(url)
        const data = await res.json()

        if (data.success) setListings(data.data)
      } catch (error) {
        console.error("Error fetching listings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [search])

  if (loading) {
    return (
      <div className="w-full bg-white py-20 text-center text-gray-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <Link
          key={listing._id}
          href={`/listings/${listing._id}`}
          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="relative w-full h-48 bg-gray-100">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-4 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {listing.title}
            </h3>

            <p className="text-sm text-gray-600 line-clamp-2">
              {listing.description}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{listing.location}, {listing.country}</span>
            </div>

            <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <DollarSign className="h-5 w-5" />
              <span>${listing.price}/month</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
