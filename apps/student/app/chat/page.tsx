import { requireStudentPageAccess } from '@/lib/student-auth'
import { ChatPageClient } from './chat-page-client'

export default async function ChatPage() {
  await requireStudentPageAccess()

  return <ChatPageClient />
}
