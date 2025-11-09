'use client'

import * as React from 'react'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface Citation {
  title: string
  url: string
}

export interface CitationFooterProps {
  citations: Citation[]
  className?: string
}

export function CitationFooter({ citations, className }: CitationFooterProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  if (citations.length === 0) return null

  return (
    <div className={cn('text-xs', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
      >
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {citations.length} {citations.length === 1 ? 'source' : 'sources'}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1">
          {citations.map((citation, index) => (
            <a
              key={index}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 text-gray-700 hover:text-gray-900"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span className="flex-1 line-clamp-2">{citation.title}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}