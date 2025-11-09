'use client';

import { useEffect } from 'react';
import { Button, Alert, AlertTitle, AlertDescription } from '@aah/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Eval dashboard error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6">
      <Alert variant="error">
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{error.message || 'An unexpected error occurred'}</p>
          {error.digest && (
            <p className="text-sm opacity-75">Error ID: {error.digest}</p>
          )}
        </AlertDescription>
      </Alert>
      <div className="mt-4 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/admin/evals'}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
