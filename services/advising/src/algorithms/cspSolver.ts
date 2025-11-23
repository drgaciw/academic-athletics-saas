// ============================================================================
// CONSTRAINT SATISFACTION PROBLEM (CSP) SOLVER
// ============================================================================

import type {
  CSPVariable,
  CSPConstraint,
  CSPAssignment,
  CSPSolution,
  Conflict,
  CourseSectionInfo,
} from "../types";

/**
 * CSP Solver using Backtracking with Forward Checking
 * Implements the AC-3 algorithm for constraint propagation
 */
export class CSPSolver {
  private variables: CSPVariable[];
  private constraints: CSPConstraint[];
  private sectionMap: Map<string, CourseSectionInfo>;

  constructor(
    variables: CSPVariable[],
    constraints: CSPConstraint[],
    sections: CourseSectionInfo[],
  ) {
    this.variables = variables;
    this.constraints = constraints;
    this.sectionMap = new Map(sections.map((s) => [s.id, s]));
  }

  /**
   * Solve the CSP and return the best solution
   */
  solve(): CSPSolution {
    // Try to find a valid solution
    const assignment = this.backtrackingSearch({});

    if (assignment) {
      return {
        assignment,
        isValid: true,
        conflicts: [],
        score: this.evaluateSolution(assignment),
      };
    }

    // No valid solution found, return best partial solution
    const partialSolution = this.findBestPartialSolution();
    const conflicts = this.identifyConflicts(partialSolution);

    return {
      assignment: partialSolution,
      isValid: false,
      conflicts,
      score: this.evaluateSolution(partialSolution),
    };
  }

  /**
   * Backtracking search with forward checking
   */
  private backtrackingSearch(assignment: CSPAssignment): CSPAssignment | null {
    // Check if assignment is complete
    if (this.isComplete(assignment)) {
      return assignment;
    }

    // Select unassigned variable using MRV (Minimum Remaining Values) heuristic
    const variable = this.selectUnassignedVariable(assignment);
    if (!variable) return null;

    // Order domain values using LCV (Least Constraining Value) heuristic
    const orderedValues = this.orderDomainValues(variable, assignment);

    for (const value of orderedValues) {
      // Try assigning this value
      const newAssignment = { ...assignment, [variable.id]: value };

      // Check if this assignment is consistent with constraints
      if (this.isConsistent(newAssignment)) {
        // Forward checking: update domains of remaining variables
        const domainsBackup = this.saveDomains();

        if (this.forwardCheck(variable.id, value, assignment)) {
          const result = this.backtrackingSearch(newAssignment);
          if (result) {
            return result;
          }
        }

        // Restore domains if forward checking failed
        this.restoreDomains(domainsBackup);
      }
    }

    return null;
  }

  /**
   * Check if assignment is complete
   */
  private isComplete(assignment: CSPAssignment): boolean {
    return Object.keys(assignment).length === this.variables.length;
  }

  /**
   * Select unassigned variable using MRV heuristic
   */
  private selectUnassignedVariable(
    assignment: CSPAssignment,
  ): CSPVariable | null {
    const unassigned = this.variables.filter((v) => !(v.id in assignment));

    if (unassigned.length === 0) return null;

    // MRV: Choose variable with smallest domain
    return unassigned.reduce((min, v) =>
      v.domain.length < min.domain.length ? v : min,
    );
  }

  /**
   * Order domain values using LCV heuristic
   */
  private orderDomainValues(
    variable: CSPVariable,
    assignment: CSPAssignment,
  ): string[] {
    // LCV: Prefer values that rule out fewer choices for neighbors
    const valueCounts = new Map<string, number>();

    for (const value of variable.domain) {
      let count = 0;
      const testAssignment = { ...assignment, [variable.id]: value };

      // Count how many values this rules out for other variables
      for (const otherVar of this.variables) {
        if (otherVar.id === variable.id) continue;
        if (otherVar.id in assignment) continue;

        for (const otherValue of otherVar.domain) {
          const fullAssignment = {
            ...testAssignment,
            [otherVar.id]: otherValue,
          };
          if (!this.isConsistent(fullAssignment)) {
            count++;
          }
        }
      }

      valueCounts.set(value, count);
    }

    // Sort values by constraint count (ascending)
    return variable.domain.sort(
      (a, b) => (valueCounts.get(a) || 0) - (valueCounts.get(b) || 0),
    );
  }

  /**
   * Check if assignment is consistent with all constraints
   */
  private isConsistent(assignment: CSPAssignment): boolean {
    for (const constraint of this.constraints) {
      // Check if all variables in constraint are assigned
      const allAssigned = constraint.variables.every((v) => v in assignment);

      if (allAssigned) {
        // Validate the constraint
        if (!constraint.validator(assignment)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Forward checking: Remove inconsistent values from domains
   */
  private forwardCheck(
    assignedVar: string,
    assignedValue: string,
    assignment: CSPAssignment,
  ): boolean {
    const testAssignment = { ...assignment, [assignedVar]: assignedValue };

    for (const variable of this.variables) {
      if (variable.id === assignedVar) continue;
      if (variable.id in assignment) continue;

      // Remove values that are inconsistent with the assignment
      const validValues = variable.domain.filter((value) => {
        const fullAssignment = { ...testAssignment, [variable.id]: value };
        return this.isConsistent(fullAssignment);
      });

      if (validValues.length === 0) {
        return false; // Domain wipeout
      }

      variable.domain = validValues;
    }

    return true;
  }

  /**
   * Save current state of all variable domains
   */
  private saveDomains(): Map<string, string[]> {
    const backup = new Map<string, string[]>();
    for (const variable of this.variables) {
      backup.set(variable.id, [...variable.domain]);
    }
    return backup;
  }

  /**
   * Restore variable domains from backup
   */
  private restoreDomains(backup: Map<string, string[]>): void {
    for (const variable of this.variables) {
      const savedDomain = backup.get(variable.id);
      if (savedDomain) {
        variable.domain = savedDomain;
      }
    }
  }

  /**
   * Find best partial solution when no complete solution exists
   */
  private findBestPartialSolution(): CSPAssignment {
    const assignment: CSPAssignment = {};

    // Sort variables by domain size (MRV)
    const sortedVars = [...this.variables].sort(
      (a, b) => a.domain.length - b.domain.length,
    );

    for (const variable of sortedVars) {
      if (variable.domain.length === 0) continue;

      // Try each value and pick the one with fewest conflicts
      let bestValue = variable.domain[0];
      let minConflicts = Infinity;

      for (const value of variable.domain) {
        const testAssignment = { ...assignment, [variable.id]: value };
        const conflictCount = this.countConflicts(testAssignment);

        if (conflictCount < minConflicts) {
          minConflicts = conflictCount;
          bestValue = value;
        }
      }

      assignment[variable.id] = bestValue;
    }

    return assignment;
  }

  /**
   * Count the number of constraint violations in an assignment
   */
  private countConflicts(assignment: CSPAssignment): number {
    let count = 0;

    for (const constraint of this.constraints) {
      const allAssigned = constraint.variables.every((v) => v in assignment);
      if (allAssigned && !constraint.validator(assignment)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Identify specific conflicts in an assignment
   */
  private identifyConflicts(assignment: CSPAssignment): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const constraint of this.constraints) {
      const allAssigned = constraint.variables.every((v) => v in assignment);

      if (allAssigned && !constraint.validator(assignment)) {
        const affectedCourses = constraint.variables
          .map((varId) => {
            const sectionId = assignment[varId];
            const section = this.sectionMap.get(sectionId);
            return section?.course?.courseCode || varId;
          })
          .filter(Boolean);

        conflicts.push({
          conflictType:
            constraint.type === "TIME"
              ? "TIME_CONFLICT"
              : constraint.type === "ATHLETIC"
                ? "ATHLETIC_CONFLICT"
                : constraint.type === "PREREQUISITE"
                  ? "PREREQUISITE_MISSING"
                  : constraint.type === "CAPACITY"
                    ? "CAPACITY_FULL"
                    : constraint.type === "CREDIT_LIMIT"
                      ? "CREDIT_HOUR_LIMIT"
                      : constraint.type === "COREQUISITE"
                        ? "COREQUISITE_MISSING"
                        : "TIME_CONFLICT",
          severity: constraint.severity,
          description: constraint.description,
          affectedCourses,
          suggestions: this.generateSuggestions(constraint, assignment),
          metadata: {
            constraintType: constraint.type,
            variables: constraint.variables,
            assignment,
          },
        });
      }
    }

    return conflicts;
  }

  /**
   * Generate suggestions for resolving a constraint violation
   */
  private generateSuggestions(
    constraint: CSPConstraint,
    _assignment: CSPAssignment,
  ): string[] {
    const suggestions: string[] = [];

    switch (constraint.type) {
      case "TIME":
        suggestions.push(
          "Try selecting different sections to avoid time conflicts",
        );
        suggestions.push(
          "Consider taking one of these courses in a different term",
        );
        break;
      case "ATHLETIC":
        suggestions.push(
          "Look for sections that do not conflict with athletic commitments",
        );
        suggestions.push("Discuss schedule flexibility with your coach");
        break;
      case "PREREQUISITE":
        suggestions.push("Complete required prerequisite courses first");
        suggestions.push("Contact your advisor about prerequisite waivers");
        break;
      case "CAPACITY":
        suggestions.push("Join the waitlist for full sections");
        suggestions.push("Look for alternative sections or courses");
        break;
      case "CREDIT_LIMIT":
        suggestions.push(
          "Reduce your course load to meet credit hour requirements",
        );
        suggestions.push("Seek approval for credit hour overload if necessary");
        break;
    }

    return suggestions;
  }

  /**
   * Evaluate the quality of a solution
   */
  private evaluateSolution(assignment: CSPAssignment): number {
    let score = 100;

    // Penalize for incomplete assignment
    const completeness = Object.keys(assignment).length / this.variables.length;
    score *= completeness;

    // Penalize for constraint violations
    const conflicts = this.countConflicts(assignment);
    score -= conflicts * 10;

    // Bonus for preferred characteristics
    score += this.evaluateScheduleQuality(assignment);

    return Math.max(0, score);
  }

  /**
   * Evaluate schedule quality based on preferences
   */
  private evaluateScheduleQuality(assignment: CSPAssignment): number {
    let bonus = 0;

    // Bonus for balanced daily schedule
    const dailyCredits = this.calculateDailyCredits(assignment);
    const avgCredits =
      Array.from(dailyCredits.values()).reduce((a, b) => a + b, 0) /
      dailyCredits.size;
    const variance =
      Array.from(dailyCredits.values()).reduce(
        (sum, credits) => sum + Math.pow(credits - avgCredits, 2),
        0,
      ) / dailyCredits.size;

    if (variance < 2) bonus += 5; // Reward balanced schedule

    // Bonus for fewer days
    if (dailyCredits.size <= 4) bonus += 3;

    return bonus;
  }

  /**
   * Calculate credits per day for a schedule
   */
  private calculateDailyCredits(
    assignment: CSPAssignment,
  ): Map<string, number> {
    const dailyCredits = new Map<string, number>();

    for (const [, sectionId] of Object.entries(assignment)) {
      const section = this.sectionMap.get(sectionId);
      if (!section) continue;

      for (const day of section.days) {
        const current = dailyCredits.get(day) || 0;
        dailyCredits.set(day, current + (section.course?.credits || 0));
      }
    }

    return dailyCredits;
  }
}
