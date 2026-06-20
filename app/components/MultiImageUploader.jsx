'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { MAX_LISTING_IMAGES } from '@/app/lib/constants'

// Cloudinary unsigned upload preset (see Cloudinary dashboard → Settings → Upload).
const UPLOAD_PRESET = 'unyt_main'

/**
 * Controlled multi-image uploader. Uploads each selected file to Cloudinary and
 * reports the resulting images up via onChange.
 *
 * @param {{
 *   value: { url: string, publicId?: string }[],
 *   onChange: (images: { url: string, publicId?: string }[]) => void,
 *   max?: number,
 * }} props
 */
export default function MultiImageUploader({ value = [], onChange, max = MAX_LISTING_IMAGES }) {
  const [uploading, setUploading] = useState(false)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = '' // allow re-selecting the same file later
    if (files.length === 0) return

    const room = max - value.length
    if (room <= 0) {
      toast.error(`You can upload at most ${max} images`)
      return
    }

    const toUpload = files.slice(0, room)
    if (files.length > room) {
      toast.error(`Only ${room} more image${room === 1 ? '' : 's'} allowed`)
    }

    setUploading(true)
    try {
      const uploaded = []
      for (const file of toUpload) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', UPLOAD_PRESET)

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: formData }
        )

        if (!res.ok) throw new Error('Upload failed')

        const data = await res.json()
        uploaded.push({ url: data.secure_url, publicId: data.public_id })
      }

      onChange([...value, ...uploaded])
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded`)
    } catch (error) {
      console.error('Error uploading image(s):', error)
      toast.error('Failed to upload image(s)')
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (index) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const canAddMore = value.length < max

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {value.map((image, index) => (
          <div
            key={image.url}
            className="relative h-28 rounded-md overflow-hidden border border-gray-200 group"
          >
            <Image src={image.url} alt={`Image ${index + 1}`} fill sizes="200px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Remove image ${index + 1}`}
              className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <label className="h-28 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:border-gray-400 transition-colors">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Upload className="h-6 w-6 mb-1" />
                <span className="text-xs">Add image</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {value.length} of {max} images. The first image is used as the cover.
      </p>
    </div>
  )
}
