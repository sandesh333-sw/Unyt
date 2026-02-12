'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

const PostListing = () => {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    country: '',
    price: '',
    imageUrl: '',
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
    if (!formData.imageUrl) {
      errors.push('Please upload an image');
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'unyt_main')

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await res.json()
      setFormData(prev => ({
        ...prev,
        imageUrl: data.secure_url,
      }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
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

          {/* Image Upload */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              Property Image
            </label>

            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors'>
              {imagePreview ? (
                <div className='space-y-4'>
                  <div className='relative w-full h-64'>
                    <Image
                      src={imagePreview}
                      alt='Preview'
                      fill
                      className='object-cover rounded-md'
                    />
                  </div>
                  <label className='cursor-pointer inline-block px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors'>
                    Change Image
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden'
                    />
                  </label>
                </div>
              ) : (
                <label className='cursor-pointer block'>
                  <Upload className='mx-auto h-12 w-12 text-gray-400 mb-2' />
                  <span className='text-gray-600'>Click to upload an image</span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                    required
                  />
                </label>
              )}
            </div>
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