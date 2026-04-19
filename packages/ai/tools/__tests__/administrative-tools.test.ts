
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
