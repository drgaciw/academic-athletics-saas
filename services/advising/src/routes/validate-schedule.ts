/**
 * Validate Schedule Routes
 * Validate proposed course schedules
 */

import { Hono } from "hono";
import { getUser, checkPermission } from "@aah/auth";
import {
  successResponse,
  validateRequest,
  ForbiddenError,
} from "@aah/api-utils";
import { z } from "zod";
import {
  schedulingEngine,
  type ScheduledCourse,
  type ScheduleConstraints,
} from "../services/scheduling-engine";

const routes = new Hono();

const validateSchema = z.object({
  studentId: z.string().min(1),
  schedule: z.array(
    z.object({
      courseId: z.string(),
      sectionId: z.string(),
    }),
  ),
});

/**
 * POST /api/advising/validate-schedule
 * Validate a proposed course schedule
 */
routes.post(
  "/validate-schedule",
  validateRequest(validateSchema, "json"),
  async (c) => {
    const _currentUser = getUser(c);
    const correlationId = c.get("correlationId");
    const data = c.get("validated_json");

    try {
      checkPermission(c, "advising:read");
    } catch (error) {
      throw new ForbiddenError(
        "You do not have permission to validate schedules",
      );
    }

    // Mock validation (fetch actual data in production)
    const mockSchedule: ScheduledCourse[] = [];
    const constraints: ScheduleConstraints = {
      minCredits: 12,
      maxCredits: 18,
      athleticCommitments: [],
    };

    const conflicts = schedulingEngine.detectConflicts(
      mockSchedule,
      constraints,
    );

    return c.json(
      successResponse(
        {
          studentId: data.studentId,
          isValid: conflicts.length === 0,
          conflicts,
          totalCredits: 15,
        },
        correlationId,
      ),
    );
  },
);

export default routes;
