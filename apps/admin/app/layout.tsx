import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@aah/ui/styles/globals.css';

export const metadata: Metadata = {
  title: 'Admin Portal - Athletic Academics Hub',
  description: 'Administrative portal for program management and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
