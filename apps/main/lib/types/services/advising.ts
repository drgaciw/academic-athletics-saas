/**
 * Advising Service Types
 */

export interface ScheduleRequest {
  studentId: string;
  termId: string;
  preferredCourses?: string[];
  constraints?: ScheduleConstraints;
}

export interface ScheduleConstraints {
  maxCredits?: number;
  minCredits?: number;
  preferredTimes?: string[];
  avoidTimes?: string[];
  athleticSchedule?: AthleticCommitment[];
}

export interface AthleticCommitment {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: 'PRACTICE' | 'GAME' | 'TRAINING' | 'TRAVEL';
}

export interface ScheduleResponse {
  schedule: CourseSchedule[];
  conflicts: ScheduleConflict[];
  warnings: string[];
  totalCredits: number;
}

export interface CourseSchedule {
  courseId: string;
  courseName: string;
  courseCode: string;
  credits: number;
  instructor: string;
  meetingTimes: MeetingTime[];
}

export interface MeetingTime {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
}

export interface ScheduleConflict {
  type: 'TIME_CONFLICT' | 'ATHLETIC_CONFLICT' | 'PREREQUISITE' | 'CAPACITY';
  severity: 'BLOCKING' | 'WARNING';
  message: string;
  courses?: string[];
}

export interface RecommendationRequest {
  studentId: string;
  termId: string;
  major?: string;
  useAI?: boolean;
}

export interface RecommendationResponse {
  recommendations: CourseRecommendation[];
  reasoning: string[];
}

export interface CourseRecommendation {
  courseId: string;
  courseName: string;
  courseCode: string;
  credits: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  fulfills?: string[];
}

export interface DegreeProgress {
  studentId: string;
  major: string;
  totalCreditsRequired: number;
  creditsCompleted: number;
  percentComplete: number;
  requirements: RequirementProgress[];
  projectedGraduation?: string;
}

export interface RequirementProgress {
  category: string;
  required: number;
  completed: number;
  inProgress: number;
  remaining: number;
  courses: string[];
}

export interface ValidateScheduleRequest {
  studentId: string;
  courses: string[];
  termId: string;
}
