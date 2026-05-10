import { currentUser } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export async function requireEvalAdmin() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (user.publicMetadata?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}
