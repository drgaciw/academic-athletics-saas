/**
 * Monitoring Service Types
 */

export interface PerformanceMetrics {
  studentId: string;
  termGpa: number;
  cumulativeGpa: number;
  creditHours: number;
  attendanceRate: number;
  assignmentCompletionRate: number;
  lastUpdated: string;
}

export interface ProgressReportRequest {
  studentId: string;
  courseId: string;
  reportedBy: string;
  currentGrade: string;
  attendance: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  participation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  concerns?: string;
  recommendations?: string;
}

export interface ProgressReportResponse {
  id: string;
  createdAt: string;
  alertsGenerated: Alert[];
}

export interface Alert {
  id: string;
  studentId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details: Record<string, any>;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

export enum AlertType {
  GRADE_DROP = 'GRADE_DROP',
  ATTENDANCE = 'ATTENDANCE',
  ELIGIBILITY_RISK = 'ELIGIBILITY_RISK',
  GPA_THRESHOLD = 'GPA_THRESHOLD',
  CREDIT_HOURS = 'CREDIT_HOURS',
  MISSING_ASSIGNMENT = 'MISSING_ASSIGNMENT',
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface InterventionPlan {
  id: string;
  studentId: string;
  createdBy: string;
  type: 'ACADEMIC' | 'ATTENDANCE' | 'BEHAVIORAL';
  goals: string[];
  actions: InterventionAction[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface InterventionAction {
  description: string;
  assignedTo?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface CreateInterventionRequest {
  studentId: string;
  type: 'ACADEMIC' | 'ATTENDANCE' | 'BEHAVIORAL';
  goals: string[];
  actions: Omit<InterventionAction, 'completed' | 'completedAt'>[];
  notes?: string;
}

export interface TeamAnalytics {
  teamId: string;
  sport: string;
  totalStudents: number;
  averageGpa: number;
  eligibilityRate: number;
  alertCounts: Record<AlertSeverity, number>;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  trends: {
    metric: string;
    direction: 'UP' | 'DOWN' | 'STABLE';
    change: number;
  }[];
}

export interface RiskAssessmentRequest {
  studentId: string;
  includeAiPrediction?: boolean;
}

export interface RiskAssessmentResponse {
  studentId: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  factors: RiskFactor[];
  recommendations: string[];
  predictedOutcome?: string;
  confidence?: number;
}

export interface RiskFactor {
  factor: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  value: any;
  threshold?: any;
}
