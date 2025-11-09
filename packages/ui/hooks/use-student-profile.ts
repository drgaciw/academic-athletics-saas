'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'

export interface StudentProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  sport: string
  year: string
  gpa: number
  creditsEarned: number
  totalCredits: number
  eligibilityStatus: 'eligible' | 'at-risk' | 'ineligible' | 'pending-review'
}

async function fetchStudentProfile(id: string): Promise<StudentProfile> {
  const response = await fetch(`/api/user/students/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch student profile')
  }
  return response.json()
}

export function useStudentProfile(
  studentId: string,
  options?: Omit<UseQueryOptions<StudentProfile, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.students.profile(studentId),
    queryFn: () => fetchStudentProfile(studentId),
    enabled: !!studentId,
    ...options,
  })
}