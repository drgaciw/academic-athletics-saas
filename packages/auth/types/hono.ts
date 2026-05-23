import type { UserContext } from './index'

declare module 'hono' {
  interface ContextVariableMap {
    correlationId: string
    requestId: string
    user: UserContext
    userId: string
    userRole: string
  }
}

export {}
