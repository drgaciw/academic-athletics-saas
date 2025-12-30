'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Alert, AlertDescription } from './alert'

const GoogleIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.4H18.1C17.82 15.93 17.02 17.22 15.78 18.09V20.65H19.5C21.46 18.88 22.56 15.91 22.56 12.25Z"
      fill="#4285F4"
    ></path>
    <path
      d="M12 23C15.02 23 17.58 21.99 19.5 20.65L15.78 18.09C14.77 18.78 13.52 19.18 12 19.18C9.27 19.18 6.94 17.34 6.09 14.88H2.24V17.53C4.16 20.88 7.79 23 12 23Z"
      fill="#34A853"
    ></path>
    <path
      d="M6.09 14.88C5.84 14.16 5.7 13.39 5.7 12.59C5.7 11.79 5.84 11.02 6.09 10.3L2.24 7.65C1.45 9.22 1 10.85 1 12.59C1 14.33 1.45 15.96 2.24 17.53L6.09 14.88Z"
      fill="#FBBC05"
    ></path>
    <path
      d="M12 5.82C13.62 5.82 15.06 6.38 16.14 7.4L19.57 4.25C17.58 2.45 15.02 1.18 12 1.18C7.79 1.18 4.16 3.31 2.24 6.66L6.09 9.3C6.94 6.84 9.27 5.00 12 5.00V5.82Z"
      fill="#EA4335"
    ></path>
  </svg>
)

const AppleIcon = () => (
  <svg className="h-5 w-5 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.1425 21.657C15.4275 21.892 14.6575 22.022 13.8825 22.022C12.5625 22.022 11.0875 21.572 9.8725 20.672C8.6175 19.742 7.6475 18.572 7.0225 17.162C6.1225 15.152 6.5725 12.722 8.3725 11.012C9.3725 10.052 10.6275 9.53203 11.8525 9.50203C12.3325 9.50203 13.3625 9.69203 14.3325 10.322L14.4225 10.382C13.5225 9.93203 12.6225 9.69203 11.8525 9.69203C11.1675 9.69203 10.4275 9.87203 9.7725 10.202C9.0975 10.532 8.5425 10.982 8.1325 11.522C6.8125 13.202 6.7225 15.602 8.0125 17.582C8.6175 18.512 9.4875 19.262 10.6275 19.832C11.1975 20.132 11.9725 20.372 12.7425 20.372C13.2225 20.372 13.9125 20.252 14.5025 20.012C15.0925 19.772 15.5425 19.472 15.8425 19.112C15.1275 18.632 14.7175 17.912 14.7175 16.982C14.7175 15.422 15.7175 14.342 17.4875 13.832C18.6275 13.502 19.8725 13.832 20.6725 14.702L20.4525 14.822C19.7975 13.112 17.9375 12.002 16.0475 12.002C14.2475 12.002 12.6275 12.962 11.9425 14.642C12.8725 15.122 13.3925 16.022 13.3925 17.072C13.3925 18.152 12.8725 19.082 11.9725 19.532C12.4225 20.222 13.2825 20.732 14.3025 20.942C14.5725 21.002 14.8725 21.062 15.2025 21.122C15.5325 21.182 15.8325 21.212 16.1025 21.212C16.1325 21.212 16.1475 21.452 16.1425 21.657ZM15.1525 8.16203C15.5025 7.68203 15.7425 7.05203 15.8725 6.30203C15.5325 5.58203 14.9425 5.07203 14.1725 4.86203C13.0325 4.53203 11.8725 5.10203 11.2475 6.00203C10.8975 6.45203 10.6275 7.02203 10.5075 7.74203C10.8375 8.49203 11.4275 8.97203 12.2375 9.21203C13.3325 9.51203 14.5325 8.97203 15.1525 8.16203Z"></path>
  </svg>
)

export function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      } else {
        // Handle other statuses (e.g., 2FA) if needed, for now just log
        console.log(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
      // Extract error message from Clerk error object if possible
      const errorMessage = err.errors?.[0]?.message || 'An error occurred during sign in. Please try again.'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'oauth_google' | 'oauth_apple') => {
    if (!isLoaded) return

    setIsLoading(true)
    setError(null)

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
      // No need to set isLoading(false) as page will redirect
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
      const errorMessage = err.errors?.[0]?.message || 'An error occurred during social sign in.'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 flex items-center justify-center">
            <img
              alt="Athletic Academics Hub Logo"
              className="h-full w-full object-contain"
              src="/logo.png"
            />
          </div>
          <h2 className="text-[#131118] dark:text-white tracking-tight text-3xl font-bold text-center">
            Sign in to your account
          </h2>
        </div>
        <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm p-8 space-y-6">
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-3"
              onClick={() => handleSocialSignIn('oauth_google')}
              disabled={isLoading}
              loading={isLoading}
            >
              <GoogleIcon />
              <span className="truncate">Sign in with Google</span>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-3"
              onClick={() => handleSocialSignIn('oauth_apple')}
              disabled={isLoading}
              loading={isLoading}
            >
              <AppleIcon />
              <span className="truncate">Sign in with Apple</span>
            </Button>
          </div>
          <div className="flex items-center">
            <hr className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            <p className="text-[#6b6388] dark:text-gray-400 text-sm font-normal leading-normal px-4 text-center">
              OR
            </p>
            <hr className="flex-grow border-t border-gray-200 dark:border-gray-700" />
          </div>

          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col w-full">
              <Label htmlFor="email" className="pb-2">Email address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                error={!!error}
              />
            </div>
            <div className="flex flex-col w-full">
              <Label htmlFor="password" className="pb-2">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                error={!!error}
              />
            </div>
            <div className="flex items-center justify-end">
              <a className="text-sm font-medium text-primary hover:underline" href="/forgot-password">
                Forgot password?
              </a>
            </div>
            <Button type="submit" className="w-full font-bold" loading={isLoading}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
