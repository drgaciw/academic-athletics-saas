'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../utils/cn'

const alertBannerVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200 text-gray-900',
        info: 'bg-blue-50 border-blue-200 text-blue-900 [&>svg]:text-blue-600',
        success:
          'bg-green-50 border-green-200 text-green-900 [&>svg]:text-green-600',
        warning:
          'bg-yellow-50 border-yellow-200 text-yellow-900 [&>svg]:text-yellow-600',
        error: 'bg-red-50 border-red-200 text-red-900 [&>svg]:text-red-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

export interface AlertBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertBannerVariants> {
  title?: string
  description?: string
  onClose?: () => void
  icon?: React.ReactNode
}

export function AlertBanner({
  className,
  variant = 'default',
  title,
  description,
  onClose,
  icon,
  children,
  ...props
}: AlertBannerProps) {
  const Icon = iconMap[variant || 'default']

  return (
    <div
      role="alert"
      className={cn(alertBannerVariants({ variant }), className)}
      {...props}
    >
      {icon || <Icon className="h-5 w-5" />}
      <div className="flex-1">
        {title && (
          <h5 className="mb-1 font-semibold leading-none tracking-tight">
            {title}
          </h5>
        )}
        {description && (
          <div className="text-sm [&_p]:leading-relaxed">{description}</div>
        )}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}