'use client'

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import toast from 'react-hot-toast'

const DeleteButton = ({listingId}) => {
  const router = useRouter();
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')){
      return
    }

     try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      })

      const data = await res.json();

      if (data.success){
        toast.success('Listing deleted successfully')
        router.push('/listings')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to delete listing')
      }

     } catch (error) {
      console.error('Error deleting listilng:', error)
      toast.error('Failed to delete listing')
     }
  }


  return (
    <button 
    onClick={handleDelete}
    className='px-6 py-2 border border-gray-400 bg-red-600 rounded-md font-semibold hover:bg-red-400 transition-colors flex items-center gap-2'
    >
      <Trash2  className='h-4 w-4'/>
    </button>
  )
}

export default DeleteButton
