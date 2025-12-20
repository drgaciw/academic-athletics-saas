'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatWidget } from '@aah/ui'

export default function ChatPage() {
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
    <div className="h-screen flex flex-col">
      <header className="border-b border-gray-200 p-4 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500">
          Get help with courses, eligibility, and academic planning
        </p>
      </header>

      <div className="flex-1 relative">
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
          className="!fixed !inset-0 !w-full !h-full !max-w-none !max-h-none !rounded-none"
        />
      </div>
    </div>
  )
}