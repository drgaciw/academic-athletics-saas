// ============================================================================
// SCHEDULING ENGINE SERVICE
// ============================================================================

import { CSPSolver } from "../algorithms/cspSolver";
import { ConflictDetectorService } from "./conflictDetector";
import type {
  ScheduleRequest,
  ScheduleResponse,
  CSPVariable,
  CSPConstraint,
  CSPAssignment,
  CourseSectionInfo,
  AthleticSchedule,
  SchedulePreferences,
} from "../types";
import { CREDIT_HOUR_LIMITS } from "../types";
import {
  hasTimeSlotOverlap,
  sectionToTimeSlots,
  timeToMinutes,
} from "../utils/timeUtils";

/**
 * Scheduling Engine Service
 * Uses CSP solver to generate optimal course schedules
 */
export class SchedulingEngineService {
  private conflictDetector: ConflictDetectorService;

  constructor() {
    this.conflictDetector = new ConflictDetectorService();
  }

  /**
   * Generate an optimal course schedule
   */
  async generateSchedule(
    request: ScheduleRequest,
    availableSections: CourseSectionInfo[],
    athleticSchedule?: AthleticSchedule,
    prerequisiteData?: Map<string, string[]>,
  ): Promise<ScheduleResponse> {
    // Build CSP variables - one per course
    const variables = this.buildCSPVariables(
      request.sectionIds,
      availableSections,
    );

    // Build CSP constraints
    const constraints = this.buildCSPConstraints(
      variables,
      availableSections,
      athleticSchedule,
      request.preferences,
    );

    // Solve CSP
    const solver = new CSPSolver(variables, constraints, availableSections);
    const solution = solver.solve();

    // Convert solution to schedule response
    const selectedSections = this.solutionToSections(
      solution.assignment,
      availableSections,
    );

    // Detect any remaining conflicts
    const conflictResult = await this.conflictDetector.detectConflicts(
      selectedSections,
      request.studentId,
      athleticSchedule,
      prerequisiteData,
    );

    // Calculate total credits
    const totalCredits = selectedSections.reduce(
      (sum, s) => sum + (s.course?.credits || 0),
      0,
    );

    // Determine status
    let status: "VALID" | "HAS_CONFLICTS" | "INVALID";
    if (solution.isValid && !conflictResult.hasConflicts) {
      status = "VALID";
    } else if (
      conflictResult.conflicts.some((c) => c.severity === "CRITICAL")
    ) {
      status = "INVALID";
    } else {
      status = "HAS_CONFLICTS";
    }

    return {
      scheduleId: "", // Will be set when saved to database
      studentId: request.studentId,
      term: request.term,
      academicYear: request.academicYear,
      sections: selectedSections,
      totalCredits,
      conflicts: [...solution.conflicts, ...conflictResult.conflicts],
      status,
      warnings: conflictResult.warnings,
    };
  }

  /**
   * Build CSP variables from requested courses
   */
  private buildCSPVariables(
    requestedSectionIds: string[],
    availableSections: CourseSectionInfo[],
  ): CSPVariable[] {
    // Group sections by course
    const sectionsByCourse = new Map<string, CourseSectionInfo[]>();

    for (const sectionId of requestedSectionIds) {
      const section = availableSections.find((s) => s.id === sectionId);
      if (!section || !section.courseId) continue;

      const courseSections = sectionsByCourse.get(section.courseId) || [];
      courseSections.push(section);
      sectionsByCourse.set(section.courseId, courseSections);
    }

    // Also include alternative sections for each course
    for (const section of availableSections) {
      if (!section.courseId) continue;

      const courseSections = sectionsByCourse.get(section.courseId);
      if (courseSections && !courseSections.find((s) => s.id === section.id)) {
        courseSections.push(section);
      }
    }

    // Create variables
    const variables: CSPVariable[] = [];

    for (const [courseId, sections] of sectionsByCourse) {
      variables.push({
        id: courseId,
        domain: sections.map((s) => s.id),
      });
    }

    return variables;
  }

  /**
   * Build CSP constraints
   */
  private buildCSPConstraints(
    variables: CSPVariable[],
    sections: CourseSectionInfo[],
    athleticSchedule?: AthleticSchedule,
    preferences?: SchedulePreferences,
  ): CSPConstraint[] {
    const constraints: CSPConstraint[] = [];
    const sectionMap = new Map(sections.map((s) => [s.id, s]));

    // Time conflict constraints (pairwise)
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        constraints.push({
          type: "TIME",
          variables: [variables[i].id, variables[j].id],
          validator: (assignment) => {
            const section1 = sectionMap.get(assignment[variables[i].id]);
            const section2 = sectionMap.get(assignment[variables[j].id]);

            if (!section1 || !section2) return true;

            const slots1 = sectionToTimeSlots(
              section1.days,
              section1.startTime,
              section1.endTime,
            );
            const slots2 = sectionToTimeSlots(
              section2.days,
              section2.startTime,
              section2.endTime,
            );

            return !hasTimeSlotOverlap(slots1, slots2);
          },
          description: "No time conflicts between courses",
          severity: "CRITICAL",
        });
      }
    }

    // Athletic schedule constraints
    if (athleticSchedule) {
      for (const variable of variables) {
        constraints.push({
          type: "ATHLETIC",
          variables: [variable.id],
          validator: (assignment) => {
            const section = sectionMap.get(assignment[variable.id]);
            if (!section) return true;

            const courseSlots = sectionToTimeSlots(
              section.days,
              section.startTime,
              section.endTime,
            );

            for (const event of athleticSchedule.events) {
              const eventSlots = sectionToTimeSlots(
                event.days,
                event.startTime,
                event.endTime,
              );
              if (
                hasTimeSlotOverlap(courseSlots, eventSlots) &&
                event.isMandatory
              ) {
                return false;
              }
            }

            return true;
          },
          description: "No conflicts with mandatory athletic events",
          severity: "CRITICAL",
        });
      }
    }

    // Credit hour limit constraint
    constraints.push({
      type: "CREDIT_LIMIT",
      variables: variables.map((v) => v.id),
      validator: (assignment) => {
        let totalCredits = 0;
        for (const varId of Object.keys(assignment)) {
          const section = sectionMap.get(assignment[varId]);
          if (section?.course) {
            totalCredits += section.course.credits;
          }
        }
        return (
          totalCredits >= CREDIT_HOUR_LIMITS.MIN_FULL_TIME &&
          totalCredits <= CREDIT_HOUR_LIMITS.MAX_STANDARD
        );
      },
      description: `Credit hours must be between ${CREDIT_HOUR_LIMITS.MIN_FULL_TIME} and ${CREDIT_HOUR_LIMITS.MAX_STANDARD}`,
      severity: "HIGH",
    });

    // Preference-based constraints
    if (preferences) {
      if (preferences.preferredDays && preferences.preferredDays.length > 0) {
        for (const variable of variables) {
          constraints.push({
            type: "TIME",
            variables: [variable.id],
            validator: (assignment) => {
              const section = sectionMap.get(assignment[variable.id]);
              if (!section) return true;

              return section.days.some((day) =>
                preferences.preferredDays!.includes(day),
              );
            },
            description: "Prefer courses on specified days",
            severity: "LOW",
          });
        }
      }

      if (
        preferences.preferredTimeRanges &&
        preferences.preferredTimeRanges.length > 0
      ) {
        for (const variable of variables) {
          constraints.push({
            type: "TIME",
            variables: [variable.id],
            validator: (assignment) => {
              const section = sectionMap.get(assignment[variable.id]);
              if (!section) return true;

              const startMin = timeToMinutes(section.startTime);
              const endMin = timeToMinutes(section.endTime);

              return preferences.preferredTimeRanges!.some((range) => {
                const rangeStartMin = timeToMinutes(range.start);
                const rangeEndMin = timeToMinutes(range.end);
                return startMin >= rangeStartMin && endMin <= rangeEndMin;
              });
            },
            description: "Prefer courses within specified time ranges",
            severity: "LOW",
          });
        }
      }

      if (preferences.avoidBackToBack) {
        for (let i = 0; i < variables.length; i++) {
          for (let j = i + 1; j < variables.length; j++) {
            constraints.push({
              type: "TIME",
              variables: [variables[i].id, variables[j].id],
              validator: (assignment) => {
                const section1 = sectionMap.get(assignment[variables[i].id]);
                const section2 = sectionMap.get(assignment[variables[j].id]);

                if (!section1 || !section2) return true;

                const slots1 = sectionToTimeSlots(
                  section1.days,
                  section1.startTime,
                  section1.endTime,
                );
                const slots2 = sectionToTimeSlots(
                  section2.days,
                  section2.startTime,
                  section2.endTime,
                );

                // Check if any slots are back-to-back
                for (const slot1 of slots1) {
                  for (const slot2 of slots2) {
                    if (slot1.day === slot2.day) {
                      const gap = Math.abs(
                        timeToMinutes(slot1.endTime) -
                          timeToMinutes(slot2.startTime),
                      );
                      if (gap === 0) return false; // Back-to-back
                    }
                  }
                }

                return true;
              },
              description: "Avoid back-to-back classes",
              severity: "LOW",
            });
          }
        }
      }

      if (preferences.maxDailyHours) {
        constraints.push({
          type: "TIME",
          variables: variables.map((v) => v.id),
          validator: (assignment) => {
            const dailyHours = new Map<string, number>();

            for (const varId of Object.keys(assignment)) {
              const section = sectionMap.get(assignment[varId]);
              if (!section) continue;

              const slots = sectionToTimeSlots(
                section.days,
                section.startTime,
                section.endTime,
              );
              for (const slot of slots) {
                const duration =
                  (timeToMinutes(slot.endTime) -
                    timeToMinutes(slot.startTime)) /
                  60;
                const current = dailyHours.get(slot.day) || 0;
                dailyHours.set(slot.day, current + duration);
              }
            }

            return Array.from(dailyHours.values()).every(
              (hours) => hours <= preferences.maxDailyHours!,
            );
          },
          description: `Limit daily class hours to ${preferences.maxDailyHours}`,
          severity: "MEDIUM",
        });
      }
    }

    return constraints;
  }

  /**
   * Convert CSP solution to course sections
   */
  private solutionToSections(
    assignment: CSPAssignment,
    availableSections: CourseSectionInfo[],
  ): CourseSectionInfo[] {
    const sections: CourseSectionInfo[] = [];
    const sectionMap = new Map(availableSections.map((s) => [s.id, s]));

    for (const sectionId of Object.values(assignment)) {
      const section = sectionMap.get(sectionId);
      if (section) {
        sections.push(section);
      }
    }

    return sections;
  }
}
