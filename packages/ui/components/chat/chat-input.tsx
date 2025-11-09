'use client'

import * as React from 'react'
import { Send, Square } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from '../button'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onStop?: () => void
  isLoading: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  disabled,
  placeholder = 'Ask a question...',
  className,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        onSubmit(e)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !isLoading) {
      onSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'border-t border-gray-200 p-4 bg-white rounded-b-lg',
        className
      )}
    >
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2',
            'text-sm placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-32 overflow-y-auto'
          )}
          aria-label="Chat message"
        />

        {isLoading && onStop ? (
          <Button
            type="button"
            onClick={onStop}
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!value.trim() || disabled}
            size="icon"
            className="flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  )
}