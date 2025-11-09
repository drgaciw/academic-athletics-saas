'use client'

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'
import type { Alert } from './use-alerts'

async function acknowledgeAlert(alertId: string): Promise<Alert> {
  const response = await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
    method: 'POST',
  })
  
  if (!response.ok) {
    throw new Error('Failed to acknowledge alert')
  }
  
  return response.json()
}

export function useAcknowledgeAlert(
  options?: Omit<UseMutationOptions<Alert, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acknowledgeAlert,
    
    onSuccess: () => {
      // Invalidate all alert queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all })
    },
    
    ...options,
  })
}