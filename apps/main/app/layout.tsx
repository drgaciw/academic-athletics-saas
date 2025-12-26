import { type Metadata } from 'next'
import Link from 'next/link'
import { Inter, Lexend } from 'next/font/google'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import { Button } from '@aah/ui'

import './globals.css'

type ClerkInitialState = Record<string, unknown>

const buildSeededInitialState = (): ClerkInitialState | undefined => {
  if (process.env.NEXT_PUBLIC_CLERK_SEED_ENABLED !== 'true') {
    return undefined
  }

  const baseTimestamp = Math.floor(Date.now() / 1000)
  const seedUserId =
    process.env.NEXT_PUBLIC_CLERK_SEED_USER_ID ?? 'user_seeded_aah'
  const seedSessionId =
    process.env.NEXT_PUBLIC_CLERK_SEED_SESSION_ID ?? 'sess_seeded_aah'
  const seedEmail =
    process.env.NEXT_PUBLIC_CLERK_SEED_EMAIL ?? 'seeded-user@example.com'
  const seedFirstName =
    process.env.NEXT_PUBLIC_CLERK_SEED_FIRST_NAME ?? 'Seeded'
  const seedLastName =
    process.env.NEXT_PUBLIC_CLERK_SEED_LAST_NAME ?? 'User'
  const seedRole = process.env.NEXT_PUBLIC_CLERK_SEED_ROLE ?? 'admin'
  const seedAvatarUrl =
    process.env.NEXT_PUBLIC_CLERK_SEED_AVATAR_URL ??
    'https://www.gravatar.com/avatar/?d=mp&f=y'

  return {
    userId: seedUserId,
    sessionId: seedSessionId,
    session: {
      id: seedSessionId,
      userId: seedUserId,
      status: 'active',
      lastActiveAt: baseTimestamp,
      lastActiveClientId: 'client_seed_aah',
      expiresAt: baseTimestamp + 60 * 60 * 8,
      createdAt: baseTimestamp,
      updatedAt: baseTimestamp,
      actor: null,
      publicUserData: {
        userId: seedUserId,
        identifier: seedEmail,
        firstName: seedFirstName,
        lastName: seedLastName,
        profileImageUrl: seedAvatarUrl,
      },
    },
    user: {
      id: seedUserId,
      firstName: seedFirstName,
      lastName: seedLastName,
      fullName: `${seedFirstName} ${seedLastName}`.trim(),
      imageUrl: seedAvatarUrl,
      primaryEmailAddressId: 'eml_seed_aah',
      emailAddresses: [
        {
          id: 'eml_seed_aah',
          emailAddress: seedEmail,
        },
      ],
      publicMetadata: {
        role: seedRole,
      },
      createdAt: baseTimestamp,
      updatedAt: baseTimestamp,
    },
    actor: null,
    organization: undefined,
    orgId: null,
    orgSlug: null,
    orgRole: null,
    orgPermissions: [],
    factorVerificationAge: [baseTimestamp, baseTimestamp],
    sessionClaims: {
      iss: 'seeded-clerk-dev',
      sub: seedUserId,
      sid: seedSessionId,
      iat: baseTimestamp,
      exp: baseTimestamp + 60 * 60 * 8,
      role: seedRole,
      email: seedEmail,
    },
  }
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
})

export const metadata: Metadata = {
  title: 'Athletic Academics Hub',
  description: 'Academic support platform for student-athletes',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const seededInitialState = buildSeededInitialState()
  const clerkProviderProps: Record<string, unknown> = {
    publishableKey,
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  }

  if (seededInitialState) {
    clerkProviderProps.clerkState = { __clerk_client: seededInitialState }
  }

  return (
    <ClerkProvider {...(clerkProviderProps as any)}>
      <html lang="en">
        <body
          className={`${inter.variable} ${lexend.variable} font-sans antialiased flex flex-col min-h-screen`}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:rounded-md"
          >
            Skip to content
          </a>
          <header className="flex justify-between items-center p-4 border-b h-16">
            <Link href="/" className="text-lg font-semibold hover:opacity-80 transition-opacity">
              Athletic Academics Hub
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <SignedIn>
                <UserButton showName afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </header>
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
