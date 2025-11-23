/**
 * Recommend Routes
 * AI-powered course recommendations
 */

import { Hono } from "hono";
import { getUser, checkPermission } from "@aah/auth";
import {
  successResponse,
  validateRequest,
  ForbiddenError,
} from "@aah/api-utils";
import { z } from "zod";

const routes = new Hono();

const recommendSchema = z.object({
  studentId: z.string().min(1),
  semester: z.string().optional(),
  preferences: z
    .object({
      interests: z.array(z.string()).optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    })
    .optional(),
});

/**
 * POST /api/advising/recommend
 * Get AI-powered course recommendations
 */
routes.post(
  "/recommend",
  validateRequest(recommendSchema, "json"),
  async (c) => {
    const _currentUser = getUser(c);
    const correlationId = c.get("correlationId") as string | undefined;
    const data = c.get("validated_json") as z.infer<typeof recommendSchema>;

    try {
      checkPermission(c, "advising:read");
    } catch (error) {
      throw new ForbiddenError(
        "You do not have permission to get recommendations",
      );
    }

    // Mock recommendations (integrate with AI Service in production)
    return c.json(
      successResponse(
        {
          studentId: data.studentId,
          recommendations: [
            {
              courseCode: "CS101",
              courseName: "Introduction to Computer Science",
              credits: 3,
              reason: "Matches your interests and fits your schedule",
              priority: "HIGH",
            },
          ],
        },
        correlationId,
      ),
    );
  },
);

export default routes;
