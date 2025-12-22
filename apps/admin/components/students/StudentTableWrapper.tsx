'use client'

import { StudentTable } from './StudentTable'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Student = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  studentProfile: {
    studentId: string
    sport: string
    team?: string | null
    gpa?: number | null
    creditHours?: number | null
    eligibilityStatus?: string | null
    academicStanding?: string | null
    complianceRecords: Array<{
      isEligible: boolean
      cumulativeGpa?: number | null
      creditHours?: number | null
    }>
  } | null
}

type StudentTableWrapperProps = {
  students: Student[]
  onExport: (format: 'csv' | 'json') => Promise<string>
  onBulkUpdate: (studentIds: string[], eligibilityStatus: string) => Promise<{ success: boolean; count?: number; error?: string }>
}

export function StudentTableWrapper({ students, onExport, onBulkUpdate }: StudentTableWrapperProps) {
  const router = useRouter()

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const data = await onExport(format)

      // Create a download link
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `students-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Students exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export students')
    }
  }

  const handleBulkUpdate = async (studentIds: string[], eligibilityStatus: string) => {
    try {
      const result = await onBulkUpdate(studentIds, eligibilityStatus)

      if (result.success) {
        toast.success(`Updated ${result.count} student(s)`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update students')
      }
    } catch (error) {
      console.error('Bulk update error:', error)
      toast.error('Failed to update students')
    }
  }

  return (
    <StudentTable
      data={students}
      onExport={handleExport}
      onBulkUpdate={handleBulkUpdate}
    />
  )
}
