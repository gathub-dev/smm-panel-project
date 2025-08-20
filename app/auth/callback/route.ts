import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    // Use the correct method for exchanging code for session
    try {
      const { data, error } = await (supabase.auth as any).exchangeCodeForSession(code)
      
      if (!error && data?.session) {
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}/dashboard`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}/dashboard`)
        } else {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  // Redirect to error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
}
