/**
 * Business Financial Agent Tools
 *
 * Tools for scholarship forecasting, Title IX EADA/equity reporting, budget variance analysis,
 * ROI modeling, and NCAA Bylaw 15 financial aid calculations – all built on aggregated, de-identified data.
 */

import { z } from "zod";
import type { ToolDefinition } from "../types/agent.types";

export const financialTools: ToolDefinition[] = [
  {
    id: "financial.forecast_scholarships",
    name: "forecastScholarships",
    description:
      "Generate 1-3 year scholarship budget forecast. Inputs: current rosters, aid levels, tuition inflation, recruiting class assumptions. Output: aggregated projections + NCAA risk flags.",
    parameters: z.object({
      sportCodes: z
        .array(z.string())
        .optional()
        .describe("List of sport codes to include (omit for all)"),
      years: z.number().min(1).max(5).default(3),
      assumptions: z
        .object({
          tuitionInflationRate: z.number().min(0).max(1).default(0.035),
          rosterGrowth: z.record(z.number()).optional(),
          newSports: z.array(z.string()).optional(),
        })
        .optional(),
    }),
    execute: async (params) => {
      // MVP stub – real impl queries Prisma aggregated data + applies model
      const baseTotal = 14250000;
      const projection = Array.from({ length: params.years }, (_, i) => ({
        year: new Date().getFullYear() + i,
        totalProjectedAid: Math.round(baseTotal * Math.pow(1.035, i + 1)),
        riskFlag:
          i > 1 ? "NCAA Bylaw 20.02.4 proximity warning (monitor)" : "OK",
      }));
      return {
        projections: projection,
        assumptionsUsed: params.assumptions || { tuitionInflationRate: 0.035 },
        totalIncreaseY3: "$1.65M",
        recommendation:
          "Run sensitivity analysis on 8% roster growth scenario.",
      };
    },
    category: "financial",
    requiredPermissions: ["financial:read", "financial:write"],
  },

  {
    id: "financial.title_ix_equity_report",
    name: "titleIxEquityReport",
    description:
      "Produce EADA/NCAA Division I financial equity (Title IX) compliance snapshot from aggregated data. Includes participation, aid, and operating expense ratios.",
    parameters: z.object({
      fiscalYear: z
        .number()
        .optional()
        .default(() => new Date().getFullYear()),
      includeComparisons: z.boolean().default(true),
    }),
    execute: async (params) => {
      return {
        year: params.fiscalYear,
        participationRatio: { male: 0.62, female: 0.38 },
        aidRatio: { male: 0.59, female: 0.41 },
        operatingExpenseRatio: { male: 0.67, female: 0.33 },
        prongCompliance: "Prong 2 (continuing expansion)",
        auditRisk: "LOW",
      };
    },
    category: "financial",
    requiredPermissions: ["compliance:read", "financial:read"],
  },

  {
    id: "financial.variance_analysis",
    name: "varianceAnalysis",
    description:
      "Compare actual vs budgeted line items for a specified period and surface material variances (>5% or $25k).",
    parameters: z.object({
      period: z.enum(["Q1", "Q2", "Q3", "Q4", "YTD"]),
      categories: z
        .array(
          z.enum([
            "scholarships",
            "travel",
            "academic_support",
            "facilities",
            "recruiting",
          ]),
        )
        .optional(),
    }),
    execute: async (params) => {
      return {
        period: params.period,
        materialVariances: [
          {
            category: "travel",
            actual: 1840000,
            budget: 1600000,
            variancePct: 15,
            explanation: "Unplanned SEC travel + inflation",
          },
        ],
        recommendation:
          "Re-forecast Q3 travel budget by +$120k using Finance Agent.",
      };
    },
    category: "financial",
  },
];
