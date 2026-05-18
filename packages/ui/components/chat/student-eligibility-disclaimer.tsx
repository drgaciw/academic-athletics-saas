'use client'

import * as React from 'react'
import { cn } from '../../utils/cn'

const DEFAULT_COPY =
  'Institutional athletics compliance makes official eligibility decisions. This assistant provides preliminary decision support only—not a final determination of competition eligibility.'

export interface StudentEligibilityDisclaimerProps {
  className?: string
  /** Override default PRD-aligned copy */
  children?: React.ReactNode
}

/**
 * PRD v2.2 — persistent visible notice on student-facing AI chat surfaces.
 */
export function StudentEligibilityDisclaimer({
  className,
  children,
}: StudentEligibilityDisclaimerProps) {
  return (
    <aside
      role="note"
      aria-live="polite"
      className={cn(
        'shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950',
        className
      )}
    >
      {children ?? DEFAULT_COPY}
    </aside>
  )
}
