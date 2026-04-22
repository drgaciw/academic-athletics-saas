import { type Metadata } from 'next'
import { Inter, Lexend } from 'next/font/google'
import Link from 'next/link'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import './globals.css'

type ClerkInitialState = Record<string, unknown>

const buildSeededInitialState = (): ClerkInitialState | undefined => {
  if (process.env.NEXT_PUBLIC_CLERK_SEED_ENABLED !== 'true') {
    return undefined
  }
  const baseTimestamp = Math.floor(Date.now() / 1000)
  const seedUserId = process.env.NEXT_PUBLIC_CLERK_SEED_USER_ID ?? 'user_seeded_aah'
  const seedSessionId = process.env.NEXT_PUBLIC_CLERK_SEED_SESSION_ID ?? 'sess_seeded_aah'
  const seedEmail = process.env.NEXT_PUBLIC_CLERK_SEED_EMAIL ?? 'seeded-user@example.com'
  const seedFirstName = process.env.NEXT_PUBLIC_CLERK_SEED_FIRST_NAME ?? 'Seeded'
  const seedLastName = process.env.NEXT_PUBLIC_CLERK_SEED_LAST_NAME ?? 'User'
  const seedRole = process.env.NEXT_PUBLIC_CLERK_SEED_ROLE ?? 'admin'
  const seedAvatarUrl = process.env.NEXT_PUBLIC_CLERK_SEED_AVATAR_URL ?? 'https://www.gravatar.com/avatar/?d=mp&f=y'
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
      emailAddresses: [{ id: 'eml_seed_aah', emailAddress: seedEmail }],
      publicMetadata: { role: seedRole },
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

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' })

export const metadata: Metadata = {
  title: 'ORU Soccer | Academic Portal',
  description: 'Academic support and eligibility management for ORU Soccer student-athletes.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
        <body className={`${inter.variable} ${lexend.variable} font-sans antialiased bg-white`}>
          <a href="#main-content" className="absolute left-0 top-0 z-[100] -translate-y-full rounded bg-oru-navy px-4 py-2 text-white transition-transform focus:translate-y-0">
            Skip to content
          </a>
          <header className="sticky top-0 z-50 bg-oru-navy shadow-oru">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-oru-gold shadow-sm group-hover:bg-oru-gold-light transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003057" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-oru-gold font-bold text-sm tracking-wide uppercase">ORU Soccer</span>
                    <span className="text-white/70 text-xs font-normal">Academic Portal</span>
                  </div>
                </Link>
                <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
                  <Link href="#features" className="text-white/80 hover:text-oru-gold text-sm font-medium transition-colors">Features</Link>
                  <Link href="#how-it-works" className="text-white/80 hover:text-oru-gold text-sm font-medium transition-colors">How it Works</Link>
                  <Link href="#team" className="text-white/80 hover:text-oru-gold text-sm font-medium transition-colors">Our Teams</Link>
                </nav>
                <div className="flex items-center gap-3">
                  <SignedIn>
                    <UserButton showName afterSignOutUrl="/" />
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="rounded-lg border border-oru-gold/60 bg-transparent px-4 py-2 text-sm font-semibold text-oru-gold hover:bg-oru-gold hover:text-oru-navy transition-all">
                        Sign in
                      </button>
                    </SignInButton>
                  </SignedOut>
                </div>
              </div>
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
