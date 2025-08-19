import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a cached version of the Supabase client for Server Components
export const createClient = cache(() => {
  if (!isSupabaseConfigured) {
    const mockResponse = { data: null, error: new Error("Supabase not configured") }
    const mockChain = {
      eq: () => mockChain,
      single: () => Promise.resolve(mockResponse),
      order: () => Promise.resolve(mockResponse),
      ...mockResponse
    }
    
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      rpc: () => Promise.resolve(mockResponse),
      from: () => ({
        select: () => mockChain,
        update: () => mockChain,
        order: () => Promise.resolve(mockResponse)
      })
    }
  }

  return createServerComponentClient({ cookies })
})
