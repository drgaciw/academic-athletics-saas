import { z } from 'zod';
import { BaseRunner } from './base-runner';
import { RiskPredictionInput, RiskPredictionOutput } from '../types';

/**
 * RiskPredictionRunner - Evaluates academic risk prediction accuracy
 *
 * Tests the AI system's ability to:
 * - Accurately predict academic risk levels
 * - Identify key risk factors
 * - Provide actionable recommendations
 * - Quantify factor impact on overall risk
 */
export class RiskPredictionRunner extends BaseRunner<
  RiskPredictionInput,
  RiskPredictionOutput
> {
  protected preparePrompt(input: RiskPredictionInput): string {
    return `You are an academic intervention specialist analyzing student-athlete risk factors. Assess the likelihood of academic difficulty.

Student ID: ${input.studentId}

Academic Metrics:
- GPA: ${input.academicMetrics.gpa}
- Credit Hours Completed: ${input.academicMetrics.creditHours}
- Attendance Rate: ${input.academicMetrics.attendanceRate * 100}%

Athletic Metrics:
- Performance Score: ${input.athleticMetrics.performanceScore}
- Injury History (incidents): ${input.athleticMetrics.injuryHistory}
- Travel Hours per Week: ${input.athleticMetrics.travelHours}

Support Metrics:
- Tutoring Hours per Week: ${input.supportMetrics.tutoringHours}
- Advising Meetings per Month: ${input.supportMetrics.advisingMeetings}

Analyze these metrics and provide:
1. An overall risk score (0-100, where 100 is highest risk)
2. A risk level classification (low/medium/high)
3. Key factors contributing to the risk score
4. Specific recommendations to mitigate identified risks

Consider both positive factors (high GPA, strong support) and negative factors (low attendance, high travel).`;
  }

  protected getOutputSchema(): z.ZodSchema<RiskPredictionOutput> {
    return z.object({
      riskScore: z
        .number()
        .min(0)
        .max(100)
        .describe('Overall risk score from 0-100'),
      riskLevel: z
        .enum(['low', 'medium', 'high'])
        .describe('Risk level classification'),
      factors: z
        .array(
          z.object({
            factor: z.string().describe('Name of the risk factor'),
            impact: z
              .number()
              .describe('Impact magnitude (can be positive or negative)'),
            direction: z
              .enum(['positive', 'negative'])
              .describe('Whether this factor increases or decreases risk'),
          })
        )
        .describe('Key factors contributing to the risk assessment'),
      recommendations: z
        .array(z.string())
        .describe('Specific actions to reduce academic risk'),
    });
  }

  protected parseOutput(output: string): RiskPredictionOutput {
    throw new Error('parseOutput should not be called when using structured output');
  }
}
