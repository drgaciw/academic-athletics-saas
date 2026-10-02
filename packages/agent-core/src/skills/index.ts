/**
 * In-App Domain Skills Export & Default Toolkit Initializer
 */

import { ToolRegistry } from "../runtime/tool-registry.js";
import {
  evaluateNcaaEligibilityTool,
  simulateCourseDropImpactTool,
} from "./compliance/tools.js";
import {
  auditDegreeProgressTool,
  resolveScheduleConflictsTool,
} from "./advising/tools.js";
import {
  calculateAcademicRiskScoreTool,
  assignMandatoryTutoringTool,
} from "./risk-intervention/tools.js";
import { parseTranscriptDocumentTool } from "./document-ingestion/tools.js";
import { calculateTeamAprScoreTool } from "./apr-reporting/tools.js";

export * from "./compliance/prompt.js";
export * from "./compliance/tools.js";
export * from "./advising/prompt.js";
export * from "./advising/tools.js";
export * from "./risk-intervention/prompt.js";
export * from "./risk-intervention/tools.js";
export * from "./document-ingestion/prompt.js";
export * from "./document-ingestion/tools.js";
export * from "./apr-reporting/prompt.js";
export * from "./apr-reporting/tools.js";

/**
 * Creates and initializes a ToolRegistry equipped with all 5 domain toolkits.
 */
export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // Compliance
  registry.registerTool(evaluateNcaaEligibilityTool);
  registry.registerTool(simulateCourseDropImpactTool);

  // Advising
  registry.registerTool(auditDegreeProgressTool);
  registry.registerTool(resolveScheduleConflictsTool);

  // Risk Intervention
  registry.registerTool(calculateAcademicRiskScoreTool);
  registry.registerTool(assignMandatoryTutoringTool);

  // Document Ingestion
  registry.registerTool(parseTranscriptDocumentTool);

  // APR Reporting
  registry.registerTool(calculateTeamAprScoreTool);

  return registry;
}
