/**
 * LMS Connector Tests
 * Tests for Canvas and Blackboard LMS integration
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest'
import { LMSConnector, LMSCourse, LMSAssignment, LMSGrade } from '../services/lmsConnector'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as Mocked<typeof axios>

describe('LMSConnector', () => {
  let lmsConnector: LMSConnector
  let mockCanvasClient: any
  let mockBlackboardClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockCanvasClient = {
      get: vi.fn(),
    }
    mockBlackboardClient = {
      get: vi.fn(),
    }

    // Track which client is being created
    let clientIndex = 0
    mockedAxios.create.mockImplementation(() => {
      clientIndex++
      if (clientIndex === 1) return mockCanvasClient
      return mockBlackboardClient
    })

    // Mock environment variables
    process.env.CANVAS_API_URL = 'https://canvas.example.com'
    process.env.CANVAS_API_TOKEN = 'canvas-test-token'
    process.env.BLACKBOARD_API_URL = 'https://blackboard.example.com'
    process.env.BLACKBOARD_API_TOKEN = 'blackboard-test-token'

    lmsConnector = new LMSConnector()
  })

  afterEach(() => {
    delete process.env.CANVAS_API_URL
    delete process.env.CANVAS_API_TOKEN
    delete process.env.BLACKBOARD_API_URL
    delete process.env.BLACKBOARD_API_TOKEN
  })

  describe('Canvas Integration', () => {
    describe('getCanvasCourses', () => {
      it('should fetch Canvas courses successfully', async () => {
        const mockResponse = {
          data: [
            {
              id: 12345,
              name: 'Introduction to Computer Science',
              course_code: 'CS101',
              enrollment_term_id: 1,
            },
            {
              id: 12346,
              name: 'Calculus I',
              course_code: 'MATH101',
              enrollment_term_id: 1,
            },
          ],
        }

        mockCanvasClient.get.mockResolvedValue(mockResponse)

        const result = await lmsConnector.getCanvasCourses('student-123')

        expect(result.success).toBe(true)
        expect(result.provider).toBe('canvas')
        expect(result.data).toHaveLength(2)
        expect(result.data[0]).toMatchObject({
          id: '12345',
          name: 'Introduction to Computer Science',
          courseCode: 'CS101',
        })
      })

      it('should include correct query parameters', async () => {
        mockCanvasClient.get.mockResolvedValue({ data: [] })

        await lmsConnector.getCanvasCourses('student-123')

        expect(mockCanvasClient.get).toHaveBeenCalledWith(
          '/api/v1/users/student-123/courses',
          {
            params: {
              enrollment_state: 'active',
              include: ['term', 'total_scores'],
            },
          }
        )
      })

      it('should handle API errors', async () => {
        mockCanvasClient.get.mockRejectedValue(new Error('Unauthorized'))

        const result = await lmsConnector.getCanvasCourses('student-123')

        expect(result.success).toBe(false)
        expect(result.provider).toBe('canvas')
        expect(result.error).toContain('Unauthorized')
      })

      it('should handle empty course list', async () => {
        mockCanvasClient.get.mockResolvedValue({ data: [] })

        const result = await lmsConnector.getCanvasCourses('student-123')

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(0)
      })
    })

    describe('getCanvasAssignments', () => {
      it('should fetch assignments for a course', async () => {
        const mockResponse = {
          data: [
            {
              id: 1001,
              name: 'Homework 1',
              due_at: '2024-11-15T23:59:59Z',
              points_possible: 100,
              submission: {
                submitted_at: '2024-11-14T20:00:00Z',
                score: 95,
                grade: 'A',
              },
            },
            {
              id: 1002,
              name: 'Midterm Exam',
              due_at: '2024-10-20T14:00:00Z',
              points_possible: 200,
              submission: null,
            },
          ],
        }

        mockCanvasClient.get.mockResolvedValue(mockResponse)

        const result = await lmsConnector.getCanvasAssignments('12345', 'student-123')

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(2)
        expect(result.data[0]).toMatchObject({
          id: '1001',
          courseId: '12345',
          name: 'Homework 1',
          pointsPossible: 100,
          score: 95,
        })
      })

      it('should handle assignments without submissions', async () => {
        const mockResponse = {
          data: [
            {
              id: 1001,
              name: 'Upcoming Assignment',
              due_at: '2024-12-01T23:59:59Z',
              points_possible: 50,
              submission: null,
            },
          ],
        }

        mockCanvasClient.get.mockResolvedValue(mockResponse)

        const result = await lmsConnector.getCanvasAssignments('12345', 'student-123')

        expect(result.success).toBe(true)
        expect(result.data[0].submittedAt).toBeUndefined()
        expect(result.data[0].score).toBeUndefined()
      })

      it('should use correct pagination parameters', async () => {
        mockCanvasClient.get.mockResolvedValue({ data: [] })

        await lmsConnector.getCanvasAssignments('12345', 'student-123')

        expect(mockCanvasClient.get).toHaveBeenCalledWith(
          '/api/v1/courses/12345/assignments',
          {
            params: {
              include: ['submission'],
              per_page: 100,
            },
          }
        )
      })
    })

    describe('getCanvasGrades', () => {
      it('should fetch grades for all courses', async () => {
        // First call: get courses
        mockCanvasClient.get
          .mockResolvedValueOnce({
            data: [
              { id: 12345, name: 'CS101', course_code: 'CS101' },
            ],
          })
          // Second call: get submissions
          .mockResolvedValueOnce({
            data: { submissions: [] },
          })
          // Third call: get enrollments
          .mockResolvedValueOnce({
            data: [
              {
                grades: {
                  current_grade: 'A',
                  current_score: 95,
                  final_grade: null,
                  final_score: null,
                },
              },
            ],
          })

        const result = await lmsConnector.getCanvasGrades('student-123')

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data[0]).toMatchObject({
          courseId: '12345',
          courseName: 'CS101',
          currentGrade: 'A',
          currentScore: 95,
        })
      })

      it('should handle courses with no enrollments', async () => {
        mockCanvasClient.get
          .mockResolvedValueOnce({
            data: [{ id: 12345, name: 'CS101', course_code: 'CS101' }],
          })
          .mockResolvedValueOnce({ data: {} })
          .mockResolvedValueOnce({ data: [] })

        const result = await lmsConnector.getCanvasGrades('student-123')

        expect(result.success).toBe(true)
        expect(result.data[0].currentGrade).toBeUndefined()
      })

      it('should continue fetching when one course fails', async () => {
        mockCanvasClient.get
          .mockResolvedValueOnce({
            data: [
              { id: 12345, name: 'CS101', course_code: 'CS101' },
              { id: 12346, name: 'MATH101', course_code: 'MATH101' },
            ],
          })
          // CS101 submissions fail
          .mockRejectedValueOnce(new Error('Permission denied'))
          // MATH101 submissions succeed
          .mockResolvedValueOnce({ data: {} })
          .mockResolvedValueOnce({
            data: [{ grades: { current_grade: 'B' } }],
          })

        const result = await lmsConnector.getCanvasGrades('student-123')

        expect(result.success).toBe(true)
        // Should still get MATH101 grade
        expect(result.data.some(g => g.courseName === 'MATH101')).toBe(true)
      })
    })
  })

  describe('Blackboard Integration', () => {
    describe('getBlackboardCourses', () => {
      it('should fetch Blackboard courses successfully', async () => {
        const mockResponse = {
          data: {
            results: [
              {
                id: 'bb-course-1',
                name: 'Advanced Programming',
                courseId: 'CS201',
                termId: 'Fall2024',
              },
              {
                id: 'bb-course-2',
                name: 'Data Structures',
                courseId: 'CS202',
                termId: 'Fall2024',
              },
            ],
          },
        }

        mockBlackboardClient.get.mockResolvedValue(mockResponse)

        const result = await lmsConnector.getBlackboardCourses('student-123')

        expect(result.success).toBe(true)
        expect(result.provider).toBe('blackboard')
        expect(result.data).toHaveLength(2)
        expect(result.data[0]).toMatchObject({
          id: 'bb-course-1',
          name: 'Advanced Programming',
          courseCode: 'CS201',
        })
      })

      it('should use correct Blackboard API endpoint', async () => {
        mockBlackboardClient.get.mockResolvedValue({ data: { results: [] } })

        await lmsConnector.getBlackboardCourses('student-123')

        expect(mockBlackboardClient.get).toHaveBeenCalledWith(
          '/learn/api/public/v3/users/student-123/courses'
        )
      })

      it('should handle Blackboard API errors', async () => {
        mockBlackboardClient.get.mockRejectedValue(new Error('Invalid token'))

        const result = await lmsConnector.getBlackboardCourses('student-123')

        expect(result.success).toBe(false)
        expect(result.provider).toBe('blackboard')
        expect(result.error).toContain('Invalid token')
      })
    })

    describe('getBlackboardGrades', () => {
      it('should fetch grades for a course', async () => {
        const mockResponse = {
          data: {
            columnId: 'grade-1',
            grade: 'A',
            score: 92,
          },
        }

        mockBlackboardClient.get.mockResolvedValue(mockResponse)

        const result = await lmsConnector.getBlackboardGrades('student-123', 'bb-course-1')

        expect(result.success).toBe(true)
        expect(result.provider).toBe('blackboard')
        expect(result.data).toBeDefined()
      })

      it('should use correct API path with query params', async () => {
        mockBlackboardClient.get.mockResolvedValue({ data: {} })

        await lmsConnector.getBlackboardGrades('student-123', 'bb-course-1')

        expect(mockBlackboardClient.get).toHaveBeenCalledWith(
          '/learn/api/public/v2/courses/bb-course-1/gradebook/columns',
          {
            params: {
              userId: 'student-123',
            },
          }
        )
      })
    })
  })

  describe('syncStudentData', () => {
    it('should sync Canvas data by default', async () => {
      mockCanvasClient.get
        .mockResolvedValueOnce({ data: [] }) // courses
        .mockResolvedValueOnce({ data: [] }) // grades courses

      const result = await lmsConnector.syncStudentData('student-123')

      expect(result.courses.provider).toBe('canvas')
      expect(result.grades.provider).toBe('canvas')
    })

    it('should sync Blackboard data when specified', async () => {
      mockBlackboardClient.get.mockResolvedValue({ data: { results: [] } })

      const result = await lmsConnector.syncStudentData('student-123', 'blackboard')

      expect(result.courses.provider).toBe('blackboard')
      expect(result.grades.provider).toBe('blackboard')
    })

    it('should fetch grades for each Blackboard course', async () => {
      mockBlackboardClient.get
        .mockResolvedValueOnce({
          data: {
            results: [
              { id: 'bb-1', name: 'Course 1', courseId: 'C1' },
              { id: 'bb-2', name: 'Course 2', courseId: 'C2' },
            ],
          },
        })
        .mockResolvedValueOnce({ data: { grade: 'A', score: 95 } })
        .mockResolvedValueOnce({ data: { grade: 'B', score: 85 } })

      const result = await lmsConnector.syncStudentData('student-123', 'blackboard')

      expect(result.grades.data).toHaveLength(2)
      expect(mockBlackboardClient.get).toHaveBeenCalledTimes(3)
    })
  })

  describe('batchSyncStudents', () => {
    it('should sync multiple students', async () => {
      mockCanvasClient.get.mockResolvedValue({ data: [] })

      const result = await lmsConnector.batchSyncStudents([
        'student-1',
        'student-2',
        'student-3',
      ])

      expect(Object.keys(result)).toHaveLength(3)
      expect(result['student-1']).toBeDefined()
      expect(result['student-2']).toBeDefined()
      expect(result['student-3']).toBeDefined()
    })

    it('should respect rate limiting delay', async () => {
      mockCanvasClient.get.mockResolvedValue({ data: [] })

      const startTime = Date.now()

      await lmsConnector.batchSyncStudents(['student-1', 'student-2'])

      const endTime = Date.now()
      const elapsed = endTime - startTime

      // Should take at least 200ms (1 delay of 200ms)
      expect(elapsed).toBeGreaterThanOrEqual(150) // Allow some tolerance
    })
  })

  describe('checkConnection', () => {
    it('should check Canvas connection successfully', async () => {
      mockCanvasClient.get.mockResolvedValue({ data: { id: 1 } })

      const result = await lmsConnector.checkConnection('canvas')

      expect(result).toBe(true)
      expect(mockCanvasClient.get).toHaveBeenCalledWith('/api/v1/accounts/self')
    })

    it('should check Blackboard connection successfully', async () => {
      mockBlackboardClient.get.mockResolvedValue({ data: { version: '1.0' } })

      const result = await lmsConnector.checkConnection('blackboard')

      expect(result).toBe(true)
      expect(mockBlackboardClient.get).toHaveBeenCalledWith(
        '/learn/api/public/v1/system/version'
      )
    })

    it('should return false on Canvas connection failure', async () => {
      mockCanvasClient.get.mockRejectedValue(new Error('Connection failed'))

      const result = await lmsConnector.checkConnection('canvas')

      expect(result).toBe(false)
    })

    it('should return false on Blackboard connection failure', async () => {
      mockBlackboardClient.get.mockRejectedValue(new Error('Timeout'))

      const result = await lmsConnector.checkConnection('blackboard')

      expect(result).toBe(false)
    })
  })

  describe('Constructor Configuration', () => {
    it('should create Canvas client with correct headers', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://canvas.example.com',
          headers: expect.objectContaining({
            'Authorization': 'Bearer canvas-test-token',
          }),
          timeout: 30000,
        })
      )
    })

    it('should create Blackboard client with correct headers', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://blackboard.example.com',
          headers: expect.objectContaining({
            'Authorization': 'Bearer blackboard-test-token',
          }),
        })
      )
    })

    it('should handle missing Canvas configuration', async () => {
      delete process.env.CANVAS_API_URL
      delete process.env.CANVAS_API_TOKEN

      mockedAxios.create.mockClear()
      const connector = new LMSConnector()

      const result = await connector.getCanvasCourses('student-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Canvas API not configured')
    })

    it('should handle missing Blackboard configuration', async () => {
      delete process.env.BLACKBOARD_API_URL
      delete process.env.BLACKBOARD_API_TOKEN

      mockedAxios.create.mockClear()
      const connector = new LMSConnector()

      const result = await connector.getBlackboardCourses('student-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Blackboard API not configured')
    })
  })
})
