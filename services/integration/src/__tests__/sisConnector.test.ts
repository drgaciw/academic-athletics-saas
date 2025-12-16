/**
 * SIS Connector Tests
 * Tests for Student Information System integration
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest'
import { SISConnector, SISStudent, SISEnrollment, SISTranscript } from '../services/sisConnector'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as Mocked<typeof axios>

describe('SISConnector', () => {
  let sisConnector: SISConnector
  let mockClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockClient = {
      get: vi.fn(),
    }

    mockedAxios.create.mockReturnValue(mockClient)

    // Mock environment variables
    process.env.SIS_API_URL = 'https://sis.example.com/api'
    process.env.SIS_API_KEY = 'test-api-key'

    sisConnector = new SISConnector()
  })

  afterEach(() => {
    delete process.env.SIS_API_URL
    delete process.env.SIS_API_KEY
  })

  describe('Constructor', () => {
    it('should create axios client with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://sis.example.com/api',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
          timeout: 60000,
        })
      )
    })

    it('should not create client when env variables are missing', () => {
      delete process.env.SIS_API_URL
      delete process.env.SIS_API_KEY

      mockedAxios.create.mockClear()
      new SISConnector()

      expect(mockedAxios.create).not.toHaveBeenCalled()
    })
  })

  describe('importStudent', () => {
    it('should import student data successfully', async () => {
      const mockResponse = {
        data: {
          id: 'student-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          student_id: 'S12345',
          date_of_birth: '2000-01-15',
          status: 'active',
          admission_date: '2022-08-01',
          expected_graduation_date: '2026-05-15',
        },
      }

      mockClient.get.mockResolvedValue(mockResponse)

      const result = await sisConnector.importStudent('student-123')

      expect(result.success).toBe(true)
      expect(result.recordsImported).toBe(1)
      expect(result.data).toMatchObject({
        id: 'student-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        studentId: 'S12345',
        enrollmentStatus: 'enrolled',
      })
    })

    it('should handle student not found', async () => {
      mockClient.get.mockRejectedValue(new Error('Student not found'))

      const result = await sisConnector.importStudent('nonexistent')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Student not found')
    })

    it('should handle API errors gracefully', async () => {
      mockClient.get.mockRejectedValue(new Error('Network error'))

      const result = await sisConnector.importStudent('student-123')

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors![0]).toContain('Network error')
    })

    it('should handle non-Error exceptions', async () => {
      mockClient.get.mockRejectedValue('Unknown error')

      const result = await sisConnector.importStudent('student-123')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Failed to import student data')
    })
  })

  describe('importEnrollments', () => {
    it('should import enrollments for a student', async () => {
      const mockResponse = {
        data: [
          {
            student_id: 'student-123',
            course_id: 'course-1',
            course_name: 'Introduction to Computer Science',
            course_code: 'CS101',
            term: 'Fall 2024',
            credits: 3,
            status: 'enrolled',
            grade: null,
            grade_points: null,
          },
          {
            student_id: 'student-123',
            course_id: 'course-2',
            course_name: 'Calculus I',
            course_code: 'MATH101',
            term: 'Fall 2024',
            credits: 4,
            status: 'enrolled',
            grade: null,
            grade_points: null,
          },
        ],
      }

      mockClient.get.mockResolvedValue(mockResponse)

      const result = await sisConnector.importEnrollments('student-123')

      expect(result.success).toBe(true)
      expect(result.recordsImported).toBe(2)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].courseCode).toBe('CS101')
    })

    it('should filter enrollments by term when provided', async () => {
      const mockResponse = { data: [] }
      mockClient.get.mockResolvedValue(mockResponse)

      await sisConnector.importEnrollments('student-123', 'Fall 2024')

      expect(mockClient.get).toHaveBeenCalledWith(
        '/students/student-123/enrollments',
        { params: { term: 'Fall 2024' } }
      )
    })

    it('should handle empty enrollments', async () => {
      mockClient.get.mockResolvedValue({ data: [] })

      const result = await sisConnector.importEnrollments('student-123')

      expect(result.success).toBe(true)
      expect(result.recordsImported).toBe(0)
      expect(result.data).toHaveLength(0)
    })

    it('should handle API errors', async () => {
      mockClient.get.mockRejectedValue(new Error('API unavailable'))

      const result = await sisConnector.importEnrollments('student-123')

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('importTranscript', () => {
    it('should import transcript data', async () => {
      const mockResponse = {
        data: {
          student_id: 'student-123',
          first_name: 'John',
          last_name: 'Doe',
          enrollments: [
            {
              student_id: 'student-123',
              course_id: 'course-1',
              course_name: 'CS101',
              course_code: 'CS101',
              term: 'Fall 2023',
              credits: 3,
              grade: 'A',
              grade_points: 4.0,
            },
          ],
          cumulative_gpa: 3.5,
          total_credits_earned: 45,
          total_credits_attempted: 48,
          academic_standing: 'Good Standing',
        },
      }

      mockClient.get.mockResolvedValue(mockResponse)

      const result = await sisConnector.importTranscript('student-123')

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        studentId: 'student-123',
        studentName: 'John Doe',
        cumulativeGPA: 3.5,
        totalCreditsEarned: 45,
        totalCreditsAttempted: 48,
        academicStanding: 'Good Standing',
      })
    })

    it('should handle transcript with multiple enrollments', async () => {
      const mockResponse = {
        data: {
          student_id: 'student-123',
          first_name: 'John',
          last_name: 'Doe',
          enrollments: [
            { course_code: 'CS101', term: 'Fall 2023', grade: 'A' },
            { course_code: 'MATH101', term: 'Fall 2023', grade: 'B+' },
            { course_code: 'ENG101', term: 'Spring 2024', grade: 'A-' },
          ],
          cumulative_gpa: 3.6,
          total_credits_earned: 30,
          total_credits_attempted: 30,
          academic_standing: 'Good Standing',
        },
      }

      mockClient.get.mockResolvedValue(mockResponse)

      const result = await sisConnector.importTranscript('student-123')

      expect(result.success).toBe(true)
      expect(result.data.enrollments).toHaveLength(3)
    })
  })

  describe('batchImportStudents', () => {
    it('should import multiple students', async () => {
      const mockStudentResponse = (id: string) => ({
        data: {
          id,
          first_name: `Student`,
          last_name: id,
          email: `${id}@example.com`,
          student_id: id,
          status: 'active',
        },
      })

      mockClient.get
        .mockResolvedValueOnce(mockStudentResponse('student-1'))
        .mockResolvedValueOnce(mockStudentResponse('student-2'))
        .mockResolvedValueOnce(mockStudentResponse('student-3'))

      const result = await sisConnector.batchImportStudents([
        'student-1',
        'student-2',
        'student-3',
      ])

      expect(result.recordsImported).toBe(3)
      expect(result.data).toHaveLength(3)
    })

    it('should handle partial failures in batch import', async () => {
      mockClient.get
        .mockResolvedValueOnce({
          data: {
            id: 'student-1',
            first_name: 'Student',
            last_name: 'One',
            email: 'one@example.com',
            student_id: 'S1',
            status: 'active',
          },
        })
        .mockRejectedValueOnce(new Error('Student not found'))
        .mockResolvedValueOnce({
          data: {
            id: 'student-3',
            first_name: 'Student',
            last_name: 'Three',
            email: 'three@example.com',
            student_id: 'S3',
            status: 'active',
          },
        })

      const result = await sisConnector.batchImportStudents([
        'student-1',
        'student-2',
        'student-3',
      ])

      expect(result.success).toBe(false)
      expect(result.recordsImported).toBe(2)
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0]).toContain('student-2')
    })

    it('should handle empty student list', async () => {
      const result = await sisConnector.batchImportStudents([])

      expect(result.success).toBe(true)
      expect(result.recordsImported).toBe(0)
      expect(result.data).toHaveLength(0)
    })
  })

  describe('importAllStudentData', () => {
    it('should import student, enrollments, and transcript in parallel', async () => {
      mockClient.get
        .mockResolvedValueOnce({
          data: {
            id: 'student-123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            student_id: 'S123',
            status: 'active',
          },
        })
        .mockResolvedValueOnce({
          data: [
            { course_code: 'CS101', term: 'Fall 2024', status: 'enrolled' },
          ],
        })
        .mockResolvedValueOnce({
          data: {
            student_id: 'student-123',
            first_name: 'John',
            last_name: 'Doe',
            enrollments: [],
            cumulative_gpa: 3.5,
            total_credits_earned: 45,
            total_credits_attempted: 45,
            academic_standing: 'Good Standing',
          },
        })

      const result = await sisConnector.importAllStudentData('student-123')

      expect(result.student.success).toBe(true)
      expect(result.enrollments.success).toBe(true)
      expect(result.transcript.success).toBe(true)
    })
  })

  describe('verifyEligibilityData', () => {
    it('should verify complete eligibility data', async () => {
      mockClient.get
        .mockResolvedValueOnce({
          data: {
            id: 'student-123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            student_id: 'S123',
            status: 'active',
          },
        })
        .mockResolvedValueOnce({
          data: [
            { course_code: 'CS101', status: 'enrolled' },
          ],
        })
        .mockResolvedValueOnce({
          data: {
            student_id: 'student-123',
            first_name: 'John',
            last_name: 'Doe',
            enrollments: [],
            cumulative_gpa: 3.5,
            total_credits_earned: 45,
            total_credits_attempted: 45,
            academic_standing: 'Good Standing',
          },
        })

      const result = await sisConnector.verifyEligibilityData('student-123')

      expect(result.isValid).toBe(true)
      expect(result.missingFields).toHaveLength(0)
      expect(result.data).toBeDefined()
      expect(result.data?.hasValidGPA).toBe(true)
      expect(result.data?.hasValidCredits).toBe(true)
      expect(result.data?.hasCurrentEnrollment).toBe(true)
    })

    it('should detect missing student profile', async () => {
      mockClient.get.mockRejectedValue(new Error('Student not found'))

      const result = await sisConnector.verifyEligibilityData('nonexistent')

      expect(result.isValid).toBe(false)
      expect(result.missingFields).toContain('student profile')
    })

    it('should detect zero GPA as invalid', async () => {
      mockClient.get
        .mockResolvedValueOnce({
          data: {
            id: 'student-123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            student_id: 'S123',
            status: 'active',
          },
        })
        .mockResolvedValueOnce({
          data: [{ status: 'enrolled' }],
        })
        .mockResolvedValueOnce({
          data: {
            student_id: 'student-123',
            first_name: 'John',
            last_name: 'Doe',
            enrollments: [],
            cumulative_gpa: 0,
            total_credits_earned: 0,
            total_credits_attempted: 0,
            academic_standing: 'New Student',
          },
        })

      const result = await sisConnector.verifyEligibilityData('student-123')

      expect(result.isValid).toBe(true)
      expect(result.data?.hasValidGPA).toBe(false)
      expect(result.data?.hasValidCredits).toBe(false)
    })
  })

  describe('importTermEnrollments', () => {
    it('should import all enrollments for a term', async () => {
      const mockResponse = {
        data: [
          { student_id: 'S1', course_code: 'CS101', term: 'Fall 2024', status: 'enrolled' },
          { student_id: 'S2', course_code: 'CS101', term: 'Fall 2024', status: 'enrolled' },
          { student_id: 'S3', course_code: 'CS201', term: 'Fall 2024', status: 'enrolled' },
        ],
      }

      mockClient.get.mockResolvedValue(mockResponse)

      const result = await sisConnector.importTermEnrollments('Fall 2024')

      expect(result.success).toBe(true)
      expect(result.recordsImported).toBe(3)
      expect(mockClient.get).toHaveBeenCalledWith('/enrollments', {
        params: { term: 'Fall 2024' },
      })
    })
  })

  describe('checkConnection', () => {
    it('should return true when connection is healthy', async () => {
      mockClient.get.mockResolvedValue({ data: { status: 'ok' } })

      const result = await sisConnector.checkConnection()

      expect(result).toBe(true)
      expect(mockClient.get).toHaveBeenCalledWith('/health')
    })

    it('should return false when connection fails', async () => {
      mockClient.get.mockRejectedValue(new Error('Connection failed'))

      const result = await sisConnector.checkConnection()

      expect(result).toBe(false)
    })

    it('should return false when client is not configured', async () => {
      delete process.env.SIS_API_URL
      delete process.env.SIS_API_KEY

      mockedAxios.create.mockReturnValue(null as any)
      const connector = new SISConnector()

      const result = await connector.checkConnection()

      expect(result).toBe(false)
    })
  })

  describe('Enrollment Status Mapping', () => {
    it('should map active to enrolled', async () => {
      mockClient.get.mockResolvedValue({
        data: {
          id: 'student-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          student_id: 'S123',
          status: 'active',
        },
      })

      const result = await sisConnector.importStudent('student-123')

      expect(result.data.enrollmentStatus).toBe('enrolled')
    })

    it('should map withdrawn status correctly', async () => {
      mockClient.get.mockResolvedValue({
        data: {
          id: 'student-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          student_id: 'S123',
          status: 'withdrawn',
        },
      })

      const result = await sisConnector.importStudent('student-123')

      expect(result.data.enrollmentStatus).toBe('withdrawn')
    })

    it('should map completed/finished to completed', async () => {
      mockClient.get.mockResolvedValue({
        data: {
          id: 'student-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          student_id: 'S123',
          status: 'finished',
        },
      })

      const result = await sisConnector.importStudent('student-123')

      expect(result.data.enrollmentStatus).toBe('completed')
    })
  })
})
