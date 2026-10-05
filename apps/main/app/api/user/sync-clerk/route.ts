/**
 * Public Clerk webhook ingress.
 *
 * This route intentionally bypasses user-session auth and preserves the raw
 * request body so the user service can verify the Svix signature.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/services';

const userServiceBaseUrl = getServiceUrl('user').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') ?? 'application/json',
  };

  for (const name of ['svix-id', 'svix-timestamp', 'svix-signature']) {
    const value = request.headers.get(name);
    if (value) {
      headers[name] = value;
    }
  }

  const response = await fetch(`${userServiceBaseUrl}/api/user/sync-clerk`, {
    method: 'POST',
    headers,
    body,
    cache: 'no-store',
  });

  const responseBody = await response.text();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}
