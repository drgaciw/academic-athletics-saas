// ============================================================================
// DEGREE AUDIT SERVICE
// ============================================================================

import type {
  DegreeProgressRequest,
  DegreeProgressResponse,
  RequirementProgress,
  CourseCompletion,
} from "../types";

/**
 * Degree Audit Service
 * Tracks student progress toward degree requirements
 */
export class DegreeAuditService {
  /**
   * Get degree progress for a student
   */
  async getDegreeProgress(
    request: DegreeProgressRequest,
  ): Promise<DegreeProgressResponse> {
    const { studentId, degreeProgram } = request;

    // This would fetch data from the database
    // For now, return a structured response
    const requirements = await this.fetchDegreeRequirements(
      degreeProgram || "DEFAULT",
    );
    const completedCourses = await this.fetchCompletedCourses(studentId);

    const requirementProgress = this.calculateRequirementProgress(
      requirements,
      completedCourses,
    );

    const totalCreditsRequired = requirements.reduce(
      (sum, req) => sum + req.creditsRequired,
      0,
    );
    const totalCreditsCompleted = requirementProgress.reduce(
      (sum, req) => sum + req.creditsCompleted,
      0,
    );
    const completionPercentage =
      (totalCreditsCompleted / totalCreditsRequired) * 100;

    const onTrack = this.isOnTrack(
      completedCourses,
      totalCreditsCompleted,
      degreeProgram,
    );
    const warnings = this.generateWarnings(
      requirementProgress,
      completedCourses,
    );

    return {
      studentId,
      degreeProgram: degreeProgram || "DEFAULT",
      totalCreditsRequired,
      totalCreditsCompleted,
      completionPercentage,
      requirements: requirementProgress,
      estimatedGraduation: this.estimateGraduation(
        totalCreditsCompleted,
        totalCreditsRequired,
        completedCourses,
      ),
      onTrack,
      warnings,
    };
  }

  /**
   * Fetch degree requirements from database
   */
  private async fetchDegreeRequirements(
    _degreeProgram: string,
  ): Promise<
    Array<{
      category: string;
      description: string;
      creditsRequired: number;
      courses?: string[];
    }>
  > {
    // This would query the DegreeRequirement table
    // For now, return default requirements
    return [
      {
        category: "GENERAL_EDUCATION",
        description: "General Education Requirements",
        creditsRequired: 30,
        courses: ["ENG101", "MATH101", "SCI101", "HIST101"],
      },
      {
        category: "MAJOR",
        description: "Major Requirements",
        creditsRequired: 45,
        courses: [],
      },
      {
        category: "ELECTIVE",
        description: "General Electives",
        creditsRequired: 15,
        courses: [],
      },
      {
        category: "CORE",
        description: "Core Requirements",
        creditsRequired: 30,
        courses: [],
      },
    ];
  }

  /**
   * Fetch completed courses for a student
   */
  private async fetchCompletedCourses(
    _studentId: string,
  ): Promise<CourseCompletion[]> {
    // This would query the DegreeProgress table
    // For now, return sample data
    return [];
  }

  /**
   * Calculate progress for each requirement category
   */
  private calculateRequirementProgress(
    requirements: Array<{
      category: string;
      description: string;
      creditsRequired: number;
      courses?: string[];
    }>,
    completedCourses: CourseCompletion[],
  ): RequirementProgress[] {
    return requirements.map((req) => {
      const categoryCompletions = completedCourses.filter(
        (course) => course.satisfiesRequirement === req.category,
      );

      const creditsCompleted = categoryCompletions.reduce(
        (sum, course) => sum + course.credits,
        0,
      );

      const remainingCourses = this.getRemainingCourses(
        req.category,
        req.courses || [],
        categoryCompletions,
      );

      let status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
      if (creditsCompleted >= req.creditsRequired) {
        status = "COMPLETED";
      } else if (creditsCompleted > 0) {
        status = "IN_PROGRESS";
      } else {
        status = "NOT_STARTED";
      }

      return {
        category: req.category,
        description: req.description,
        creditsRequired: req.creditsRequired,
        creditsCompleted,
        coursesCompleted: categoryCompletions,
        remainingCourses,
        status,
      };
    });
  }

  /**
   * Get remaining courses for a requirement category
   */
  private getRemainingCourses(
    category: string,
    requiredCourses: string[],
    completedCourses: CourseCompletion[],
  ): string[] {
    const completedCodes = new Set(completedCourses.map((c) => c.courseCode));
    return requiredCourses.filter((code) => !completedCodes.has(code));
  }

  /**
   * Check if student is on track for graduation
   */
  private isOnTrack(
    completedCourses: CourseCompletion[],
    totalCreditsCompleted: number,
    _degreeProgram?: string,
  ): boolean {
    if (completedCourses.length === 0) return true;

    // Calculate expected credits based on enrollment duration
    // This is simplified - would use actual enrollment start date
    const termsEnrolled = this.calculateTermsEnrolled(completedCourses);
    const expectedCredits = termsEnrolled * 15; // Assuming 15 credits per term

    // Student is on track if they have at least 90% of expected credits
    return totalCreditsCompleted >= expectedCredits * 0.9;
  }

  /**
   * Calculate number of terms enrolled
   */
  private calculateTermsEnrolled(completedCourses: CourseCompletion[]): number {
    if (completedCourses.length === 0) return 0;

    const terms = new Set(
      completedCourses.map((c) => `${c.term}-${c.academicYear}`),
    );

    return terms.size;
  }

  /**
   * Estimate graduation date
   */
  private estimateGraduation(
    creditsCompleted: number,
    creditsRequired: number,
    completedCourses: CourseCompletion[],
  ): string | undefined {
    if (completedCourses.length === 0) return undefined;

    const creditsRemaining = creditsRequired - creditsCompleted;
    if (creditsRemaining <= 0) {
      return "Eligible for graduation";
    }

    // Calculate average credits per term
    const termsEnrolled = this.calculateTermsEnrolled(completedCourses);
    const avgCreditsPerTerm =
      termsEnrolled > 0 ? creditsCompleted / termsEnrolled : 15;

    // Estimate remaining terms
    const termsRemaining = Math.ceil(creditsRemaining / avgCreditsPerTerm);

    // Get most recent term
    const mostRecentCourse = completedCourses.sort((a, b) => {
      const dateA = new Date(
        `${a.academicYear}-${this.termToMonth(a.term)}-01`,
      );
      const dateB = new Date(
        `${b.academicYear}-${this.termToMonth(b.term)}-01`,
      );
      return dateB.getTime() - dateA.getTime();
    })[0];

    if (!mostRecentCourse) return undefined;

    // Estimate graduation term
    const estimatedYear =
      parseInt(mostRecentCourse.academicYear) + Math.floor(termsRemaining / 2);
    const estimatedTerm = termsRemaining % 2 === 0 ? "Fall" : "Spring";

    return `${estimatedTerm} ${estimatedYear}`;
  }

  /**
   * Convert term name to month number
   */
  private termToMonth(term: string): number {
    switch (term.toLowerCase()) {
      case "spring":
        return 1;
      case "summer":
        return 5;
      case "fall":
        return 8;
      default:
        return 1;
    }
  }

  /**
   * Generate warnings for degree progress issues
   */
  private generateWarnings(
    requirements: RequirementProgress[],
    completedCourses: CourseCompletion[],
  ): string[] {
    const warnings: string[] = [];

    // Check for incomplete requirement categories
    for (const req of requirements) {
      if (req.status === "NOT_STARTED" && req.category === "CORE") {
        warnings.push(`Core requirements not started: ${req.description}`);
      }

      if (req.status === "IN_PROGRESS") {
        const percentComplete =
          (req.creditsCompleted / req.creditsRequired) * 100;
        if (percentComplete < 50) {
          warnings.push(
            `${req.description} is ${percentComplete.toFixed(0)}% complete (${req.creditsCompleted}/${req.creditsRequired} credits)`,
          );
        }
      }
    }

    // Check for failed courses
    const failedCourses = completedCourses.filter(
      (c) => c.grade && ["F", "WF", "U"].includes(c.grade),
    );
    if (failedCourses.length > 0) {
      warnings.push(
        `${failedCourses.length} course(s) need to be retaken: ${failedCourses.map((c) => c.courseCode).join(", ")}`,
      );
    }

    // Check for low GPA courses
    const lowGradeCourses = completedCourses.filter(
      (c) => c.grade && ["D", "D+", "D-"].includes(c.grade),
    );
    if (lowGradeCourses.length > 0) {
      warnings.push(
        `Consider retaking courses with low grades to improve GPA: ${lowGradeCourses.map((c) => c.courseCode).join(", ")}`,
      );
    }

    return warnings;
  }

  /**
   * Check if a specific course satisfies degree requirements
   */
  async checkCourseSatisfiesRequirement(
    studentId: string,
    courseCode: string,
    degreeProgram: string,
  ): Promise<{ satisfies: boolean; requirement?: string; reason?: string }> {
    const requirements = await this.fetchDegreeRequirements(degreeProgram);

    for (const req of requirements) {
      if (req.courses && req.courses.includes(courseCode)) {
        return {
          satisfies: true,
          requirement: req.category,
          reason: `Satisfies ${req.description}`,
        };
      }
    }

    // Check if it's an elective
    return {
      satisfies: true,
      requirement: "ELECTIVE",
      reason: "Counts as general elective",
    };
  }

  /**
   * Get recommended courses for degree completion
   */
  async getRecommendedCourses(
    studentId: string,
    degreeProgram: string,
  ): Promise<{ courseCode: string; priority: number; reason: string }[]> {
    const progress = await this.getDegreeProgress({ studentId, degreeProgram });
    const recommendations: {
      courseCode: string;
      priority: number;
      reason: string;
    }[] = [];

    for (const req of progress.requirements) {
      if (req.status === "COMPLETED") continue;

      const priority =
        req.category === "CORE" ? 1 : req.category === "MAJOR" ? 2 : 3;

      for (const courseCode of req.remainingCourses.slice(0, 3)) {
        recommendations.push({
          courseCode,
          priority,
          reason: `Required for ${req.description}`,
        });
      }
    }

    // Sort by priority
    return recommendations.sort((a, b) => a.priority - b.priority);
  }
}
