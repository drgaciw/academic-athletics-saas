'use client';

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { Button } from '@aah/ui';

export function AuthHeader() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton showName />;
  }

  return (
    <SignInButton mode="modal">
      <Button variant="outline" size="sm">
        Sign in
      </Button>
    </SignInButton>
  );
}
