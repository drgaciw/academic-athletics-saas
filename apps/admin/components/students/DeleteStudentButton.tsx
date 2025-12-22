'use client'

import { Button } from '@aah/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteStudent } from '../../app/students/actions'
import { toast } from 'sonner'

type DeleteStudentButtonProps = {
  studentId: string
}

export function DeleteStudentButton({ studentId }: DeleteStudentButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteStudent(studentId)

      if (result?.success === false) {
        toast.error(result.error || 'Failed to delete student')
        setIsDeleting(false)
      } else {
        toast.success('Student deleted successfully')
        // The server action redirects, so we don't need to do anything here
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete student')
      setIsDeleting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="destructive"
          size="sm"
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowConfirm(true)}
      variant="destructive"
    >
      Delete Student
    </Button>
  )
}
