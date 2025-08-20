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
export const createClient = cache(async () => {
  if (!isSupabaseConfigured) {
    const mockResponse = { data: null, error: new Error("Supabase not configured"), count: 0 }
    const mockChain = {
      eq: () => mockChain,
      single: () => Promise.resolve(mockResponse),
      order: () => Promise.resolve(mockResponse),
      upsert: () => Promise.resolve(mockResponse),
      insert: () => Promise.resolve(mockResponse),
      update: () => Promise.resolve(mockResponse),
      delete: () => Promise.resolve(mockResponse),
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
        insert: () => mockChain,
        upsert: () => mockChain,
        delete: () => mockChain,
        order: () => Promise.resolve(mockResponse)
      })
    }
  }

  const cookieStore = await cookies()
  return createServerComponentClient({ 
    cookies: () => cookieStore 
  } as any)
})
