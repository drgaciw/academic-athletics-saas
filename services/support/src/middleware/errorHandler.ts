import { Context, MiddlewareHandler } from 'hono'
import { ErrorResponse } from '../types'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error('Error occurred:', error)

    const requestId = c.req.header('x-request-id') || crypto.randomUUID()

    if (error instanceof AppError) {
      const response: ErrorResponse = {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId,
        },
      }
      return c.json(response, error.statusCode)
    }

    // Handle unexpected errors
    const response: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      },
    }
    return c.json(response, 500)
  }
}

export const notFoundHandler = (c: Context) => {
  const response: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
      timestamp: new Date().toISOString(),
      requestId: c.req.header('x-request-id') || crypto.randomUUID(),
    },
  }
  return c.json(response, 404)
}
