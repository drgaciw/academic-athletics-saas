import { Context, MiddlewareHandler } from 'hono'
import { ZodSchema, ZodError } from 'zod'

export const validateRequest = (schema: ZodSchema): MiddlewareHandler => {
  return async (c: Context, next) => {
    try {
      const body = await c.req.json()
      const validated = schema.parse(body)

      // Store validated data in context
      c.set('validatedData', validated)

      await next()
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
            timestamp: new Date().toISOString(),
            requestId: c.req.header('x-request-id') || crypto.randomUUID(),
          },
        }, 400)
      }

      return c.json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid request format',
          timestamp: new Date().toISOString(),
          requestId: c.req.header('x-request-id') || crypto.randomUUID(),
        },
      }, 400)
    }
  }
}

// Extend Hono's Context to include validated data
declare module 'hono' {
  interface ContextVariableMap {
    validatedData: any
  }
}
