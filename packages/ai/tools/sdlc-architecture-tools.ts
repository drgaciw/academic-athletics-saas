/**
 * SDLC Architecture Tools
 *
 * Tools for architecture review, ADR generation, pattern recommendations,
 * integration analysis, and technical decision records.
 */

import { z } from "zod";
import type {
  ToolDefinition,
  ToolCategory,
  ToolExecutionContext,
} from "../types/agent.types";

export const architectureTools: ToolDefinition[] = [
  {
    id: "architecture.generate_adr",
    name: "generateADR",
    description:
      "Generate a Technical Decision Record (ADR/TDR) for a proposed architecture change. Returns structured markdown with drivers, options, decision, and consequences.",
    parameters: z.object({
      title: z.string().describe("Short title for the decision record"),
      context: z.string().describe("The architectural problem or opportunity"),
      drivers: z
        .array(z.string())
        .describe(
          "Key drivers: performance, compliance, maintainability, cost, etc.",
        ),
      optionsConsidered: z
        .array(
          z.object({
            name: z.string(),
            tradeoffs: z.string(),
            recommendation: z.enum(["recommended", "alternative", "rejected"]),
          }),
        )
        .describe("Alternatives evaluated"),
      decision: z
        .string()
        .describe("The final recommended architecture decision"),
      consequences: z
        .string()
        .describe(
          "Positive and negative consequences (technical debt, compliance impact, perf)",
        ),
    }),
    execute: async (params, context) => {
      // TODO: implement AdrGenerator using ragPipeline for AAH context + template rendering
      // For MVP stub – return structured placeholder. Real impl will use RAG for pattern reuse.
      return {
        title: params.title,
        status: "proposed",
        decision: params.decision,
        drivers: params.drivers,
        options: params.optionsConsidered,
        consequences: params.consequences,
        author: context?.userId || "architecture-agent",
        date: new Date().toISOString(),
      };
    },
    category: "sdlc_architecture",
    requiredPermissions: ["architecture:write"],
  },

  {
    id: "architecture.recommend_pattern",
    name: "recommendPattern",
    description:
      "Recommend design patterns, conventions, or module structures for a given feature. Returns rationale + code skeleton pointers.",
    parameters: z.object({
      featureDescription: z.string().describe("Feature or problem description"),
      constraints: z
        .array(z.string())
        .optional()
        .describe("Hard constraints (e.g. FERPA, NCAA audit, multi-tenant)"),
      existingPatternsUsed: z.array(z.string()).optional(),
    }),
    execute: async (params, context) => {
      // TODO: RAG over existing agent patterns (compliance-agent, ragPipeline, transfer-credit workflows)
      return {
        recommendedPattern: "layered + agentic-workflow",
        rationale:
          "Matches existing multi-agent orchestration pattern in transfer-credits workflow",
        affectedFiles: [
          "packages/ai/agents/*-agent.ts",
          "packages/ai/lib/agentic-workflow.ts",
        ],
        nextSteps: [
          "Extend MultiAgentWorkflow",
          "Add ToolCategory for new domain",
        ],
      };
    },
    category: "sdlc_architecture",
  },

  {
    id: "architecture.analyze_integration",
    name: "analyzeIntegration",
    description:
      "Analyze integration points between new components and existing AAH services (Prisma, RAG, memory, chatService).",
    parameters: z.object({
      components: z
        .array(z.string())
        .describe("Components or agents involved in proposed integration"),
      dataFlow: z.string().describe("Brief description of data movement"),
    }),
    execute: async (params) => {
      // TODO: hook into existing Prisma models + ragPipeline interfaces
      return {
        risks: ["PII leakage between tenants", "embedding storage costs"],
        recommendations: [
          "Use row-level security + context-aware RAG filters",
          "Cache embeddings with expiry",
        ],
        suggestedContracts: [
          "AgentRequest/AgentResponse",
          "MultiAgentWorkflow",
        ],
      };
    },
    category: "integration",
  },
];
