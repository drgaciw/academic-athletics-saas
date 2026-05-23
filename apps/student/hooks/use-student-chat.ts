'use client'

import { useCallback, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'

function getMessageContent(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

function getToolCalls(message: UIMessage) {
  return message.parts.flatMap((part) => {
    if (part.type === 'dynamic-tool') {
      return [{
        toolName: part.toolName,
        toolInput: (part.input ?? {}) as Record<string, unknown>,
        toolOutput: 'output' in part ? part.output : undefined,
        status:
          part.state === 'output-available'
            ? ('success' as const)
            : part.state === 'output-error'
              ? ('error' as const)
              : ('running' as const),
      }]
    }

    if (part.type.startsWith('tool-')) {
      const toolPart = part as {
        type: string
        input?: unknown
        output?: unknown
        state?: string
      }
      return [{
        toolName: toolPart.type.replace(/^tool-/, ''),
        toolInput: (toolPart.input ?? {}) as Record<string, unknown>,
        toolOutput: toolPart.output,
        status:
          toolPart.state === 'output-available'
            ? ('success' as const)
            : toolPart.state === 'output-error'
              ? ('error' as const)
              : ('running' as const),
      }]
    }

    return []
  })
}

export function useStudentChat() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      const text = input
      setInput('')
      await sendMessage({ text })
    },
    [input, isLoading, sendMessage]
  )

  return {
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: getMessageContent(message),
      toolCalls: getToolCalls(message),
    })),
    input,
    isLoading,
    onInputChange: setInput,
    handleSubmit,
    stop,
  }
}
