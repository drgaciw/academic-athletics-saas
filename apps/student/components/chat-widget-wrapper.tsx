'use client'

import { useChat } from 'ai'
import { ChatWidget } from '@aah/ui'

export function ChatWidgetWrapper() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      api: '/api/ai/chat',
    })

  return (
    <ChatWidget
      messages={messages.map((m: any) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        toolCalls: m.toolInvocations?.map((tool: any) => ({
          toolName: tool.toolName,
          toolInput: tool.args,
          toolOutput: tool.result,
          status: tool.state === 'result' ? 'success' as const : 'running' as const,
        })),
      }))}
      input={input}
      isLoading={isLoading}
      onInputChange={(e) => handleInputChange({ target: { value: e } } as any)}
      onSubmit={handleSubmit}
      onStop={stop}
    />
  )
}