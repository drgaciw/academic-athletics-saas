import { describe, it } from "node:test";
import assert from "node:assert";
import {
  ActionGate,
  AIAuditLogger,
  InMemoryStore,
  cosineSimilarity,
  ToolRegistry,
  AgentOrchestrator,
  StudentAthleteProfileSchema,
  EligibilityEvaluationReportSchema,
} from "../dist/index.js";
import type { AgentTool } from "../dist/index.js";
import { z } from "zod";

describe("@aah/agent-core Test Suite", () => {
  describe("1. Zod Schema Validation", () => {
    it("should validate a valid student-athlete profile", () => {
      const validProfile = {
        id: "ATH-101",
        userId: "USR-101",
        name: "Jordan Hayes",
        email: "jordan.hayes@athletics.edu",
        sport: "Men's Track & Field",
        season: "SPRING",
        classStanding: "SOPHOMORE",
        currentTermNumber: 3,
        major: "Kinesiology",
        majorDeclared: true,
        enrolledCredits: 15,
        lastTermPassedCredits: 14,
        academicYearCredits: 28,
        cumulativeDegreeCredits: 32,
        totalDegreeCreditsRequired: 120,
        cumulativeGpa: 3.15,
        eligibilityStatus: "ELIGIBLE",
        academicRiskLevel: "LOW",
        studyHallHoursCompleted: 6,
        studyHallHoursRequired: 4,
      };

      const parsed = StudentAthleteProfileSchema.parse(validProfile);
      assert.strictEqual(parsed.name, "Jordan Hayes");
      assert.strictEqual(parsed.eligibilityStatus, "ELIGIBLE");
    });

    it("should reject invalid email or negative credits", () => {
      const invalid = {
        id: "ATH-102",
        userId: "USR-102",
        name: "Bad Data",
        email: "not-an-email",
        sport: "Women's Soccer",
        season: "FALL",
        classStanding: "FRESHMAN",
        currentTermNumber: 1,
        major: "Undeclared",
        majorDeclared: false,
        enrolledCredits: -5,
        lastTermPassedCredits: 0,
        academicYearCredits: 0,
        cumulativeDegreeCredits: 0,
        totalDegreeCreditsRequired: 120,
        cumulativeGpa: 2.5,
        eligibilityStatus: "ELIGIBLE",
        academicRiskLevel: "LOW",
        studyHallHoursCompleted: 0,
        studyHallHoursRequired: 4,
      };

      assert.throws(() => StudentAthleteProfileSchema.parse(invalid));
    });
  });

  describe("2. ActionGate Human-in-the-Loop Governance", () => {
    it("should classify action risk correctly", () => {
      const gate = new ActionGate();
      assert.strictEqual(
        gate.classifyActionTier("query_eligibility"),
        "TIER_1_AUTONOMOUS",
      );
      assert.strictEqual(
        gate.classifyActionTier("simulate_course_drop"),
        "TIER_1_AUTONOMOUS",
      );
      assert.strictEqual(
        gate.classifyActionTier("assign_mandatory_tutoring"),
        "TIER_2_STAFF_REVIEW",
      );
      assert.strictEqual(
        gate.classifyActionTier("certify_official_eligibility"),
        "TIER_3_COMPLIANCE_GATE",
      );
    });

    it("should stage proposal for Tier 3 compliance gate and require approval", async () => {
      const gate = new ActionGate();
      const proposal = await gate.stageProposal({
        agentType: "compliance-agent",
        actionName: "certify_official_eligibility",
        studentAthleteId: "ATH-101",
        summary: "Official Spring 2027 Eligibility Certification",
        reasoning:
          "PTD 42.5% satisfies 40% rule; cumulative GPA 2.45 satisfies 1.900 rule.",
        bylawCitations: ["Bylaw 14.4.3.2.1", "Bylaw 14.4.3.3.1"],
        payload: { term: "Spring 2027", certifiedStatus: "ELIGIBLE" },
      });

      assert.strictEqual(proposal.status, "PENDING");
      assert.strictEqual(proposal.tier, "TIER_3_COMPLIANCE_GATE");

      // Approving proposal
      const approved = await gate.approveProposal(
        proposal.id,
        "ADVISOR-007",
        "Verified with registrar transcript.",
      );
      assert.strictEqual(approved.status, "APPROVED");
      assert.strictEqual(approved.reviewedBy, "ADVISOR-007");
    });
  });

  describe("3. Tiered Memory & Cosine Vector Search", () => {
    it("should compute exact cosine similarity", () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const vecC = [0, 1, 0];

      assert.strictEqual(Math.round(cosineSimilarity(vecA, vecB)), 1);
      assert.strictEqual(cosineSimilarity(vecA, vecC), 0);
    });

    it("should store and query semantic long-term memory via embeddings", async () => {
      const store = new InMemoryStore();

      await store.saveLongTermMemory({
        userId: "USR-101",
        studentAthleteId: "ATH-101",
        memoryType: "long_term",
        content:
          "Student athlete Marcus Vance requires morning practice accommodation for Biology labs.",
        embedding: [0.9, 0.1, 0.0],
        importance: 0.9,
        confidence: 0.95,
      });

      await store.saveLongTermMemory({
        userId: "USR-101",
        studentAthleteId: "ATH-101",
        memoryType: "long_term",
        content:
          "Student athlete prefers study hall in the athletic learning center.",
        embedding: [0.1, 0.9, 0.0],
        importance: 0.5,
        confidence: 0.8,
      });

      // Query with vector closer to first memory
      const results = await store.queryLongTermMemory({
        userId: "USR-101",
        studentAthleteId: "ATH-101",
        queryEmbedding: [0.85, 0.15, 0.0],
        minRelevanceScore: 0.7,
        topK: 1,
      });

      assert.strictEqual(results.length, 1);
      assert.match(results[0].content, /morning practice accommodation/);
    });
  });

  describe("4. ToolRegistry and AgentOrchestrator End-to-End", () => {
    it("should execute Tier 1 tool autonomously", async () => {
      const registry = new ToolRegistry();
      const mockQueryTool: AgentTool = {
        name: "get_student_gpa",
        description: "Get current student cumulative GPA",
        domain: "advising",
        inputSchema: z.object({ studentId: z.string() }),
        execute: async (input: any) => ({
          studentId: input.studentId,
          gpa: 3.42,
        }),
      };
      registry.registerTool(mockQueryTool);

      const orchestrator = new AgentOrchestrator({ toolRegistry: registry });
      const result = await orchestrator.dispatchAction({
        actionName: "get_student_gpa",
        input: { studentId: "ATH-101" },
        context: {
          userId: "USR-1",
          userRole: "STUDENT_ATHLETE",
          studentAthleteId: "ATH-101",
        },
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual((result.data as any).gpa, 3.42);
    });

    it("should halt Tier 3 tool and return staged proposal", async () => {
      const registry = new ToolRegistry();
      const mockCertifyTool: AgentTool = {
        name: "certify_official_eligibility",
        description: "Certify NCAA eligibility",
        domain: "compliance",
        tier: "TIER_3_COMPLIANCE_GATE",
        inputSchema: z.object({ studentId: z.string(), term: z.string() }),
        execute: async (input: any) => ({
          certified: true,
          studentId: input.studentId,
        }),
      };
      registry.registerTool(mockCertifyTool);

      const orchestrator = new AgentOrchestrator({ toolRegistry: registry });
      const result = await orchestrator.dispatchAction({
        actionName: "certify_official_eligibility",
        input: { studentId: "ATH-101", term: "Spring 2027" },
        context: {
          userId: "USR-AI",
          userRole: "AGENT",
          studentAthleteId: "ATH-101",
        },
        bylawCitations: ["Bylaw 14.4.3.2.1"],
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isStagedProposal, true);
      assert.ok(result.proposalId);
      assert.strictEqual((result.data as any).status, "STAGED_FOR_APPROVAL");
    });
  });

  describe("5. In-App Domain Skills Toolkits", () => {
    it("should initialize default tool registry with all 5 domains", async () => {
      const { createDefaultToolRegistry } = await import("../dist/index.js");
      const registry = createDefaultToolRegistry();
      const allTools = registry.getAllTools();

      assert.ok(allTools.length >= 7);
      assert.ok(registry.getToolsByDomain("compliance").length >= 2);
      assert.ok(registry.getToolsByDomain("advising").length >= 2);
      assert.ok(registry.getToolsByDomain("risk_intervention").length >= 2);
      assert.ok(registry.getToolsByDomain("document_ingestion").length >= 1);
      assert.ok(registry.getToolsByDomain("apr_reporting").length >= 1);
    });

    it("should evaluate NCAA eligibility and detect PTD violations", async () => {
      const { evaluateNcaaEligibilityTool } = await import("../dist/index.js");
      const context = { userId: "USR-1", userRole: "COMPLIANCE_OFFICER" };

      // Deficient student: Term 5 (requires 40% = 48 credits), has only 40 credits
      const res: any = await evaluateNcaaEligibilityTool.execute(
        {
          studentId: "ATH-200",
          studentName: "Deficient Athlete",
          sport: "Men's Basketball",
          currentTermNumber: 5,
          enrolledCredits: 14,
          lastTermPassedCredits: 12,
          academicYearCredits: 24,
          cumulativeDegreeCredits: 40,
          totalDegreeCreditsRequired: 120,
          cumulativeGpa: 2.5,
          major: "Communications",
          majorDeclared: true,
          isGraduatingSenior: false,
        },
        context,
      );

      assert.strictEqual(res.overallStatus, "INELIGIBLE");
      assert.strictEqual(res.ptdReport.metPTD, false);
      assert.strictEqual(res.ptdReport.deficiencyCredits, 8); // 48 - 40 = 8 credits
      assert.match(res.violations[0], /14\.4\.3\.2\.1/);
    });

    it("should simulate course drop and flag ineligibility if drops below 12 credits", async () => {
      const { simulateCourseDropImpactTool } = await import("../dist/index.js");
      const context = { userId: "USR-1", userRole: "STUDENT_ATHLETE" };

      const res: any = await simulateCourseDropImpactTool.execute(
        {
          studentId: "ATH-200",
          currentEnrolledCredits: 14,
          creditsToDrop: 3,
          courseCode: "HIST 101",
          isGraduatingSenior: false,
        },
        context,
      );

      assert.strictEqual(res.projectedEnrolledCredits, 11);
      assert.strictEqual(res.maintainsFullTimeStatus, false);
      assert.strictEqual(res.willCauseImmediateIneligibility, true);
      assert.match(res.recommendation, /DO NOT DROP/);
    });

    it("should calculate academic risk score with multiple weighted factors", async () => {
      const { calculateAcademicRiskScoreTool } = await import(
        "../dist/index.js"
      );
      const context = { userId: "USR-1", userRole: "ADVISOR" };

      const res: any = await calculateAcademicRiskScoreTool.execute(
        {
          studentId: "ATH-300",
          cumulativeGpa: 1.85, // Critical GPA (<2.0 -> 40 pts)
          currentTermNumber: 5,
          studyHallCompletionRate: 0.4, // Non-compliant (<0.60 -> 15 pts)
          missedClassesCount: 4, // Absences (>=3 -> 15 pts)
          midtermDeficienciesCount: 1, // Midterm D/F (15 pts)
          ptdBufferPercentage: 1.5, // Thin PTD (<3% -> 15 pts)
        },
        context,
      );

      assert.ok(res.riskScore >= 75);
      assert.strictEqual(res.riskLevel, "CRITICAL");
      assert.strictEqual(res.requiresIntervention, true);
      assert.ok(res.recommendedActions.length > 0);
    });

    it("should parse transcript courses and sum transfer credits", async () => {
      const { parseTranscriptDocumentTool } = await import("../dist/index.js");
      const context = { userId: "USR-1", userRole: "REGISTRAR" };

      const rawTranscript = `
        ENGL 101 College Composition A 3.0
        MATH 120 Precalculus B+ 4.0
        CHEM 101 General Chemistry D 4.0
      `;

      const res: any = await parseTranscriptDocumentTool.execute(
        {
          documentId: "DOC-99",
          sourceInstitution: "Community College of Denver",
          transcriptRawText: rawTranscript,
        },
        context,
      );

      assert.strictEqual(res.extractedCoursesCount, 3);
      assert.strictEqual(res.acceptedTransferCredits, 7); // ENGL (3.0) + MATH (4.0); CHEM grade D not transferrable
    });

    it("should calculate NCAA APR score and flag postseason eligibility", async () => {
      const { calculateTeamAprScoreTool } = await import("../dist/index.js");
      const context = { userId: "USR-1", userRole: "COMPLIANCE_OFFICER" };

      // Safe APR: 48 out of 50 points = 960 (> 930)
      const safeRes: any = await calculateTeamAprScoreTool.execute(
        {
          sport: "Women's Soccer",
          academicYear: "2025-2026",
          rosterMembersCount: 25,
          pointsEarned: 48,
          pointsPossible: 50,
        },
        context,
      );

      assert.strictEqual(safeRes.aprScore, 960);
      assert.strictEqual(safeRes.postseasonEligible, true);
      assert.strictEqual(safeRes.penaltyRiskLevel, "SAFE");

      // Sanction imminent: 45 out of 50 points = 900 (< 930)
      const sanctionRes: any = await calculateTeamAprScoreTool.execute(
        {
          sport: "Men's Basketball",
          academicYear: "2025-2026",
          rosterMembersCount: 15,
          pointsEarned: 45,
          pointsPossible: 50,
        },
        context,
      );

      assert.strictEqual(sanctionRes.aprScore, 900);
      assert.strictEqual(sanctionRes.postseasonEligible, false);
      assert.strictEqual(sanctionRes.penaltyRiskLevel, "SANCTION_IMMINENT");
    });
  });
});
