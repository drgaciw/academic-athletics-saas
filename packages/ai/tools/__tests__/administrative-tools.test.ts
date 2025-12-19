import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scheduleEvent } from '../administrative-tools'

// Mock fetch globally
const globalFetch = vi.fn()
global.fetch = globalFetch

describe('scheduleEvent', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.INTEGRATION_SERVICE_URL = 'http://localhost:3006'
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete process.env.INTEGRATION_SERVICE_URL
  })

  it('should return mock data when no tokens are present in context', async () => {
    const params = {
      title: 'Test Event',
      startTime: '2024-11-15T10:00:00Z',
      endTime: '2024-11-15T10:30:00Z',
      attendees: ['test@example.com'],
      location: 'Room 101',
      description: 'Test Description',
    }

    const context = {
      userId: 'user-123',
      userRoles: ['student'],
      agentState: {} as any,
      metadata: {},
    }

    const result = await scheduleEvent.execute(params, context)

    expect(result).toHaveProperty('eventId')
    expect(result.title).toBe(params.title)
    expect(result).toHaveProperty('calendarLink')
    // Should NOT call fetch
    expect(globalFetch).not.toHaveBeenCalled()
  })

  it('should call integration service when googleAccessToken is present', async () => {
    const params = {
      title: 'Test Event',
      startTime: '2024-11-15T10:00:00Z',
      endTime: '2024-11-15T10:30:00Z',
      attendees: ['test@example.com'],
      location: 'Room 101',
      description: 'Test Description',
    }

    const context = {
      userId: 'user-123',
      userRoles: ['student'],
      agentState: {} as any,
      metadata: {
        googleAccessToken: 'fake-token',
      },
    }

    // Mock successful fetch response
    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        eventId: 'google-event-id',
        provider: 'google',
      }),
    })

    const result = await scheduleEvent.execute(params, context)

    expect(globalFetch).toHaveBeenCalledTimes(1)
    const [url, options] = globalFetch.mock.calls[0]
    expect(url).toBe('http://localhost:3006/api/integration/calendar/sync')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body).toMatchObject({
      provider: 'google',
      googleAccessToken: 'fake-token',
      event: {
        title: params.title,
        startTime: params.startTime,
        endTime: params.endTime,
        location: params.location,
        description: params.description,
        attendees: params.attendees,
      },
    })

    expect(result).toHaveProperty('eventId', 'google-event-id')
    expect(result.title).toBe(params.title)
  })

  it('should call integration service when outlookAccessToken is present', async () => {
    const params = {
      title: 'Test Event',
      startTime: '2024-11-15T10:00:00Z',
      endTime: '2024-11-15T10:30:00Z',
    }

    const context = {
      userId: 'user-123',
      userRoles: ['student'],
      agentState: {} as any,
      metadata: {
        outlookAccessToken: 'fake-token',
      },
    }

    // Mock successful fetch response
    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        eventId: 'outlook-event-id',
        provider: 'outlook',
      }),
    })

    await scheduleEvent.execute(params, context)

    expect(globalFetch).toHaveBeenCalledTimes(1)
    const body = JSON.parse(globalFetch.mock.calls[0][1].body)
    expect(body.provider).toBe('outlook')
    expect(body.outlookAccessToken).toBe('fake-token')
  })
})
