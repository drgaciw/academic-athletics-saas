'use client'

import * as React from 'react'
import { Bot } from 'lucide-react'

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-brand-primary" />
      </div>

      <div className="bg-gray-100 rounded-lg px-4 py-3">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}