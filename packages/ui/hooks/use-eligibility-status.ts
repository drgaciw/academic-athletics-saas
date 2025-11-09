'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'

export interface EligibilityStatus {
  status: 'eligible' | 'at-risk' | 'ineligible' | 'pending-review'
  gpa: number
  creditsEarned: number
  creditsRequired: number
  nextCheckDate: string
  requirements: Array<{
    name: string
    met: boolean
    value: string
  }>
}

async function fetchEligibilityStatus(studentId: string): Promise<EligibilityStatus> {
  const response = await fetch(`/api/compliance/eligibility/${studentId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch eligibility status')
  }
  return response.json()
}

export function useEligibilityStatus(
  studentId: string,
  options?: Omit<UseQueryOptions<EligibilityStatus, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.compliance.eligibility(studentId),
    queryFn: () => fetchEligibilityStatus(studentId),
    enabled: !!studentId,
    ...options,
  })
}