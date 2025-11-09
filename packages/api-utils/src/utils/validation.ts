/**
 * Validation Utilities
 * Provides common Zod schemas and validation helpers
 */

import { z } from 'zod';
import type { Context, MiddlewareHandler } from 'hono';
import { ValidationError } from './errors';

/**
 * Common Zod schemas for reuse across services
 */
export const CommonSchemas = {
  /**
   * Email validation
   */
  email: z.string().email('Invalid email format').toLowerCase().trim(),

  /**
   * Phone number validation (flexible format)
   */
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),

  /**
   * URL validation
   */
  url: z.string().url('Invalid URL format'),

  /**
   * UUID validation
   */
  uuid: z.string().uuid('Invalid UUID format'),

  /**
   * Date string validation (ISO 8601)
   */
  dateString: z.string().datetime('Invalid date format'),

  /**
   * Date object validation
   */
  date: z.coerce.date(),

  /**
   * Password validation (min 8 chars, at least one uppercase, lowercase, number)
   */
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  /**
   * Positive integer
   */
  positiveInt: z.number().int().positive('Must be a positive integer'),

  /**
   * Non-negative integer
   */
  nonNegativeInt: z.number().int().min(0, 'Must be a non-negative integer'),

  /**
   * Pagination page number
   */
  page: z.coerce.number().int().positive().default(1),

  /**
   * Pagination page size
   */
  pageSize: z.coerce.number().int().positive().max(100).default(20),

  /**
   * Sort order
   */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  /**
   * Boolean from string
   */
  booleanString: z
    .string()
    .toLowerCase()
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  /**
   * Non-empty string
   */
  nonEmptyString: z.string().trim().min(1, 'Cannot be empty'),

  /**
   * Slug (URL-friendly string)
   */
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .min(1)
    .max(100),

  /**
   * Hex color code
   */
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),

  /**
   * Timezone
   */
  timezone: z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid timezone format'),

  /**
   * JSON string that can be parsed
   */
  jsonString: z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON',
      });
      return z.NEVER;
    }
  }),

  /**
   * IP address (v4 or v6)
   */
  ipAddress: z.string().ip('Invalid IP address'),

  /**
   * Latitude
   */
  latitude: z.number().min(-90).max(90),

  /**
   * Longitude
   */
  longitude: z.number().min(-180).max(180),

  /**
   * Coordinates (lat/lng object)
   */
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
} as const;

/**
 * Create pagination query schema
 */
export function createPaginationSchema(maxPageSize = 100) {
  return z.object({
    page: CommonSchemas.page,
    pageSize: CommonSchemas.pageSize.max(maxPageSize),
    sortBy: z.string().optional(),
    sortOrder: CommonSchemas.sortOrder,
  });
}

/**
 * Create validation middleware for Hono
 * Validates request body, query params, or params against a Zod schema
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  target: 'json' | 'query' | 'param' = 'json'
): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      let data: unknown;

      switch (target) {
        case 'json':
          data = await c.req.json().catch(() => ({}));
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'param':
          data = c.req.param();
          break;
      }

      const validated = schema.parse(data);

      // Store validated data in context for use in handlers
      c.set(`validated_${target}`, validated);

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new ValidationError('Validation failed', details);
      }
      throw error;
    }
  };
}

/**
 * Sanitization helpers
 */
export const Sanitizers = {
  /**
   * Remove HTML tags from string
   */
  stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, '');
  },

  /**
   * Escape HTML special characters
   */
  escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
  },

  /**
   * Trim and normalize whitespace
   */
  normalizeWhitespace(str: string): string {
    return str.trim().replace(/\s+/g, ' ');
  },

  /**
   * Remove special characters (keep alphanumeric and spaces)
   */
  alphanumeric(str: string): string {
    return str.replace(/[^a-zA-Z0-9\s]/g, '');
  },

  /**
   * Convert to slug
   */
  toSlug(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Sanitize for SQL LIKE query (escape special characters)
   */
  sanitizeLike(str: string): string {
    return str.replace(/[%_\\]/g, '\\$&');
  },

  /**
   * Remove null bytes
   */
  removeNullBytes(str: string): string {
    return str.replace(/\0/g, '');
  },

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  },
} as const;

/**
 * Validation helpers
 */
export const Validators = {
  /**
   * Check if string is valid email
   */
  isEmail(str: string): boolean {
    return CommonSchemas.email.safeParse(str).success;
  },

  /**
   * Check if string is valid UUID
   */
  isUUID(str: string): boolean {
    return CommonSchemas.uuid.safeParse(str).success;
  },

  /**
   * Check if string is valid URL
   */
  isURL(str: string): boolean {
    return CommonSchemas.url.safeParse(str).success;
  },

  /**
   * Check if value is valid date
   */
  isDate(value: unknown): boolean {
    return CommonSchemas.date.safeParse(value).success;
  },

  /**
   * Check if string contains only alphanumeric characters
   */
  isAlphanumeric(str: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(str);
  },

  /**
   * Check if string is valid hex color
   */
  isHexColor(str: string): boolean {
    return CommonSchemas.hexColor.safeParse(str).success;
  },

  /**
   * Check if value is within range
   */
  isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  },

  /**
   * Check if array has unique values
   */
  hasUniqueValues<T>(arr: T[]): boolean {
    return new Set(arr).size === arr.length;
  },

  /**
   * Check if object has required keys
   */
  hasRequiredKeys(obj: Record<string, unknown>, keys: string[]): boolean {
    return keys.every((key) => key in obj);
  },
} as const;

/**
 * Schema composition helpers
 */
export const SchemaHelpers = {
  /**
   * Make all fields optional
   */
  partial<T extends z.ZodTypeAny>(schema: T): z.ZodOptional<T> {
    return schema.optional();
  },

  /**
   * Create a schema with metadata
   */
  withMeta<T extends z.ZodTypeAny>(
    schema: T,
    meta: Record<string, unknown>
  ): T {
    return schema.describe(JSON.stringify(meta));
  },

  /**
   * Create enum from array
   */
  enumFromArray<T extends string>(arr: readonly T[]): z.ZodEnum<[T, ...T[]]> {
    return z.enum(arr as [T, ...T[]]);
  },

  /**
   * Create discriminated union
   */
  discriminatedUnion<T extends string, U extends z.ZodDiscriminatedUnionOption<T>[]>(
    discriminator: T,
    options: U
  ): z.ZodDiscriminatedUnion<T, U> {
    return z.discriminatedUnion(discriminator, options);
  },
} as const;

/**
 * Get validated data from Hono context
 */
export function getValidated<T>(
  c: Context,
  target: 'json' | 'query' | 'param' = 'json'
): T {
  return c.get(`validated_${target}`) as T;
}
