import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGenerateTravelLetter,
  mockGetProfile,
  mockGetAcademicRecords,
} = vi.hoisted(() => ({
  mockGenerateTravelLetter: vi.fn(),
  mockGetProfile: vi.fn(),
  mockGetAcademicRecords: vi.fn(),
}))

vi.mock('../lib/service-client', () => ({
  integrationService: {
    generateTravelLetter: mockGenerateTravelLetter,
  },
  userService: {
    getProfile: mockGetProfile,
  },
  monitoringService: {
    getAcademicRecords: mockGetAcademicRecords,
  },
}))

import { generateTravelLetter } from './administrative-tools'

describe('generateTravelLetter', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('sends the integration service the expected payload shape', async () => {
    mockGetProfile.mockResolvedValue({
      firstName: 'Jordan',
      lastName: 'Lee',
      studentProfile: {
        sport: 'Basketball',
      },
    })
    mockGetAcademicRecords.mockResolvedValue([
      {
        code: 'BUS101',
        title: 'Business Basics',
        instructor: 'Prof. Smith',
        meetingTimes: 'MWF 09:00-09:50',
      },
      {
        code: 'MATH201',
        title: 'Statistics',
        instructor: 'Dr. Chen',
      },
    ])
    mockGenerateTravelLetter.mockResolvedValue({
      success: true,
      url: 'https://example.com/travel-letter.pdf',
      message: 'Travel letter generated successfully',
    })

    const params = {
      studentId: 'S12345',
      travelDates: {
        departureDate: '2026-04-20',
        returnDate: '2026-04-22',
      },
      destination: 'State University',
      reason: 'Away game',
      courses: ['BUS101'],
    }
    const context = {
      userId: 'advisor-7',
      userRoles: ['advisor'],
      agentState: {} as any,
      metadata: {},
    }

    const result = await generateTravelLetter.execute(params, context)

    expect(mockGetProfile).toHaveBeenCalledWith('S12345', context)
    expect(mockGetAcademicRecords).toHaveBeenCalledWith(
      'S12345',
      { includeInProgress: true },
      context
    )
    expect(mockGenerateTravelLetter).toHaveBeenCalledWith(
      {
        studentName: 'Jordan Lee',
        studentId: 'S12345',
        sport: 'Basketball',
        travelDates: {
          start: '2026-04-20',
          end: '2026-04-22',
        },
        destination: 'State University',
        event: 'Away game',
        courses: [
          {
            code: 'BUS101',
            name: 'Business Basics',
            instructor: 'Prof. Smith',
            meetingTimes: 'MWF 09:00-09:50',
          },
        ],
        generatedBy: 'advisor-7',
      },
      context
    )
    expect(result.pdfUrl).toBe('https://example.com/travel-letter.pdf')
  })
})
