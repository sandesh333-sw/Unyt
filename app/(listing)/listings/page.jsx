"use client"

import { Suspense } from "react"
import ListingsContent from "./ListingsContent"

export default function ListingsPage() {
  return (
    <div className="w-full bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading...</div>}>
          <ListingsContent />
        </Suspense>
      </div>
    </div>
  )
}
