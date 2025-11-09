import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider, ToastProvider } from '@aah/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Athletic Academics Hub - Admin Portal',
  description: 'Administrative portal for managing student-athlete academic support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <QueryProvider>
            {children}
            <ToastProvider />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
