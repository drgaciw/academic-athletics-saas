# Prisma Connection Pooling Configuration

## Overview

Connection pooling is configured for optimal performance in the AI evaluation framework. Prisma uses connection pooling by default when using Vercel Postgres or other hosted database providers.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Database connection with pooling
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=20"

# For Vercel Postgres (recommended for production)
# Vercel automatically provides connection pooling
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..." # For migrations
```

### Connection Pool Settings

#### Development
```env
# Smaller pool for local development
DATABASE_URL="postgresql://localhost:5432/aah_dev?connection_limit=5&pool_timeout=10"
```

#### Production (Vercel Postgres)
```env
# Vercel handles pooling automatically
# Default limits:
# - connection_limit: 10 connections per instance
# - pool_timeout: 20 seconds
POSTGRES_PRISMA_URL="postgres://..."
```

### Prisma Client Configuration

The Prisma Client is configured in `packages/database/index.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool is managed automatically
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

## Best Practices

### 1. Connection Limits

- **Development**: 5-10 connections
- **Production**: 10-20 connections per instance
- **Serverless**: Use connection pooling proxy (e.g., PgBouncer, Vercel Postgres)

### 2. Query Optimization

Use the QueryCache from the performance module:

```typescript
import { cacheManager } from '@aah/ai-evals/performance';

// Cache expensive queries
const result = cacheManager.queryCache.get('student-metrics', { studentId: '123' });
if (!result) {
  const data = await prisma.studentProfile.findMany({
    where: { studentId: '123' },
    include: { performanceMetrics: true },
  });
  cacheManager.queryCache.set('student-metrics', { studentId: '123' }, data);
  return data;
}
return result;
```

### 3. Batch Operations

Use transactions for multiple operations:

```typescript
await prisma.$transaction([
  prisma.evalRun.create({ data: runData }),
  prisma.evalResult.createMany({ data: resultsData }),
  prisma.evalMetrics.create({ data: metricsData }),
]);
```

### 4. Connection Pool Monitoring

Monitor connection usage:

```typescript
// Get active connections
const activeConnections = await prisma.$queryRaw`
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE datname = current_database()
  AND state = 'active';
`;

console.log('Active connections:', activeConnections);
```

## Serverless Optimization

For Vercel serverless functions:

1. **Use Vercel Postgres**: Built-in connection pooling
2. **Reuse Prisma Client**: Singleton pattern prevents connection exhaustion
3. **Close connections**: Not needed with Vercel Postgres (handled automatically)
4. **Use `$connect()` sparingly**: Only if needed for edge cases

```typescript
// Good: Reuse singleton
import { prisma } from '@aah/database';

export default async function handler(req, res) {
  const data = await prisma.user.findMany();
  res.json(data);
}

// Bad: Creates new client per request
export default async function handler(req, res) {
  const prisma = new PrismaClient(); // ❌ Don't do this
  const data = await prisma.user.findMany();
  res.json(data);
}
```

## Troubleshooting

### Too many connections error

```
Error: Can't reach database server at `localhost:5432`
Please make sure your database server is running
```

**Solutions**:
1. Reduce `connection_limit` in DATABASE_URL
2. Use connection pooling proxy
3. Implement connection retry logic
4. Check for connection leaks

### Slow queries

```
Query took 2000ms to execute
```

**Solutions**:
1. Add database indexes
2. Use QueryCache from performance module
3. Optimize query selects (avoid selecting all fields)
4. Use pagination for large datasets

### Connection timeout

```
Error: Connection pool timeout
```

**Solutions**:
1. Increase `pool_timeout` in DATABASE_URL
2. Reduce concurrent queries
3. Optimize slow queries
4. Scale database resources

## Performance Metrics

Track connection pool performance:

```typescript
import { performanceMonitor } from '@aah/ai-evals/performance';

performanceMonitor.start('db-query');
const result = await prisma.user.findMany();
const duration = performanceMonitor.end('db-query');

console.log(`Query executed in ${duration}ms`);
```

## Related Documentation

- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [AI Evals Performance Module](../../../packages/ai-evals/src/performance/README.md)
