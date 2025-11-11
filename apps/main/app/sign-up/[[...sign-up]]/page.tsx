import { SignUp } from '@clerk/nextjs'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - Athletic Academics Hub',
}

export default function SignUpPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#333333] dark:text-gray-200">
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
              Create an account
            </h2>
          </div>
          <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm p-8 space-y-6">
            <SignUp
              appearance={{
                elements: {
                  root: 'space-y-6',
                  socialButtonsBlock: 'space-y-3',
                  dividerRow: 'hidden',
                  formFieldInput:
                    'form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#131118] dark:text-white dark:bg-gray-700 focus:outline-0 border border-gray-300 dark:border-gray-600 bg-white dark:focus:border-primary h-12 placeholder:text-[#6b6388] p-3 text-base font-normal leading-normal',
                  formButtonPrimary:
                    'flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors mt-6',
                  socialButtonsBlockButton:
                    'flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-white dark:bg-gray-700 text-[#333333] dark:text-white gap-3 text-base font-medium leading-normal tracking-[0.015em] border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors',
                  footerActionLink: 'font-medium text-primary hover:underline',
                  formFieldLabel:
                    'text-[#131118] dark:text-gray-200 text-sm font-medium leading-normal pb-2',
                },
              }}
            >
              <div className="flex items-center">
                <hr className="flex-grow border-t border-gray-200 dark:border-gray-700" />
                <p className="text-[#6b6388] dark:text-gray-400 text-sm font-normal leading-normal px-4 text-center">
                  OR
                </p>
                <hr className="flex-grow border-t border-gray-200 dark:border-gray-700" />
              </div>
            </SignUp>
          </div>
        </div>
      </div>
    </div>
  )
}
