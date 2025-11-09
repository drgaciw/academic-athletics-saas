import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Temporary middleware that bypasses Clerk authentication
// Replace this with proper Clerk middleware once you have valid API keys
export function middleware(request: NextRequest) {
  // Allow all requests through without authentication
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
