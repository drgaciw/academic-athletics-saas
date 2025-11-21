import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Lexend } from 'next/font/google';
import { QueryProvider, ToastProvider } from '@aah/ui';
import { Sidebar } from '@/components/sidebar';
import '@aah/ui/styles/globals.css';

export const metadata: Metadata = {
  title: 'Student Dashboard - Athletic Academics Hub',
  description: 'Student-athlete portal for academic support and resources',
};

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={lexend.variable}>
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
            rel="stylesheet"
          />
        </head>
        <body className="bg-background-light font-display text-neutral-text">
          <QueryProvider>
            <div className="relative flex h-auto min-h-screen w-full flex-col">
              <div className="flex h-full grow flex-row">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>
            <ToastProvider />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
