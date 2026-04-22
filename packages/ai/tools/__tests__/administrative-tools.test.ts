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
    delete process.env.ALLOW_MOCK_CALENDAR_FALLBACK
    delete process.env.NODE_ENV
  })

  it('should fail when no tokens are present in context', async () => {
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

    await expect(scheduleEvent.execute(params, context)).rejects.toThrow(
      'Calendar scheduling requires a Google or Outlook access token in the tool context metadata.'
    )

    expect(globalFetch).not.toHaveBeenCalled()
  })

  it('should return mock data only when non-production fallback is explicitly enabled', async () => {
    process.env.NODE_ENV = 'development'
    process.env.ALLOW_MOCK_CALENDAR_FALLBACK = 'true'

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
    expect(result.warning).toContain('mock event')
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

import { Resend } from 'resend';

// Mock Resend BEFORE importing the tool
const mockSend = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      // console.log('Resend constructor called');
      return {
        emails: {
          send: mockSend
        }
      };
    })
  };
});

// Import the tool AFTER mocking
import { sendEmail } from '../administrative-tools';

describe('sendEmail Tool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // No need to grab instance from mock.instances, we used a closure variable mockSend
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use mock behavior when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;

    const params = {
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: 'Test Body'
    };

    const result = await sendEmail.execute(params, { userRoles: ['write:email'] });

    expect(result.status).toBe('sent');
    expect(result.note).toContain('RESEND_API_KEY missing');
  });

  it('should call resend.emails.send when RESEND_API_KEY is present', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';

    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

    const params = {
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: 'Test Body'
    };

    const result = await sendEmail.execute(params, { userRoles: ['write:email'] });

    expect(result.status).toBe('sent');
    expect(result.messageId).toBe('msg-123');
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: params.to,
      subject: params.subject,
      html: params.body
    }));
  });

  it('should throw error if resend fails', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';

    mockSend.mockResolvedValue({ data: null, error: { message: 'Failed to send' } });

    const params = {
      to: ['test@example.com'],
      subject: 'Test Subject',
      body: 'Test Body'
    };

    await expect(sendEmail.execute(params, { userRoles: ['write:email'] }))
      .rejects.toThrow('Email send failed: Failed to send');
  });
});
