'use client';

import { useEffect } from 'react';
import { ZoneErrorBoundary } from '@aah/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Vercel Logs or external service
    console.error('Application error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return <ZoneErrorBoundary error={error} reset={reset} />;
}
