import { SignUp } from '@clerk/nextjs'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - ORU Soccer Academic Portal',
}

export default function SignUpPage() {
  return (
    <div className="bg-white font-sans text-gray-900">
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #003057 0%, #1a4a7a 100%)' }}>
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                   style={{ backgroundColor: '#C5973E' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  <path d="M2 12h20"/>
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-lg tracking-wider">ORU SOCCER</div>
                <div className="text-xs tracking-widest" style={{ color: '#C5973E' }}>ACADEMIC PORTAL</div>
              </div>
            </div>
            <h2 className="text-white tracking-tight text-2xl font-bold text-center mt-4">
              Join the Golden Eagles
            </h2>
            <p className="text-sm mt-1" style={{ color: '#C5973E' }}>
              Create your academic portal account
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none p-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg h-11 px-5 border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors',
                  dividerRow: 'my-4',
                  dividerText: 'text-gray-400 text-sm',
                  formFieldLabel: 'text-gray-700 text-sm font-medium mb-1',
                  formFieldInput: 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent',
                  formButtonPrimary: 'w-full rounded-lg h-11 px-5 text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity',
                  footerActionLink: 'font-medium hover:underline',
                  formFieldInputShowPasswordButton: 'text-gray-400 hover:text-gray-600',
                },
                variables: {
                  colorPrimary: '#003057',
                  colorBackground: '#ffffff',
                  colorText: '#111827',
                  colorTextSecondary: '#6b7280',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#111827',
                  borderRadius: '0.5rem',
                  fontFamily: 'inherit',
                },
              }}
            />
          </div>
          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Oral Roberts University Athletics &mdash; Academic Excellence Program
          </p>
        </div>
      </div>
    </div>
  )
}
