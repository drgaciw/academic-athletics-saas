'use client'

import * as React from 'react'
import { MessageBubble } from './message-bubble'
import { ThinkingIndicator } from './thinking-indicator'
import { cn } from '../../utils/cn'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  toolCalls?: Array<{
    toolName: string
    toolInput: Record<string, any>
    toolOutput: any
    status: 'running' | 'success' | 'error'
  }>
  citations?: Array<{
    title: string
    url: string
  }>
}

export interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  className?: string
}

export function MessageList({ messages, isLoading, className }: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto p-4 space-y-4',
        'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
        className
      )}
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="h-16 w-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
            <span className="text-brand-primary font-bold text-2xl">AI</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            How can I help you today?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Ask me about courses, eligibility, or NCAA rules
          </p>
          <div className="grid gap-2 w-full max-w-sm">
            <button className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
              Can I take MATH 301 next semester?
            </button>
            <button className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
              What's my current eligibility status?
            </button>
            <button className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
              Explain NCAA academic requirements
            </button>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && <ThinkingIndicator />}

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && 'AI is typing...'}
        {messages.length > 0 &&
          messages[messages.length - 1]?.role === 'assistant' &&
          `AI responded: ${messages[messages.length - 1]?.content.substring(0, 100)}`}
      </div>
    </div>
  )
}