/**
 * Document & Transcript Ingestion Tools
 */

import { z } from "zod";
import { AgentTool } from "../../runtime/tool-registry.js";

const parseTranscriptInputSchema = z.object({
  documentId: z.string(),
  sourceInstitution: z.string(),
  transcriptRawText: z.string(),
});

type ParseTranscriptInput = z.infer<typeof parseTranscriptInputSchema>;

export const parseTranscriptDocumentTool: AgentTool<
  ParseTranscriptInput,
  Record<string, unknown>
> = {
  name: "parse_transcript_document",
  description:
    "Parse text or OCR output from an academic transcript into structured course grade entries.",
  domain: "document_ingestion",
  tier: "TIER_1_AUTONOMOUS",
  inputSchema: parseTranscriptInputSchema,
  execute: async (input: ParseTranscriptInput) => {
    const lines = input.transcriptRawText.split("\n");
    const parsedCourses: Array<{
      code: string;
      title: string;
      grade: string;
      credits: number;
      transferrable: boolean;
    }> = [];

    for (const line of lines) {
      const match = line.match(
        /([A-Z]{2,4}\s*\d{3})\s+([A-Za-z\s]+)\s+([A-DFW][+-]?)\s+(\d+(?:\.\d+)?)/,
      );
      if (match) {
        const grade = match[3];
        const isTransferrable = !["D", "D-", "F", "W"].includes(grade);
        parsedCourses.push({
          code: match[1],
          title: match[2].trim(),
          grade,
          credits: parseFloat(match[4]),
          transferrable: isTransferrable,
        });
      }
    }

    const totalCredits = parsedCourses.reduce(
      (sum, c) => sum + (c.transferrable ? c.credits : 0),
      0,
    );

    return {
      documentId: input.documentId,
      sourceInstitution: input.sourceInstitution,
      extractedCoursesCount: parsedCourses.length,
      acceptedTransferCredits: totalCredits,
      courses: parsedCourses,
    };
  },
};
