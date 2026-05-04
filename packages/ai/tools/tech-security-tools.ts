/**
 * Tech Security Tools
 *
 * Tools for OWASP guidance, STRIDE threat modeling, vulnerability assessment,
 * security compliance mapping, and incident playbooks.
 */

import { z } from "zod";
import type {
  ToolDefinition,
  ToolExecutionContext,
} from "../types/agent.types";

export const securityTools: ToolDefinition[] = [
  {
    id: "security.owasp_check",
    name: "owaspCheck",
    description:
      "Return OWASP Top-10 category mapping and recommended controls for a given feature or code path.",
    parameters: z.object({
      featureOrPath: z
        .string()
        .describe("Feature name or file/endpoint being assessed"),
      context: z
        .string()
        .optional()
        .describe("Additional context (auth, data flow, external exposure)"),
    }),
    execute: async (params, ctx) => {
      // MVP stub: return canonical OWASP categories + hardcoded mappings. Real impl will query knowledge base.
      return {
        input: params.featureOrPath,
        topFindings: [
          "A01:2021 – Broken Access Control – Enforce row-level security in Prisma + verify userRoles",
          "A05:2021 – Security Misconfiguration – Ensure next.config headers, CORS, and CSP",
          "A07:2021 – Identification and Authentication Failures – Rotate Clerk session tokens",
          "A09:2021 – Security Logging Failures – Ensure Langfuse + audit logger capture all agent actions",
        ],
        recommendation:
          "Add authorization middleware to transfer-credit upload endpoint.",
        owaspReferences: ["https://owasp.org/Top10/"],
      };
    },
    category: "security",
    requiredPermissions: ["security:read"],
  },

  {
    id: "security.stride_model",
    name: "strideModel",
    description:
      "Generate a lightweight STRIDE threat model (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) and produce Mermaid diagram.",
    parameters: z.object({
      systemName: z
        .string()
        .describe("Name of the system or workflow to model"),
      dataFlows: z
        .array(z.string())
        .describe("High-level data-flow descriptions"),
      externalActors: z.array(z.string()).optional(),
    }),
    execute: async (params) => {
      return {
        system: params.systemName,
        threats: [
          {
            category: "S",
            finding: "Unauthorized transcript upload",
            mitigation: "Clerk JWT + role check",
          },
          {
            category: "T",
            finding: "Equivalency record tampering",
            mitigation: "Signed hash + RLS",
          },
          {
            category: "I",
            finding: "PII leak to wrong tenant",
            mitigation: "Context-aware RAG filter + embedding tenancy",
          },
          {
            category: "D",
            finding: "ReDoS in course search",
            mitigation: "Input sanitization + rate limiting",
          },
          {
            category: "E",
            finding: "Privilege escalation via agent tool",
            mitigation: "Permission matrix + HITL approval gate",
          },
        ],
        mermaidDiagram: `flowchart TD
          subgraph External
            Student[Student Upload]
            Registrar[Registrar Approval]
          end
          subgraph AAH
            RAG[RAG Pipeline]
            Agent[Security Agent]
          end
          Student -->|Signed URL| RAG
          RAG --> Agent
          Agent --> Registrar`,
        references: ["STRIDE – Microsoft Threat Modeling"],
      };
    },
    category: "security",
    requiredPermissions: ["security:read"],
  },

  {
    id: "security.vuln_assessment",
    name: "vulnAssessment",
    description:
      "Map a discovered vulnerability or CVE to AAH-specific impact (FERPA, NCAA compliance, financial data risk) and produce remediation steps.",
    parameters: z.object({
      cveOrIssue: z.string().describe("CVE ID or internal issue identifier"),
      affectedComponents: z
        .array(z.string())
        .describe("Affected files/packages"),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    }),
    execute: async (params) => {
      return {
        cve: params.cveOrIssue,
        impact:
          "High – potential exposure of student academic and financial records",
        ncaaTitleIXFlag: true,
        remediation: [
          "Apply upstream patch within 48h",
          "Rotate affected service credentials",
          "Add automated OWASP dependency scan to PR gate",
        ],
        verification:
          "Run `security-specialist` skill + `pnpm audit --audit-level=moderate`",
      };
    },
    category: "security",
  },
];
