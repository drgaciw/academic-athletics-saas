'use client'

import * as React from 'react'
import { MessageSquare, Minimize2, MoreVertical, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from '../button'
import { ChatHeader } from './chat-header'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'

export interface ChatWidgetProps {
  messages: Array<{
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
  }>
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onStop?: () => void
  className?: string
}

export function ChatWidget({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
  className,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      // Escape to minimize
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 md:bottom-6 md:right-6',
          'h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg',
          'hover:bg-brand-primary/90 transition-all',
          'flex items-center justify-center',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2',
          'md:bottom-center', // Mobile: bottom-center
          className
        )}
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed z-50',
        isFullscreen
          ? 'inset-0'
          : 'bottom-4 right-4 md:bottom-6 md:right-6 w-full md:w-[400px] h-[600px]',
        'max-w-full max-h-[calc(100vh-2rem)]',
        'md:max-h-[600px]',
        'flex flex-col',
        'bg-white rounded-lg shadow-2xl border border-gray-200',
        className
      )}
    >
      <ChatHeader
        onMinimize={() => setIsOpen(false)}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        isFullscreen={isFullscreen}
      />

      <MessageList messages={messages} isLoading={isLoading} />

      <ChatInput
        value={input}
        onChange={onInputChange}
        onSubmit={onSubmit}
        onStop={onStop}
        isLoading={isLoading}
        disabled={isLoading}
      />
    </div>
  )
}