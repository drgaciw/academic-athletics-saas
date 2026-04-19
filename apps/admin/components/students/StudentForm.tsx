'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@aah/ui'
import { toast } from 'sonner'
import type { StudentFormData } from '../../app/students/actions'

type StudentFormProps = {
  studentId?: string
  initialData?: Partial<StudentFormData>
  onCreate?: (data: StudentFormData) => Promise<{ success: boolean; id?: string; error?: string }>
  onUpdate?: (id: string, data: Partial<StudentFormData>) => Promise<{ success: boolean; error?: string }>
}

export function StudentForm({ studentId, initialData, onCreate, onUpdate }: StudentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<StudentFormData>>(
    initialData || {
      email: '',
      firstName: '',
      lastName: '',
      studentId: '',
      sport: '',
      team: '',
      gpa: undefined,
      creditHours: undefined,
      eligibilityStatus: 'PENDING',
      academicStanding: '',
      enrollmentStatus: 'FULL_TIME',
      major: '',
      minor: '',
      advisor: '',
      expectedGradDate: '',
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let result

      if (studentId && onUpdate) {
        // Update existing student
        result = await onUpdate(studentId, formData)
      } else if (onCreate) {
        // Create new student
        result = await onCreate(formData as StudentFormData)
      } else {
        throw new Error('No submit handler provided')
      }

      if (result.success) {
        toast.success(studentId ? 'Student updated successfully' : 'Student created successfully')

        if (studentId) {
          router.push(`/students/${studentId}`)
        } else if ('id' in result && result.id) {
          router.push(`/students/${result.id}`)
        } else {
          router.push('/students')
        }
      } else {
        toast.error(result.error || 'Failed to save student')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save student')
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target

    let processedValue: string | number | undefined = value

    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value)
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="studentId" className="block text-sm font-medium mb-1">
            Student ID *
          </label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Athletic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Athletic Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="sport" className="block text-sm font-medium mb-1">
              Sport *
            </label>
            <select
              id="sport"
              name="sport"
              value={formData.sport}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Sport</option>
              <option value="Basketball">Basketball</option>
              <option value="Football">Football</option>
              <option value="Soccer">Soccer</option>
              <option value="Baseball">Baseball</option>
              <option value="Softball">Softball</option>
              <option value="Track">Track</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Swimming">Swimming</option>
              <option value="Tennis">Tennis</option>
              <option value="Golf">Golf</option>
            </select>
          </div>

          <div>
            <label htmlFor="team" className="block text-sm font-medium mb-1">
              Team
            </label>
            <input
              type="text"
              id="team"
              name="team"
              value={formData.team || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Varsity, JV"
            />
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Academic Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="gpa" className="block text-sm font-medium mb-1">
              GPA
            </label>
            <input
              type="number"
              id="gpa"
              name="gpa"
              value={formData.gpa ?? ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3.5"
            />
          </div>

          <div>
            <label htmlFor="creditHours" className="block text-sm font-medium mb-1">
              Credit Hours
            </label>
            <input
              type="number"
              id="creditHours"
              name="creditHours"
              value={formData.creditHours ?? ''}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 12"
            />
          </div>

          <div>
            <label htmlFor="major" className="block text-sm font-medium mb-1">
              Major
            </label>
            <input
              type="text"
              id="major"
              name="major"
              value={formData.major || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="minor" className="block text-sm font-medium mb-1">
              Minor
            </label>
            <input
              type="text"
              id="minor"
              name="minor"
              value={formData.minor || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="advisor" className="block text-sm font-medium mb-1">
              Academic Advisor
            </label>
            <input
              type="text"
              id="advisor"
              name="advisor"
              value={formData.advisor || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="expectedGradDate" className="block text-sm font-medium mb-1">
              Expected Graduation Date
            </label>
            <input
              type="date"
              id="expectedGradDate"
              name="expectedGradDate"
              value={formData.expectedGradDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status Information</h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="eligibilityStatus" className="block text-sm font-medium mb-1">
              Eligibility Status
            </label>
            <select
              id="eligibilityStatus"
              name="eligibilityStatus"
              value={formData.eligibilityStatus || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="ELIGIBLE">Eligible</option>
              <option value="INELIGIBLE">Ineligible</option>
              <option value="CONDITIONAL">Conditional</option>
            </select>
          </div>

          <div>
            <label htmlFor="academicStanding" className="block text-sm font-medium mb-1">
              Academic Standing
            </label>
            <input
              type="text"
              id="academicStanding"
              name="academicStanding"
              value={formData.academicStanding || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Good Standing"
            />
          </div>

          <div>
            <label htmlFor="enrollmentStatus" className="block text-sm font-medium mb-1">
              Enrollment Status
            </label>
            <select
              id="enrollmentStatus"
              name="enrollmentStatus"
              value={formData.enrollmentStatus || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : studentId ? 'Update Student' : 'Create Student'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
