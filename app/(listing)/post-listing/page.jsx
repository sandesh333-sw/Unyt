'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import toast from 'react-hot-toast'
import MultiImageUploader from '@/app/components/MultiImageUploader'

const PostListing = () => {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    country: '',
    price: '',
    images: [],
  })

  const validateForm = () => {
    const errors = [];

    if (!formData.title || formData.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters');
    }
    if (!formData.description || formData.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    if (!formData.location || formData.location.trim().length < 2) {
      errors.push('Location is required');
    }
    if (!formData.country || formData.country.trim().length < 2) {
      errors.push('Country is required');
    }
    if (!formData.price || formData.price <= 0) {
      errors.push('Price must be greater than 0');
    }
    if (formData.price > 1000000) {
      errors.push('Price must be less than 1,000,000');
    }
    if (formData.images.length === 0) {
      errors.push('Please upload at least one image');
    }

    return errors;
  };


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

    if (!userId) {
      toast.error('Please sign in to post a listing')
      return
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0){
      validationErrors.forEach(err => toast.error(err));
      return;
    }
    setLoading(true)

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
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
        toast.success('Listing created successfully')
        router.push(`/listings/${data.data._id}`)
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to create listing')
      }
    } catch (error) {
      console.error('Error creating listing:', error)
      toast.error('Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full bg-white py-12'>
      <div className='mx-auto max-w-3xl px-4 sm:px-6 lg:px-8'>

        <div className='mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-2'>
            Post a Listing
          </h1>
          <p className='text-gray-600'>
            Share your property with potential renters
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
              placeholder='Modern Studio Apartment'
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
              placeholder='Describe your property...'
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
                placeholder='Downtown'
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
                placeholder='United Kingdom'
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
              placeholder='£1200'
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
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default PostListing