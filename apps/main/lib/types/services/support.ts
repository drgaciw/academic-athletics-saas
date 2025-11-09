/**
 * Support Service Types
 */

export interface TutoringSession {
  id: string;
  studentId: string;
  tutorId: string;
  courseId: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  location?: string;
  notes?: string;
}

export interface BookTutoringRequest {
  studentId: string;
  courseId: string;
  tutorId?: string;
  preferredDate: string;
  preferredTime: string;
  duration: number;
  notes?: string;
}

export interface TutorAvailability {
  tutorId: string;
  tutorName: string;
  subjects: string[];
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface StudyHallCheckIn {
  id: string;
  studentId: string;
  checkInTime: string;
  checkOutTime?: string;
  location: string;
  duration?: number;
  verified: boolean;
}

export interface CheckInRequest {
  studentId: string;
  location: string;
}

export interface AttendanceRecord {
  studentId: string;
  totalHours: number;
  requiredHours: number;
  percentComplete: number;
  sessions: StudyHallCheckIn[];
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  category: 'LIFE_SKILLS' | 'ACADEMIC' | 'CAREER' | 'WELLNESS';
  facilitator: string;
  scheduledAt: string;
  duration: number;
  location: string;
  capacity: number;
  enrolled: number;
  status: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';
}

export interface WorkshopRegistration {
  id: string;
  studentId: string;
  workshopId: string;
  registeredAt: string;
  attended: boolean;
  feedback?: string;
}

export interface RegisterWorkshopRequest {
  studentId: string;
  workshopId: string;
}

export interface MentorMatch {
  id: string;
  menteeId: string;
  mentorId: string;
  matchedAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  meetingFrequency?: string;
  lastMeeting?: string;
  nextMeeting?: string;
}

export interface MentoringSession {
  id: string;
  matchId: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  topics?: string[];
  notes?: string;
  mentorFeedback?: string;
  menteeFeedback?: string;
}

export interface ScheduleMentoringRequest {
  matchId: string;
  scheduledAt: string;
  duration: number;
  topics?: string[];
}
