'use client'

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'
import type { StudentProfile } from './use-student-profile'

export interface UpdateStudentData {
  firstName?: string
  lastName?: string
  email?: string
  sport?: string
  year?: string
}

async function updateStudent(id: string, data: UpdateStudentData): Promise<StudentProfile> {
  const response = await fetch(`/api/user/students/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update student')
  }
  
  return response.json()
}

export function useUpdateStudent(
  options?: Omit<
    UseMutationOptions<
      StudentProfile, 
      Error, 
      { id: string; data: UpdateStudentData },
      { previousStudent: StudentProfile | undefined }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateStudent(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.students.profile(id) })

      // Snapshot previous value
      const previousStudent = queryClient.getQueryData<StudentProfile>(
        queryKeys.students.profile(id)
      )

      // Optimistically update
      if (previousStudent) {
        queryClient.setQueryData<StudentProfile>(
          queryKeys.students.profile(id),
          {
            ...previousStudent,
            ...data,
          }
        )
      }

      return { previousStudent }
    },
    
    // On error, rollback
    onError: (err, { id }, context) => {
      if (context?.previousStudent) {
        queryClient.setQueryData(
          queryKeys.students.profile(id),
          context.previousStudent
        )
      }
    },
    
    // Always refetch after error or success
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.profile(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() })
    },
    
    ...options,
  })
}