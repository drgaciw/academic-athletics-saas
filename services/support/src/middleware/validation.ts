import { Context, MiddlewareHandler, Next } from 'hono'
import { z, ZodSchema } from 'zod'
import { AppError } from './errorHandler'

export const validateRequest = (schema: ZodSchema): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json()
      const validatedData = schema.parse(body)
      c.set('validatedData', validatedData)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid request data',
          error.errors
        )
      }
      throw error
    }
  }
}

export const validateQuery = (schema: ZodSchema): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query()
      const validatedData = schema.parse(query)
      c.set('validatedQuery', validatedData)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid query parameters',
          error.errors
        )
      }
      throw error
    }
  }
}
