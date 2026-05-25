'use client'

import { ChatWidget } from '@aah/ui'
import { useStudentChat } from '../hooks/use-student-chat'

export function ChatWidgetWrapper() {
  const { messages, input, isLoading, onInputChange, handleSubmit, stop } = useStudentChat()

  return (
    <ChatWidget
      showStudentEligibilityDisclaimer
      messages={messages}
      input={input}
      isLoading={isLoading}
      onInputChange={onInputChange}
      onSubmit={handleSubmit}
      onStop={stop}
    />
  )
}
