'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, DollarSign } from 'lucide-react'
import Image from 'next/image'

const Featured = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch('/api/listings')
        const data = await res.json()
        
        if (data.success) {
          setListings(data.data.slice(0, 4))
        }
      } catch (error) {
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchListings()
  }, [])

  if (loading) {
    return (
      <div className='w-full bg-white py-16 sm:py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center'>
          <p className='text-gray-500'>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full bg-white py-16 sm:py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        
        {/* Header */}
        <div className='text-center space-y-4 mb-12'>
          <h2 className='text-3xl sm:text-4xl font-bold text-gray-900'>
            Listings Near You
          </h2>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Discover amazing properties in your area
          </p>
        </div>

        {/* Cards Grid */}
        {listings.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
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
          <div className='text-center py-12'>
            <p className='text-gray-500'>No listings available yet</p>
          </div>
        )}

        {/* View All Button */}
        <div className='text-center'>
          <Link 
            href='/listings'
            className='inline-block px-8 py-3 border border-gray-300 text-gray-900 rounded-md font-semibold hover:bg-gray-50 transition-colors'
          >
            View All Listings
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Featured