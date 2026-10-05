import type { ReactNode } from 'react';
import { requireStudentPageAccess } from '@/lib/student-auth';

// chat/page.tsx is a client component, so the DB-backed role guard lives in
// this server layout instead.
export default async function ChatLayout({ children }: { children: ReactNode }) {
  await requireStudentPageAccess();

  return <>{children}</>;
}
