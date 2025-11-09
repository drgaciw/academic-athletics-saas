import { z } from 'zod';
import { BaseRunner } from './base-runner';
import { AdvisingInput, AdvisingOutput, CourseRecommendation } from '../types';

/**
 * AdvisingRunner - Evaluates course recommendation quality
 *
 * Tests the AI system's ability to:
 * - Recommend appropriate courses based on major requirements
 * - Detect and avoid scheduling conflicts
 * - Consider athletic schedule constraints
 * - Provide clear reasoning for recommendations
 */
export class AdvisingRunner extends BaseRunner<AdvisingInput, AdvisingOutput> {
  protected preparePrompt(input: AdvisingInput): string {
    const athleticScheduleText = input.athleticSchedule
      ? `\nAthletic Schedule:
- Practices: ${input.athleticSchedule.practices.join(', ')}
- Games: ${input.athleticSchedule.games.join(', ')}`
      : '';

    return `You are an academic advisor for student-athletes. Recommend courses for the upcoming semester.

Student Information:
- Student ID: ${input.studentId}
- Major: ${input.major}
- Completed Courses: ${input.completedCourses.join(', ')}
- Semester: ${input.semester}${athleticScheduleText}

Your task:
1. Recommend 4-6 courses that fit the student's major requirements
2. Check each course for prerequisites (based on completed courses)
3. Identify any scheduling conflicts with athletic commitments
4. Prioritize courses by importance (required vs. elective)
5. Flag any potential issues or concerns

Provide clear reasoning for each recommendation.`;
  }

  protected getOutputSchema(): z.ZodSchema<AdvisingOutput> {
    const courseRecommendationSchema = z.object({
      courseId: z.string().describe('The course identifier'),
      reason: z.string().describe('Explanation for why this course is recommended'),
      conflicts: z.array(z.string()).describe('Any scheduling or prerequisite conflicts'),
      priority: z
        .number()
        .optional()
        .describe('Priority level (1=highest, higher numbers=lower priority)'),
    });

    return z.object({
      recommendations: z
        .array(courseRecommendationSchema)
        .describe('List of recommended courses'),
      warnings: z.array(z.string()).describe('Important warnings or considerations'),
    });
  }

  protected parseOutput(output: string): AdvisingOutput {
    throw new Error('parseOutput should not be called when using structured output');
  }
}
