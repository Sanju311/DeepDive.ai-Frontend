import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'

export default async function Home() {

  return (
    <div className="p-8 h-full bg-gray-900">
      <h1 className="text-4xl font-bold text-white mb-2 bg0">
        Welcome to Interview AI
      </h1>
      <p className="text-gray-400 text-lg">
        AI-powered interview platform
      </p>
    </div>
  )
}


