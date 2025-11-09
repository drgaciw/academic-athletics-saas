/**
 * Integration Service Types
 */

export interface TravelLetterRequest {
  studentId: string;
  travelDates: {
    departureDate: string;
    returnDate: string;
  };
  destination: string;
  courses: string[];
  reason?: string;
}

export interface TravelLetterResponse {
  id: string;
  documentUrl: string;
  generatedAt: string;
  expiresAt?: string;
}

export interface AbsenceNotification {
  studentId: string;
  facultyId: string;
  courseId: string;
  absenceDates: string[];
  reason: string;
  expectedReturn: string;
}

export interface EmailRequest {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailResponse {
  id: string;
  status: 'SENT' | 'QUEUED' | 'FAILED';
  sentAt?: string;
  error?: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  reminders?: number[];
}

export interface CalendarSyncRequest {
  userId: string;
  provider: 'GOOGLE' | 'OUTLOOK';
  events: CalendarEvent[];
}

export interface LMSSyncRequest {
  provider: 'CANVAS' | 'BLACKBOARD' | 'MOODLE';
  studentId: string;
  courses?: string[];
}

export interface LMSData {
  courses: LMSCourse[];
  assignments: LMSAssignment[];
  grades: LMSGrade[];
  syncedAt: string;
}

export interface LMSCourse {
  externalId: string;
  name: string;
  code: string;
  instructorName?: string;
  enrollmentStatus: string;
}

export interface LMSAssignment {
  externalId: string;
  courseId: string;
  name: string;
  dueDate?: string;
  pointsPossible?: number;
  submitted: boolean;
  grade?: number;
}

export interface LMSGrade {
  courseId: string;
  currentGrade?: string;
  currentScore?: number;
  finalGrade?: string;
  finalScore?: number;
}

export interface SISImportRequest {
  studentId?: string;
  importType: 'ENROLLMENT' | 'TRANSCRIPT' | 'SCHEDULE';
  termId?: string;
}

export interface TranscriptRequest {
  studentId: string;
  format: 'PDF' | 'JSON';
  official?: boolean;
}

export interface TranscriptResponse {
  studentId: string;
  documentUrl?: string;
  data?: TranscriptData;
  generatedAt: string;
}

export interface TranscriptData {
  studentInfo: {
    name: string;
    studentId: string;
    email: string;
  };
  terms: TermTranscript[];
  summary: {
    cumulativeGpa: number;
    totalCredits: number;
    degreeAwarded?: string;
  };
}

export interface TermTranscript {
  termId: string;
  termName: string;
  courses: CourseGrade[];
  termGpa: number;
  creditsAttempted: number;
  creditsEarned: number;
}

export interface CourseGrade {
  courseCode: string;
  courseName: string;
  credits: number;
  grade: string;
  gradePoints: number;
}
