'use client'

import * as React from 'react'
import { Loader2, CheckCircle, XCircle, Wrench } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface ToolExecutionCardProps {
  toolName: string
  toolInput: Record<string, any>
  toolOutput?: any
  status: 'running' | 'success' | 'error'
}

export function ToolExecutionCard({
  toolName,
  toolInput,
  toolOutput,
  status,
}: ToolExecutionCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const statusConfig = {
    running: {
      icon: Loader2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      label: 'Running',
    },
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Success',
    },
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Error',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-sm',
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            'h-4 w-4 flex-shrink-0 mt-0.5',
            config.color,
            status === 'running' && 'animate-spin'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-3 w-3 text-gray-500" />
              <span className="font-medium text-gray-900">{toolName}</span>
            </div>
            <span className={cn('text-xs font-medium', config.color)}>
              {config.label}
            </span>
          </div>

          {Object.keys(toolInput).length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-600 hover:text-gray-900 mt-1"
            >
              {isExpanded ? 'Hide' : 'Show'} details
            </button>
          )}

          {isExpanded && (
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Input:</p>
                <pre className="text-xs bg-white rounded p-2 overflow-x-auto">
                  {JSON.stringify(toolInput, null, 2)}
                </pre>
              </div>
              {toolOutput && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Output:
                  </p>
                  <pre className="text-xs bg-white rounded p-2 overflow-x-auto">
                    {JSON.stringify(toolOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}