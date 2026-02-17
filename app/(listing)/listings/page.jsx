'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MapPin, DollarSign } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const ListingsPage = () => {
  const searchParams = useSearchParams()
  const search = searchParams.get('search') || ''
  
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      try {
        const url = search 
          ? `/api/listings?search=${encodeURIComponent(search)}`
          : '/api/listings'
        
        const res = await fetch(url)
        const data = await res.json()
        
        if (data.success) {
          setListings(data.data)
        }
      } catch (error) {
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchListings()
  }, [search])

  if (loading) {
    return (
      <div className='w-full bg-white py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center'>
          <p className='text-gray-500'>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full bg-white py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-2'>
            {search ? `Search Results` : 'All Listings'}
          </h1>
          <p className='text-gray-600'>
            {search 
              ? `Found ${listings.length} ${listings.length === 1 ? 'listing' : 'listings'} for "${search}"`
              : `Browse all available properties (${listings.length} listings)`
            }
          </p>
        </div>

        {/* Listings Grid */}
        {listings.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {listings.map((listing) => (
              <Link 
                key={listing._id}
                href={`/listings/${listing._id}`}
                className='border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer block'
              >
                {/* Image */}
                <div className='relative w-full h-48 bg-gray-100'>
                  <Image
                    src={listing.imageUrl}
                    alt={listing.title}
                    fill
                    className='object-cover'
                  />
                </div>
                
                {/* Content */}
                <div className='p-4 space-y-3'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {listing.title}
                  </h3>
                  
                  <p className='text-sm text-gray-600 line-clamp-2'>
                    {listing.description}
                  </p>
                  
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <MapPin className='h-4 w-4' />
                    <span>{listing.location}, {listing.country}</span>
                  </div>
                  
                  <div className='flex items-center gap-2 text-lg font-bold text-gray-900'>
                    <DollarSign className='h-5 w-5' />
                    <span>${listing.price}/month</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className='text-center py-20'>
            <p className='text-gray-500 text-lg mb-4'>
              {search ? `No listings found for "${search}"` : 'No listings available yet'}
            </p>
            {!search && (
              <Link 
                href='/post-listing'
                className='inline-block px-6 py-3 bg-gray-900 text-white rounded-md font-semibold hover:bg-gray-800 transition-colors'
              >
                Post Your First Listing
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ListingsPage



