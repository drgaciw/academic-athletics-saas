'use client'

import { ChatWidget } from '@aah/ui'
import { useStudentChat } from '../../hooks/use-student-chat'

export default function ChatPage() {
  const { messages, input, isLoading, onInputChange, handleSubmit, stop } = useStudentChat()

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-gray-200 p-4 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500">
          Preliminary guidance only—official eligibility comes from your athletics compliance office.
        </p>
      </header>

      <div className="flex-1 relative">
        <ChatWidget
          showStudentEligibilityDisclaimer
          messages={messages}
          input={input}
          isLoading={isLoading}
          onInputChange={onInputChange}
          onSubmit={handleSubmit}
          onStop={stop}
          className="!fixed !inset-0 !w-full !h-full !max-w-none !max-h-none !rounded-none"
        />
      </div>
    </div>
  )
}
