/**
 * Conflicts Routes
 * Check for scheduling conflicts
 */

import { Hono } from "hono";
import { getUser, checkPermission } from "@aah/auth";
import { successResponse, ForbiddenError } from "@aah/api-utils";

const routes = new Hono();

/**
 * GET /api/advising/conflicts/:studentId
 * Get scheduling conflicts for a student
 */
routes.get("/conflicts/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  const _currentUser = getUser(c);
  const correlationId = c.get("correlationId") as string | undefined;

  try {
    checkPermission(c, "advising:read");
  } catch (error) {
    throw new ForbiddenError("You do not have permission to view conflicts");
  }

  // Mock response (fetch from database in production)
  return c.json(
    successResponse(
      {
        studentId,
        conflicts: [],
        hasConflicts: false,
      },
      correlationId,
    ),
  );
});

export default routes;
