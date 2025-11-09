'use client'

import * as React from 'react'
import { Minimize2, Maximize2, MoreVertical, Download, Trash2 } from 'lucide-react'
import { Button } from '../button'
import { Popover, PopoverTrigger, PopoverContent } from '../date-picker'

export interface ChatHeaderProps {
  onMinimize: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
  onExport?: () => void
  onClear?: () => void
}

export function ChatHeader({
  onMinimize,
  onToggleFullscreen,
  isFullscreen,
  onExport,
  onClear,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
          <span className="text-brand-primary font-semibold text-sm">AI</span>
        </div>
        <h2 className="font-semibold text-gray-900">AI Assistant</h2>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="flex flex-col gap-1">
              {onExport && (
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 text-left"
                >
                  <Download className="h-4 w-4" />
                  Export conversation
                </button>
              )}
              {onClear && (
                <button
                  onClick={onClear}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 text-left text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear history
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={onMinimize}
          aria-label="Minimize chat"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}