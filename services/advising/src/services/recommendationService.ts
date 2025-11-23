// ============================================================================
// RECOMMENDATION SERVICE
// ============================================================================

import type {
  RecommendationRequest,
  RecommendationResponse,
  CourseRecommendation,
  CourseSectionInfo,
  CourseInfo,
  AthleticSchedule,
  AlternativePath,
  DegreeProgressResponse,
} from "../types";
import { DegreeAuditService } from "./degreeAudit";
import { ConflictDetectorService } from "./conflictDetector";
import { sectionToTimeSlots, hasTimeSlotOverlap } from "../utils/timeUtils";

/**
 * Recommendation Service
 * Provides intelligent course recommendations with AI integration
 */
export class RecommendationService {
  private degreeAuditService: DegreeAuditService;
  private conflictDetector: ConflictDetectorService;
  private aiServiceUrl: string;

  constructor(
    aiServiceUrl: string = process.env.AI_SERVICE_URL ||
      "http://localhost:3007",
  ) {
    this.degreeAuditService = new DegreeAuditService();
    this.conflictDetector = new ConflictDetectorService();
    this.aiServiceUrl = aiServiceUrl;
  }

  /**
   * Get course recommendations for a student
   */
  async getRecommendations(
    request: RecommendationRequest,
    availableCourses: CourseInfo[],
    availableSections: CourseSectionInfo[],
    currentSchedule: CourseSectionInfo[],
    athleticSchedule?: AthleticSchedule,
    degreeProgram?: string,
  ): Promise<RecommendationResponse> {
    // Get degree requirements progress
    const degreeProgress = await this.degreeAuditService.getDegreeProgress({
      studentId: request.studentId,
      degreeProgram,
    });

    // Get AI-powered recommendations
    const aiRecommendations = await this.getAIRecommendations(
      request,
      degreeProgress,
      availableCourses,
    );

    // Build course recommendations with schedule compatibility
    const recommendations = await this.buildCourseRecommendations(
      aiRecommendations,
      availableCourses,
      availableSections,
      currentSchedule,
      athleticSchedule,
    );

    // Generate alternative paths
    const alternativePaths = this.generateAlternativePaths(
      recommendations,
      degreeProgress,
    );

    // Generate warnings
    const warnings = this.generateRecommendationWarnings(
      recommendations,
      currentSchedule,
      degreeProgress,
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(
      recommendations,
      degreeProgress,
      request,
    );

    return {
      recommendations: recommendations.sort((a, b) => b.priority - a.priority),
      reasoning,
      alternativePaths,
      warnings,
    };
  }

  /**
   * Get AI-powered course recommendations
   */
  private async getAIRecommendations(
    request: RecommendationRequest,
    degreeProgress: DegreeProgressResponse,
    availableCourses: CourseInfo[],
  ): Promise<string[]> {
    try {
      // Build context for AI
      const context = {
        studentId: request.studentId,
        term: request.term,
        academicYear: request.academicYear,
        degreeProgress,
        goals: request.goals || [],
        preferences: request.preferences,
        additionalContext: request.context,
      };

      // Call AI Service for recommendations
      const response = await fetch(
        `${this.aiServiceUrl}/api/ai/advising/recommend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context,
            availableCourses: availableCourses.map((c) => ({
              code: c.courseCode,
              name: c.courseName,
              credits: c.credits,
              level: c.level,
            })),
          }),
        },
      );

      if (!response.ok) {
        console.error("AI Service returned error:", response.status);
        return this.getFallbackRecommendations(degreeProgress);
      }

      const data = (await response.json()) as { recommendations?: string[] };
      return data.recommendations || [];
    } catch (error) {
      console.error("Error calling AI Service:", error);
      return this.getFallbackRecommendations(degreeProgress);
    }
  }

  /**
   * Get fallback recommendations if AI service is unavailable
   */
  private getFallbackRecommendations(
    degreeProgress: DegreeProgressResponse,
  ): string[] {
    const recommendations: string[] = [];

    // Recommend courses from incomplete requirements
    for (const req of degreeProgress.requirements) {
      if (req.status !== "COMPLETED" && req.remainingCourses.length > 0) {
        recommendations.push(...req.remainingCourses.slice(0, 2));
      }
    }

    return recommendations;
  }

  /**
   * Build detailed course recommendations with scheduling info
   */
  private async buildCourseRecommendations(
    courseCodes: string[],
    availableCourses: CourseInfo[],
    availableSections: CourseSectionInfo[],
    currentSchedule: CourseSectionInfo[],
    athleticSchedule?: AthleticSchedule,
  ): Promise<CourseRecommendation[]> {
    const recommendations: CourseRecommendation[] = [];
    const currentTimeSlots = currentSchedule.flatMap((s) =>
      sectionToTimeSlots(s.days, s.startTime, s.endTime),
    );

    for (let i = 0; i < courseCodes.length; i++) {
      const courseCode = courseCodes[i];
      const course = availableCourses.find((c) => c.courseCode === courseCode);

      if (!course) continue;

      // Find available sections for this course
      const sections = availableSections.filter(
        (s) => s.courseId === course.id,
      );

      // Check which sections fit the schedule
      const compatibleSections = sections.filter((section) => {
        const sectionSlots = sectionToTimeSlots(
          section.days,
          section.startTime,
          section.endTime,
        );

        // Check time conflicts with current schedule
        if (hasTimeSlotOverlap(currentTimeSlots, sectionSlots)) {
          return false;
        }

        // Check athletic conflicts
        if (athleticSchedule) {
          for (const event of athleticSchedule.events) {
            const eventSlots = sectionToTimeSlots(
              event.days,
              event.startTime,
              event.endTime,
            );
            if (
              hasTimeSlotOverlap(sectionSlots, eventSlots) &&
              event.isMandatory
            ) {
              return false;
            }
          }
        }

        return true;
      });

      // Check prerequisites (simplified - would check actual completion)
      const meetsPrerequisites =
        !course.prerequisites || course.prerequisites.length === 0;

      const fitsSchedule = compatibleSections.length > 0;

      // Calculate priority (higher is better)
      const priority = this.calculateCoursePriority(
        course,
        i,
        fitsSchedule,
        meetsPrerequisites,
      );

      recommendations.push({
        course,
        priority,
        reasoning: this.generateCourseReasoning(
          course,
          fitsSchedule,
          meetsPrerequisites,
          compatibleSections.length,
        ),
        availableSections: compatibleSections,
        fitsSchedule,
        meetsPrerequisites,
        satisfiesRequirement: course.level === "FRESHMAN" ? "CORE" : "MAJOR", // Simplified
      });
    }

    return recommendations;
  }

  /**
   * Calculate priority score for a course recommendation
   */
  private calculateCoursePriority(
    course: CourseInfo,
    aiRank: number,
    fitsSchedule: boolean,
    meetsPrerequisites: boolean,
  ): number {
    let priority = 100 - aiRank * 5; // AI ranking base score

    if (fitsSchedule) priority += 20;
    if (meetsPrerequisites) priority += 15;

    // Prefer lower level courses for foundational knowledge
    if (course.level === "FRESHMAN") priority += 10;
    if (course.level === "SOPHOMORE") priority += 5;

    return priority;
  }

  /**
   * Generate reasoning for a course recommendation
   */
  private generateCourseReasoning(
    course: CourseInfo,
    fitsSchedule: boolean,
    meetsPrerequisites: boolean,
    sectionCount: number,
  ): string {
    const reasons: string[] = [];

    if (course.level === "FRESHMAN" || course.level === "SOPHOMORE") {
      reasons.push("Foundational course for your degree program");
    }

    if (fitsSchedule && sectionCount > 0) {
      reasons.push(
        `${sectionCount} section(s) available that fit your schedule`,
      );
    } else if (!fitsSchedule) {
      reasons.push(
        "No sections currently fit your schedule - consider adjusting",
      );
    }

    if (!meetsPrerequisites) {
      reasons.push("Prerequisites must be completed first");
    }

    return reasons.join(". ");
  }

  /**
   * Generate alternative course paths
   */
  private generateAlternativePaths(
    recommendations: CourseRecommendation[],
    _degreeProgress: DegreeProgressResponse,
  ): AlternativePath[] {
    const paths: AlternativePath[] = [];

    // Group recommendations by requirement category
    const byCategory = new Map<string, CourseRecommendation[]>();
    for (const rec of recommendations) {
      if (!rec.satisfiesRequirement) continue;

      const categoryRecs = byCategory.get(rec.satisfiesRequirement) || [];
      categoryRecs.push(rec);
      byCategory.set(rec.satisfiesRequirement, categoryRecs);
    }

    // Generate alternative paths
    for (const [category, recs] of byCategory) {
      if (recs.length >= 2) {
        paths.push({
          description: `Alternative ${category.toLowerCase()} courses`,
          courses: recs.slice(0, 3).map((r) => r.course.courseCode),
          reasoning: `These courses all satisfy your ${category.toLowerCase()} requirements`,
        });
      }
    }

    return paths;
  }

  /**
   * Generate warnings for recommendations
   */
  private generateRecommendationWarnings(
    recommendations: CourseRecommendation[],
    currentSchedule: CourseSectionInfo[],
    degreeProgress: DegreeProgressResponse,
  ): string[] {
    const warnings: string[] = [];

    const currentCredits = currentSchedule.reduce(
      (sum, s) => sum + (s.course?.credits || 0),
      0,
    );
    const recommendedCredits = recommendations
      .slice(0, 3)
      .reduce((sum, r) => sum + r.course.credits, 0);

    if (currentCredits + recommendedCredits > 18) {
      warnings.push(
        `Adding recommended courses would exceed 18 credit hours (total: ${currentCredits + recommendedCredits})`,
      );
    }

    const prereqIssues = recommendations.filter((r) => !r.meetsPrerequisites);
    if (prereqIssues.length > 0) {
      warnings.push(
        `${prereqIssues.length} recommended course(s) have unmet prerequisites`,
      );
    }

    const scheduleIssues = recommendations.filter((r) => !r.fitsSchedule);
    if (scheduleIssues.length > 0) {
      warnings.push(
        `${scheduleIssues.length} recommended course(s) do not fit your current schedule`,
      );
    }

    if (!degreeProgress.onTrack) {
      warnings.push("You are behind the normal pace for degree completion");
    }

    return warnings;
  }

  /**
   * Generate overall reasoning for recommendations
   */
  private generateReasoning(
    recommendations: CourseRecommendation[],
    degreeProgress: DegreeProgressResponse,
    request: RecommendationRequest,
  ): string {
    const parts: string[] = [];

    parts.push(
      `Based on your degree progress (${degreeProgress.completionPercentage.toFixed(0)}% complete), `,
    );

    if (request.goals && request.goals.length > 0) {
      parts.push(`your goals (${request.goals.join(", ")}), `);
    }

    parts.push(
      `we recommend the following courses for ${request.term} ${request.academicYear}. `,
    );

    const highPriority = recommendations.filter((r) => r.priority >= 100);
    if (highPriority.length > 0) {
      parts.push(
        `The top ${highPriority.length} recommendation(s) are high priority based on degree requirements and schedule compatibility. `,
      );
    }

    const incompleteCats = degreeProgress.requirements.filter(
      (r) => r.status !== "COMPLETED",
    );
    if (incompleteCats.length > 0) {
      parts.push(
        `Focus on completing requirements in: ${incompleteCats.map((r) => r.category).join(", ")}. `,
      );
    }

    return parts.join("");
  }
}
