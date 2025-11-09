import { z } from 'zod';
import { BaseRunner } from './base-runner';
import { ComplianceInput, ComplianceOutput } from '../types';

/**
 * ComplianceRunner - Evaluates NCAA eligibility checking
 *
 * Tests the AI system's ability to:
 * - Correctly assess NCAA Division I eligibility
 * - Identify compliance issues
 * - Provide actionable recommendations
 */
export class ComplianceRunner extends BaseRunner<ComplianceInput, ComplianceOutput> {
  protected preparePrompt(input: ComplianceInput): string {
    return `You are an NCAA Division I compliance expert. Analyze the following student-athlete data and determine their eligibility status.

Student Information:
- Student ID: ${input.studentId}
- GPA: ${input.gpa}
- Credit Hours Completed: ${input.creditHours}
- Progress Toward Degree: ${input.progressTowardDegree * 100}%
- Semester: ${input.semester}
${input.additionalContext ? `\nAdditional Context:\n${JSON.stringify(input.additionalContext, null, 2)}` : ''}

NCAA Division I Requirements:
- Continuing Eligibility GPA: Minimum 1.8 (year 1), 1.9 (year 2), 2.0 (year 3+)
- Credit Hours: 24 semester hours between academic years, 18 earned in previous year
- Progress Toward Degree: 40% after year 2, 60% after year 3, 80% after year 4

Provide a structured assessment including:
1. Overall eligibility status (eligible/ineligible)
2. Specific issues found (if any)
3. Recommendations for maintaining or regaining eligibility

Be precise and reference specific NCAA rules when applicable.`;
  }

  protected getOutputSchema(): z.ZodSchema<ComplianceOutput> {
    return z.object({
      eligible: z.boolean().describe('Whether the student-athlete is eligible'),
      issues: z.array(z.string()).describe('List of compliance issues found'),
      recommendations: z
        .array(z.string())
        .describe('Actionable recommendations for eligibility'),
      details: z
        .record(z.any())
        .optional()
        .describe('Additional details about the assessment'),
    });
  }

  protected parseOutput(output: string): ComplianceOutput {
    // This method won't be called since we're using structured output
    throw new Error('parseOutput should not be called when using structured output');
  }
}
