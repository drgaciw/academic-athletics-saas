'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  sport: string
  year: string
  gpa: number
  creditsEarned: number
  eligibilityStatus: 'eligible' | 'at-risk' | 'ineligible' | 'pending-review'
}

export interface StudentsListFilters {
  search?: string
  sport?: string
  year?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface StudentsListResponse {
  students: Student[]
  total: number
  page: number
  pageSize: number
}

async function fetchStudentsList(filters?: StudentsListFilters): Promise<StudentsListResponse> {
  const params = new URLSearchParams()
  
  if (filters?.search) params.append('search', filters.search)
  if (filters?.sport) params.append('sport', filters.sport)
  if (filters?.year) params.append('year', filters.year)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())

  const response = await fetch(`/api/user/students?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch students list')
  }
  return response.json()
}

export function useStudentsList(
  filters?: StudentsListFilters,
  options?: Omit<UseQueryOptions<StudentsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const filterString = JSON.stringify(filters || {})
  
  return useQuery({
    queryKey: queryKeys.students.list(filterString),
    queryFn: () => fetchStudentsList(filters),
    ...options,
  })
}