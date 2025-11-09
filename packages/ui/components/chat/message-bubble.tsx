'use client'

import * as React from 'react'
import { User, Bot } from 'lucide-react'
import { cn } from '../../utils/cn'
import { ToolExecutionCard } from './tool-execution-card'
import { CitationFooter } from './citation-footer'
import type { Message } from './message-list'

export interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-brand-primary" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] space-y-2',
          isUser && 'flex flex-col items-end'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-brand-primary text-white'
              : 'bg-gray-100 text-gray-900'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Tool execution cards */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2">
            {message.toolCalls.map((toolCall, index) => (
              <ToolExecutionCard
                key={index}
                toolName={toolCall.toolName}
                toolInput={toolCall.toolInput}
                toolOutput={toolCall.toolOutput}
                status={toolCall.status}
              />
            ))}
          </div>
        )}

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <CitationFooter citations={message.citations} />
        )}

        {message.timestamp && (
          <p className="text-xs text-gray-500 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  )
}