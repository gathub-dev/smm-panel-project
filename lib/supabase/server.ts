import { createServerClient } from "@supabase/ssr"
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
    
    const createMockChain = (): any => ({
      eq: () => createMockChain(),
      neq: () => createMockChain(),
      gt: () => createMockChain(),
      gte: () => createMockChain(),
      lt: () => createMockChain(),
      lte: () => createMockChain(),
      like: () => createMockChain(),
      ilike: () => createMockChain(),
      is: () => createMockChain(),
      in: () => createMockChain(),
      contains: () => createMockChain(),
      containedBy: () => createMockChain(),
      rangeGt: () => createMockChain(),
      rangeGte: () => createMockChain(),
      rangeLt: () => createMockChain(),
      rangeLte: () => createMockChain(),
      rangeAdjacent: () => createMockChain(),
      overlaps: () => createMockChain(),
      textSearch: () => createMockChain(),
      match: () => createMockChain(),
      not: () => createMockChain(),
      or: () => createMockChain(),
      filter: () => createMockChain(),
      order: () => createMockChain(),
      limit: () => createMockChain(),
      range: () => createMockChain(),
      abortSignal: () => createMockChain(),
      single: () => Promise.resolve(mockResponse),
      maybeSingle: () => Promise.resolve(mockResponse),
      csv: () => Promise.resolve(mockResponse),
      geojson: () => Promise.resolve(mockResponse),
      explain: () => Promise.resolve(mockResponse),
      rollback: () => Promise.resolve(mockResponse),
      returns: () => createMockChain(),
      then: () => Promise.resolve(mockResponse)
    })
    
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      rpc: () => Promise.resolve(mockResponse),
      from: () => ({
        select: () => createMockChain(),
        update: () => createMockChain(),
        insert: () => createMockChain(),
        upsert: () => createMockChain(),
        delete: () => createMockChain()
      })
    }
  }

  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
})
