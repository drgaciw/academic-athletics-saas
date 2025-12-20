'use client'

import { useChat } from '@ai-sdk/react'
import { ChatWidget } from '@aah/ui'

export function ChatWidgetWrapper() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      api: '/api/ai/chat',
    })

  return (
    <ChatWidget
      messages={messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        toolCalls: m.toolInvocations?.map((tool) => ({
          toolName: tool.toolName,
          toolInput: tool.args,
          toolOutput: 'result' in tool ? tool.result : undefined,
          status: tool.state === 'result' ? 'success' as const : 'running' as const,
        })),
      }))}
      input={input}
      isLoading={isLoading}
      onInputChange={(value) => handleInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
      onSubmit={handleSubmit}
      onStop={stop}
    />
  )
}
