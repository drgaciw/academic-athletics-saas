import { z } from 'zod'

// Validation Schemas

// Tutoring
export const bookTutoringSchema = z.object({
  studentId: z.string(),
  tutorId: z.string(),
  subject: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
})

export const tutoringAvailabilitySchema = z.object({
  tutorId: z.string().optional(),
  subject: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

// Study Hall
export const studyHallCheckInSchema = z.object({
  studentId: z.string(),
  location: z.string().min(1),
})

export const studyHallCheckOutSchema = z.object({
  studentId: z.string(),
  attendanceId: z.string(),
})

// Workshop
export const workshopRegistrationSchema = z.object({
  studentId: z.string(),
  workshopId: z.string(),
})

// Mentoring
export const scheduleMentoringSessionSchema = z.object({
  mentorId: z.string(),
  menteeId: z.string(),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(240), // 15 minutes to 4 hours
  topic: z.string().optional(),
  notes: z.string().optional(),
})

// Response Types
export interface TutoringSession {
  id: string
  studentId: string
  tutorId: string
  subject: string
  startTime: Date
  endTime: Date
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface TutorAvailability {
  tutorId: string
  tutorName: string
  subject: string
  availableSlots: TimeSlot[]
  totalSessions: number
  averageRating?: number
}

export interface TimeSlot {
  startTime: Date
  endTime: Date
  isAvailable: boolean
}

export interface StudyHallAttendance {
  id: string
  studentId: string
  location: string
  checkInTime: Date
  checkOutTime?: Date
  duration?: number // in minutes
  wasCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface StudyHallStats {
  studentId: string
  totalHours: number
  requiredHours: number
  completionPercentage: number
  sessionsCount: number
  averageSessionDuration: number
  recentSessions: StudyHallAttendance[]
}

export interface Workshop {
  id: string
  title: string
  description: string
  category: string
  scheduledAt: Date
  duration: number // in minutes
  location: string
  capacity: number
  registered: number
  available: number
  instructor: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkshopRegistration {
  id: string
  studentId: string
  workshopId: string
  status: 'REGISTERED' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW'
  registeredAt: Date
  updatedAt: Date
  workshop?: Workshop
}

export interface MentorMatch {
  id: string
  mentorId: string
  menteeId: string
  matchedAt: Date
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  compatibilityScore: number
  commonInterests: string[]
  mentorInfo: {
    id: string
    name: string
    sport: string
    year: string
    major: string
  }
  menteeInfo: {
    id: string
    name: string
    sport: string
    year: string
    major: string
  }
}

export interface MentoringSession {
  id: string
  mentorId: string
  menteeId: string
  scheduledAt: Date
  duration: number // in minutes
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  topic?: string
  notes?: string
  feedback?: string
  createdAt: Date
  updatedAt: Date
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
}

// Type inference from schemas
export type BookTutoringInput = z.infer<typeof bookTutoringSchema>
export type TutoringAvailabilityInput = z.infer<typeof tutoringAvailabilitySchema>
export type StudyHallCheckInInput = z.infer<typeof studyHallCheckInSchema>
export type StudyHallCheckOutInput = z.infer<typeof studyHallCheckOutSchema>
export type WorkshopRegistrationInput = z.infer<typeof workshopRegistrationSchema>
export type ScheduleMentoringSessionInput = z.infer<typeof scheduleMentoringSessionSchema>

// Service interfaces
export interface ITutoringService {
  bookSession(data: BookTutoringInput): Promise<TutoringSession>
  getTutorAvailability(params: TutoringAvailabilityInput): Promise<TutorAvailability[]>
  cancelSession(sessionId: string, studentId: string): Promise<TutoringSession>
  getStudentSessions(studentId: string): Promise<TutoringSession[]>
}

export interface IStudyHallService {
  checkIn(data: StudyHallCheckInInput): Promise<StudyHallAttendance>
  checkOut(attendanceId: string, studentId: string): Promise<StudyHallAttendance>
  getAttendanceRecords(studentId: string, limit?: number): Promise<StudyHallAttendance[]>
  getStudentStats(studentId: string): Promise<StudyHallStats>
}

export interface IWorkshopService {
  registerForWorkshop(data: WorkshopRegistrationInput): Promise<WorkshopRegistration>
  cancelRegistration(registrationId: string, studentId: string): Promise<WorkshopRegistration>
  getAvailableWorkshops(): Promise<Workshop[]>
  getStudentRegistrations(studentId: string): Promise<WorkshopRegistration[]>
}

export interface IMentoringService {
  getMentorMatches(studentId: string): Promise<MentorMatch[]>
  scheduleSession(data: ScheduleMentoringSessionInput): Promise<MentoringSession>
  cancelSession(sessionId: string, userId: string): Promise<MentoringSession>
  getSessions(userId: string): Promise<MentoringSession[]>
}

export interface IAvailabilityEngine {
  findOptimalTimes(
    tutorId: string,
    studentId: string,
    duration: number,
    preferredDays?: string[]
  ): Promise<TimeSlot[]>
  checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean>
}
