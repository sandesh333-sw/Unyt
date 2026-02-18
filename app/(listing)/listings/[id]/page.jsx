'use client'

import React, { useEffect, useState } from 'react'
import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, DollarSign, ArrowLeft } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import DeleteButton from './DeleteButton'
import MapView from './MapView'

const ViewListingPage = ({ params }) => {
  const { id } = use(params)
  const { userId } = useAuth()
  
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`)
        const data = await res.json()
        
        if (data.success) {
          setListing(data.data)
          setIsOwner(userId === data.data.owner)
        }
      } catch (error) {
        console.error('Error fetching listing:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchListing()
  }, [id, userId])

  if (loading) {
    return (
      <div className='w-full bg-white py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center'>
          <p className='text-gray-500'>Loading...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className='w-full bg-white py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Listing not found</h1>
          <Link href='/listings' className='text-blue-600 hover:underline'>
            Back to listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full bg-white py-8'>
      <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8'>
        
        {/* Back Button */}
        <Link 
          href='/listings'
          className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
        >
          <ArrowLeft className='h-5 w-5' />
          Back to listings
        </Link>

        {/* Main Content */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          
          {/* Image */}
          <div className='relative w-full h-96 bg-gray-100'>
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className='object-cover'
            />
          </div>

          {/* Details */}
          <div className='p-6 sm:p-8 space-y-6'>
            
            {/* Title & Price */}
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                  {listing.title}
                </h1>
                <div className='flex items-center gap-2 text-gray-600'>
                  <MapPin className='h-5 w-5' />
                  <span>{listing.location}, {listing.country}</span>
                </div>
              </div>
              <div className='flex items-center gap-2 text-2xl font-bold text-gray-900'>
                <DollarSign className='h-7 w-7' />
                <span>${listing.price}/month</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-3'>Description</h2>
              <p className='text-gray-600 leading-relaxed'>{listing.description}</p>
            </div>

            {/* Map */}
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-3'>Location</h2>
              {listing.geometry && listing.geometry.coordinates && 
               listing.geometry.coordinates[0] !== 0 && 
               listing.geometry.coordinates[1] !== 0 ? (
                <MapView 
                  coordinates={listing.geometry.coordinates} 
                  location={listing.location}
                />
              ) : (
                <div className='w-full h-96 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center'>
                  <p className='text-gray-500'>Location data not available</p>
                </div>
              )}
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className='pt-6 border-t border-gray-200 flex gap-4'>
                <Link
                  href={`/listings/${listing._id}/edit`}
                  className='px-6 py-2 bg-gray-900 text-white rounded-md font-semibold hover:bg-gray-800 transition-colors'
                >
                  Edit Listing
                </Link>
                <DeleteButton listingId={listing._id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewListingPage