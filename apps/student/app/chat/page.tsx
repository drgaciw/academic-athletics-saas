'use client'

import { useChat } from '@ai-sdk/react'
import { ChatWidget } from '@aah/ui'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: '/api/ai/chat',
  })

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
          className="!fixed !inset-0 !w-full !h-full !max-w-none !max-h-none !rounded-none"
        />
      </div>
    </div>
  )
}
