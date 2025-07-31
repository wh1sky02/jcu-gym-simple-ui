"use client"

export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-900 text-xl font-medium">Loading login page...</p>
        <p className="text-gray-600 text-sm mt-2">Preparing authentication interface</p>
      </div>
    </div>
  )
}
