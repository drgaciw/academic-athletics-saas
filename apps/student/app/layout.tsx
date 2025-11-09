import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider, ToastProvider } from '@aah/ui';
import '@aah/ui/styles/globals.css';

export const metadata: Metadata = {
  title: 'Student Portal - Athletic Academics Hub',
  description: 'Student-athlete portal for academic support and resources',
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
