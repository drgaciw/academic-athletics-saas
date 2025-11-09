import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
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
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
