'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatWidget } from '@aah/ui'

export function ChatWidgetWrapper() {
  const [input, setInput] = useState('')
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
    }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      chat.sendMessage({
        text: input,
      })
      setInput('')
    }
  }

  const isLoading = chat.status === 'submitted' || chat.status === 'streaming'

  return (
    <ChatWidget
      messages={chat.messages.map((m: any) => ({
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
      onInputChange={setInput}
      onSubmit={handleSubmit}
      onStop={chat.stop}
    />
  )
}