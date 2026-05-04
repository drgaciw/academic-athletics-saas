/**
 * Vercel Cron → forwards to compliance service internal regulation cron.
 * Secure with CRON_SECRET (or REGULATION_CRON_SECRET) Authorization: Bearer.
 */

import { NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const cronSecret =
    process.env.CRON_SECRET ?? process.env.REGULATION_CRON_SECRET;
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const complianceBase = getServiceUrl('compliance');
  const regulationSecret =
    process.env.REGULATION_CRON_SECRET ?? cronSecret;

  const res = await fetch(`${complianceBase}/internal/cron/regulation-check`, {
    method: 'POST',
    headers: {
      'X-Regulation-Cron-Secret': regulationSecret,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return NextResponse.json(body, { status: res.status });
}
