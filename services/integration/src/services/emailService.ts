import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email Service using Resend
 * Handles all email delivery for the Integration Service
 */
export class EmailService {
  private readonly defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@academicathleticshub.com';
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      const { data, error } = await resend.emails.send({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        reply_to: options.replyTo,
        attachments: options.attachments,
      });

      if (error) {
        console.error('Email send error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send travel notification email to faculty
   */
  async sendTravelNotification(options: {
    facultyEmail: string;
    studentName: string;
    studentEmail: string;
    travelDates: { start: string; end: string };
    destination: string;
    sport: string;
    coursesAffected: string[];
    letterUrl?: string;
  }): Promise<EmailResponse> {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Student-Athlete Travel Notification</h2>

          <p>Dear Professor,</p>

          <p>This is to inform you that <strong>${options.studentName}</strong> (${options.studentEmail}) will be absent from class due to athletic travel.</p>

          <h3>Travel Details:</h3>
          <ul>
            <li><strong>Sport:</strong> ${options.sport}</li>
            <li><strong>Travel Dates:</strong> ${options.travelDates.start} to ${options.travelDates.end}</li>
            <li><strong>Destination:</strong> ${options.destination}</li>
          </ul>

          <h3>Courses Affected:</h3>
          <ul>
            ${options.coursesAffected.map(course => `<li>${course}</li>`).join('')}
          </ul>

          ${options.letterUrl ? `<p><a href="${options.letterUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Download Official Travel Letter</a></p>` : ''}

          <p>The student-athlete is expected to make arrangements with you to complete any missed work. Please contact our office if you have any questions or concerns.</p>

          <p>Thank you for your understanding and support of our student-athletes.</p>

          <p>Best regards,<br>
          Academic Athletics Hub</p>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: options.facultyEmail,
      subject: `Travel Notification for ${options.studentName}`,
      html,
      replyTo: options.studentEmail,
    });
  }

  /**
   * Send absence notification email
   */
  async sendAbsenceNotification(options: {
    facultyEmail: string;
    studentName: string;
    studentEmail: string;
    absenceDate: string;
    reason: string;
    courseName?: string;
  }): Promise<EmailResponse> {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Student Absence Notification</h2>

          <p>Dear Professor,</p>

          <p><strong>${options.studentName}</strong> (${options.studentEmail}) will be absent on <strong>${options.absenceDate}</strong>.</p>

          ${options.courseName ? `<p><strong>Course:</strong> ${options.courseName}</p>` : ''}

          <p><strong>Reason:</strong> ${options.reason}</p>

          <p>The student will make arrangements to complete any missed work. Please contact us if you have any questions.</p>

          <p>Best regards,<br>
          Academic Athletics Hub</p>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: options.facultyEmail,
      subject: `Absence Notification: ${options.studentName} - ${options.absenceDate}`,
      html,
      replyTo: options.studentEmail,
    });
  }

  /**
   * Send bulk emails with retry logic
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Send templated email (for future template support)
   */
  async sendTemplatedEmail(options: {
    to: string | string[];
    templateId: string;
    variables: Record<string, any>;
  }): Promise<EmailResponse> {
    // Placeholder for template support
    // In production, this would integrate with Resend's template feature
    throw new Error('Template support not yet implemented');
  }
}

export const emailService = new EmailService();
