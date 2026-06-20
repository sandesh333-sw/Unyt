'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { use } from 'react'
import MultiImageUploader from '@/app/components/MultiImageUploader'
import { normalizeListingImages } from '@/app/lib/images'

const EditListing = ({ params }) => {
  const { id } = use(params)
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    country: '',
    price: '',
    images: [],
  })

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`)
        const data = await res.json()

        if (data.success) {
          const listing = data.data
          
          // Check ownership
          if (listing.owner !== userId) {
            toast.error('You do not have permission to edit this listing')
            router.push(`/listings/${id}`)
            return
          }

          setFormData({
            title: listing.title,
            description: listing.description,
            location: listing.location,
            country: listing.country,
            price: listing.price.toString(),
            images: normalizeListingImages(listing),
          })
        } else {
          toast.error('Listing not found')
          router.push('/listings')
        }
      } catch (error) {
        console.error('Error fetching listing:', error)
        toast.error('Failed to load listing')
      } finally {
        setFetching(false)
      }
    }

    if (userId) {
      fetchListing()
    }
  }, [id, userId, router])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImagesChange = (images) => {
    setFormData(prev => ({ ...prev, images }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.images.length === 0) {
      toast.error('Please upload at least one image')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Listing updated successfully')
        router.push(`/listings/${id}`)
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to update listing')
      }
    } catch (error) {
      console.error('Error updating listing:', error)
      toast.error('Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className='w-full bg-white py-20'>
        <div className='mx-auto max-w-3xl px-4 text-center'>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full bg-white py-12'>
      <div className='mx-auto max-w-3xl px-4 sm:px-6 lg:px-8'>
        
        <Link 
          href={`/listings/${id}`}
          className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors'
        >
          <ArrowLeft className='h-5 w-5' />
          Back to listing
        </Link>

        <div className='mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-2'>
            Edit Listing
          </h1>
          <p className='text-gray-600'>
            Update your property details
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6 bg-white border border-gray-200 rounded-lg p-6 sm:p-8'>
          
          {/* Title */}
          <div>
            <label htmlFor='title' className='block text-sm font-semibold text-gray-900 mb-2'>
              Title
            </label>
            <input
              type='text'
              id='title'
              name='title'
              value={formData.title}
              onChange={handleChange}
              required
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900'
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor='description' className='block text-sm font-semibold text-gray-900 mb-2'>
              Description
            </label>
            <textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900'
            />
          </div>

          {/* Location & Country */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            <div>
              <label htmlFor='location' className='block text-sm font-semibold text-gray-900 mb-2'>
                Location
              </label>
              <input
                type='text'
                id='location'
                name='location'
                value={formData.location}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900'
              />
            </div>

            <div>
              <label htmlFor='country' className='block text-sm font-semibold text-gray-900 mb-2'>
                Country
              </label>
              <input
                type='text'
                id='country'
                name='country'
                value={formData.country}
                onChange={handleChange}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900'
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label htmlFor='price' className='block text-sm font-semibold text-gray-900 mb-2'>
              Price (per month)
            </label>
            <input
              type='number'
              id='price'
              name='price'
              value={formData.price}
              onChange={handleChange}
              required
              min='0'
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900'
            />
          </div>

          {/* Images */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              Property Images
            </label>
            <MultiImageUploader
              value={formData.images}
              onChange={handleImagesChange}
            />
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={loading}
            className='w-full px-6 py-3 bg-gray-900 text-white rounded-md font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Updating...' : 'Update Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditListing