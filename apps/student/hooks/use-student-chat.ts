'use client'

import { useCallback, useRef, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '/student'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls: []
}

type ChatApiResponse = {
  conversationId?: string
  response?: string
  error?: { message?: string }
}

export function useStudentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || isLoading) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        toolCalls: [],
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, conversationId }),
          signal: controller.signal,
        })

        const data = (await response.json()) as ChatApiResponse
        if (!response.ok) {
          throw new Error(data.error?.message ?? 'Chat request failed')
        }

        if (data.conversationId) {
          setConversationId(data.conversationId)
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.response ?? '',
            toolCalls: [],
          },
        ])
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              'Sorry, something went wrong. Please try again or contact your athletics compliance office for official eligibility guidance.',
            toolCalls: [],
          },
        ])
      } finally {
        setIsLoading(false)
        abortRef.current = null
      }
    },
    [conversationId, input, isLoading]
  )

  return {
    messages,
    input,
    isLoading,
    onInputChange: setInput,
    handleSubmit,
    stop,
  }
}
