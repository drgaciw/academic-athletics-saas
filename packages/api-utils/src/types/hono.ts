declare module 'hono' {
  interface ContextVariableMap {
    validated_json: unknown
    validated_query: unknown
    validated_param: unknown
  }
}

export {}
