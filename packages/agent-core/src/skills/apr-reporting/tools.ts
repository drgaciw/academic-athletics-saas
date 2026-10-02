/**
 * APR & GSR Institutional Reporting Tools
 */

import { z } from "zod";
import { AgentTool } from "../../runtime/tool-registry.js";

const calculateAprInputSchema = z.object({
  sport: z.string(),
  academicYear: z.string(),
  rosterMembersCount: z.number().int().positive(),
  pointsEarned: z.number().int().min(0),
  pointsPossible: z.number().int().positive(),
});

type CalculateAprInput = z.infer<typeof calculateAprInputSchema>;

export const calculateTeamAprScoreTool: AgentTool<
  CalculateAprInput,
  Record<string, unknown>
> = {
  name: "calculate_team_apr_score",
  description:
    "Calculate NCAA Academic Progress Rate (APR) based on eligibility and retention points.",
  domain: "apr_reporting",
  tier: "TIER_1_AUTONOMOUS",
  inputSchema: calculateAprInputSchema,
  execute: async (input: CalculateAprInput) => {
    const rawRatio = input.pointsEarned / input.pointsPossible;
    const aprScore = Math.round(rawRatio * 1000);
    const meetsCutoff = aprScore >= 930;

    return {
      sport: input.sport,
      academicYear: input.academicYear,
      rosterCount: input.rosterMembersCount,
      pointsEarned: input.pointsEarned,
      pointsPossible: input.pointsPossible,
      aprScore,
      benchmarkRequirement: 930,
      postseasonEligible: meetsCutoff,
      penaltyRiskLevel:
        aprScore >= 950
          ? "SAFE"
          : aprScore >= 930
            ? "MONITOR"
            : "SANCTION_IMMINENT",
      recommendedRemediation: meetsCutoff
        ? "Performance complies with NCAA multi-year standard."
        : `CRITICAL DEFICIENCY: APR score of ${aprScore} is below the 930 minimum postseason threshold. Review retention and study hall mandates immediately.`,
    };
  },
};
