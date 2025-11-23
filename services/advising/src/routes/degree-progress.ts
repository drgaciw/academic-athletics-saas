/**
 * Degree Progress Routes
 * Track degree completion progress
 */

import { Hono } from "hono";
import { getUser, checkPermission } from "@aah/auth";
import { successResponse, ForbiddenError } from "@aah/api-utils";

const routes = new Hono();

/**
 * GET /api/advising/degree-progress/:id
 * Get degree progress for a student
 */
routes.get("/degree-progress/:id", async (c) => {
  const studentId = c.req.param("id");
  const _currentUser = getUser(c);
  const correlationId = c.get("correlationId") as string | undefined;

  try {
    checkPermission(c, "advising:read");
  } catch (error) {
    throw new ForbiddenError(
      "You do not have permission to view degree progress",
    );
  }

  // Mock response (fetch from database in production)
  return c.json(
    successResponse(
      {
        studentId,
        major: "Computer Science",
        totalCreditsRequired: 120,
        creditsCompleted: 45,
        progressPercent: 37.5,
        requirements: {
          coreCompleted: 15,
          coreRequired: 30,
          majorCompleted: 20,
          majorRequired: 60,
          electivesCompleted: 10,
          electivesRequired: 30,
        },
        onTrack: true,
        estimatedGraduation: "2026-05",
      },
      correlationId,
    ),
  );
});

export default routes;
