import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
  provider: 'google' | 'outlook';
}

/**
 * Calendar Service for Google Calendar and Outlook integration
 */
export class CalendarService {
  private googleAuth: any;
  private outlookClient: Client | null = null;

  constructor() {
    // Initialize Google Calendar OAuth2
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.googleAuth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
      );
    }
  }

  /**
   * Create Google Calendar event
   */
  async createGoogleEvent(
    accessToken: string,
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<CalendarSyncResult> {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Calendar not configured');
      }

      this.googleAuth.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.title,
          description: event.description,
          location: event.location,
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: 'America/New_York',
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: 'America/New_York',
          },
          attendees: event.attendees?.map(email => ({ email })),
          reminders: event.reminders || {
            useDefault: true,
          },
        },
      });

      return {
        success: true,
        eventId: response.data.id,
        provider: 'google',
      };
    } catch (error) {
      console.error('Google Calendar error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Google Calendar event',
        provider: 'google',
      };
    }
  }

  /**
   * Update Google Calendar event
   */
  async updateGoogleEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = 'primary'
  ): Promise<CalendarSyncResult> {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Calendar not configured');
      }

      this.googleAuth.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      const updateData: any = {};
      if (event.title) updateData.summary = event.title;
      if (event.description) updateData.description = event.description;
      if (event.location) updateData.location = event.location;
      if (event.startTime) {
        updateData.start = {
          dateTime: event.startTime.toISOString(),
          timeZone: 'America/New_York',
        };
      }
      if (event.endTime) {
        updateData.end = {
          dateTime: event.endTime.toISOString(),
          timeZone: 'America/New_York',
        };
      }
      if (event.attendees) {
        updateData.attendees = event.attendees.map(email => ({ email }));
      }

      const response = await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: updateData,
      });

      return {
        success: true,
        eventId: response.data.id,
        provider: 'google',
      };
    } catch (error) {
      console.error('Google Calendar update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update Google Calendar event',
        provider: 'google',
      };
    }
  }

  /**
   * Delete Google Calendar event
   */
  async deleteGoogleEvent(
    accessToken: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<CalendarSyncResult> {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Calendar not configured');
      }

      this.googleAuth.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      await calendar.events.delete({
        calendarId,
        eventId,
      });

      return {
        success: true,
        eventId,
        provider: 'google',
      };
    } catch (error) {
      console.error('Google Calendar delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete Google Calendar event',
        provider: 'google',
      };
    }
  }

  /**
   * Create Outlook Calendar event
   */
  async createOutlookEvent(
    accessToken: string,
    event: CalendarEvent
  ): Promise<CalendarSyncResult> {
    try {
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      const outlookEvent = {
        subject: event.title,
        body: {
          contentType: 'HTML',
          content: event.description || '',
        },
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'Eastern Standard Time',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'Eastern Standard Time',
        },
        location: {
          displayName: event.location || '',
        },
        attendees: event.attendees?.map(email => ({
          emailAddress: { address: email },
          type: 'required',
        })),
      };

      const response = await client.api('/me/events').post(outlookEvent);

      return {
        success: true,
        eventId: response.id,
        provider: 'outlook',
      };
    } catch (error) {
      console.error('Outlook Calendar error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Outlook Calendar event',
        provider: 'outlook',
      };
    }
  }

  /**
   * Update Outlook Calendar event
   */
  async updateOutlookEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarSyncResult> {
    try {
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      const updateData: any = {};
      if (event.title) updateData.subject = event.title;
      if (event.description) {
        updateData.body = {
          contentType: 'HTML',
          content: event.description,
        };
      }
      if (event.location) {
        updateData.location = { displayName: event.location };
      }
      if (event.startTime) {
        updateData.start = {
          dateTime: event.startTime.toISOString(),
          timeZone: 'Eastern Standard Time',
        };
      }
      if (event.endTime) {
        updateData.end = {
          dateTime: event.endTime.toISOString(),
          timeZone: 'Eastern Standard Time',
        };
      }
      if (event.attendees) {
        updateData.attendees = event.attendees.map(email => ({
          emailAddress: { address: email },
          type: 'required',
        }));
      }

      const response = await client.api(`/me/events/${eventId}`).patch(updateData);

      return {
        success: true,
        eventId: response.id,
        provider: 'outlook',
      };
    } catch (error) {
      console.error('Outlook Calendar update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update Outlook Calendar event',
        provider: 'outlook',
      };
    }
  }

  /**
   * Delete Outlook Calendar event
   */
  async deleteOutlookEvent(
    accessToken: string,
    eventId: string
  ): Promise<CalendarSyncResult> {
    try {
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      await client.api(`/me/events/${eventId}`).delete();

      return {
        success: true,
        eventId,
        provider: 'outlook',
      };
    } catch (error) {
      console.error('Outlook Calendar delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete Outlook Calendar event',
        provider: 'outlook',
      };
    }
  }

  /**
   * Sync event to both calendars
   */
  async syncToBothCalendars(
    googleToken: string | null,
    outlookToken: string | null,
    event: CalendarEvent
  ): Promise<{ google?: CalendarSyncResult; outlook?: CalendarSyncResult }> {
    const results: any = {};

    if (googleToken) {
      results.google = await this.createGoogleEvent(googleToken, event);
    }

    if (outlookToken) {
      results.outlook = await this.createOutlookEvent(outlookToken, event);
    }

    return results;
  }
}

export const calendarService = new CalendarService();
