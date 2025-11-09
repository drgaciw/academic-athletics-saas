# User Service Deployment Guide

## Overview

This guide covers deploying the User Service to Vercel as a serverless function, following the microservices architecture design.

## Prerequisites

- Vercel account
- Clerk account with application configured
- Vercel Postgres database provisioned
- GitHub repository connected to Vercel

## Deployment Steps

### 1. Environment Variables

Configure these environment variables in Vercel Project Settings:

**Production:**
```env
# Database
DATABASE_URL="postgresql://..."  # Vercel Postgres connection string

# Clerk Authentication
CLERK_SECRET_KEY="sk_live_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Service Configuration
PORT=3001
NODE_ENV=production

# Frontend URL
FRONTEND_URL="https://your-domain.com"
```

**Preview (Optional):**
```env
DATABASE_URL="postgresql://..."  # Preview database
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
NODE_ENV=preview
FRONTEND_URL="https://preview.your-domain.com"
```

### 2. Vercel Configuration

Create or update `vercel.json` in the service root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/user/(.*)",
      "dest": "src/index.ts"
    },
    {
      "src": "/health",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3. Build Configuration

Update `package.json` build script if needed:

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "vercel-build": "prisma generate && npm run build"
  }
}
```

### 4. Database Migration

Run migrations before deployment:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or in CI/CD
npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma
```

### 5. Deploy to Vercel

**Option A: Automatic (via GitHub)**
1. Push code to GitHub
2. Vercel automatically detects changes
3. Builds and deploys service
4. Available at `https://your-project.vercel.app/api/user/*`

**Option B: Manual (via CLI)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 6. Configure Clerk Webhooks

After deployment:

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/user/sync-clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret
5. Add to Vercel environment variables as `CLERK_WEBHOOK_SECRET`

### 7. Test Deployment

**Health Check:**
```bash
curl https://your-domain.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "user-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "2.0.0"
}
```

**API Test:**
```bash
curl https://your-domain.vercel.app/api/user/profile/{userId} \
  -H "Authorization: Bearer {token}"
```

## Multi-Zone Configuration

To integrate with other services under a single domain:

### 1. API Gateway Configuration

In your main Next.js app (`apps/web`), configure `next.config.js`:

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/user/:path*',
        destination: 'https://user-service.vercel.app/api/user/:path*',
      },
    ]
  },
}
```

### 2. Vercel Project Settings

**User Service Project:**
- Name: `aah-user-service`
- Domain: `user-service.vercel.app` (internal)

**Main App Project:**
- Name: `aah-platform`
- Domain: `aah.vercel.app` (public)
- Rewrites to user service via configuration above

## Monitoring

### 1. Vercel Analytics

Enable in Project Settings → Analytics:
- Function execution logs
- Error tracking
- Performance metrics
- Request volume

### 2. Clerk Dashboard

Monitor webhook deliveries:
- Go to Webhooks → Your endpoint
- View delivery attempts
- Check failure reasons
- Retry failed deliveries

### 3. Database Monitoring

Use Vercel Postgres dashboard:
- Connection pool usage
- Query performance
- Database size
- Active connections

## Performance Optimization

### 1. Cold Start Optimization

Minimize cold start time:

```typescript
// Keep Prisma client warm
import { prisma } from '@aah/database'

// Initialize outside handler
const warmPrisma = async () => {
  await prisma.$connect()
}

// Call on service start
warmPrisma().catch(console.error)
```

### 2. Function Configuration

Optimize Vercel function settings:

```json
{
  "functions": {
    "src/index.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### 3. Database Connection Pooling

Configure Prisma connection pool:

```env
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
```

## Troubleshooting

### Common Issues

**1. Database Connection Errors**

Problem: `Can't reach database server`

Solution:
- Verify `DATABASE_URL` is correct
- Check Vercel Postgres is provisioned
- Ensure connection pool limits

**2. Clerk Authentication Failures**

Problem: `Invalid JWT token`

Solution:
- Verify `CLERK_SECRET_KEY` is set
- Check token is being sent in header
- Ensure Clerk app is in production mode

**3. Webhook Signature Failures**

Problem: `Invalid webhook signature`

Solution:
- Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Check webhook URL is correct
- Ensure HTTPS is being used

**4. CORS Errors**

Problem: `Access-Control-Allow-Origin header`

Solution:
- Verify `FRONTEND_URL` is set correctly
- Check CORS configuration in `src/index.ts`
- Add additional origins if needed

### Debugging

**View Function Logs:**
```bash
vercel logs {deployment-url}
```

**View Real-time Logs:**
```bash
vercel logs {deployment-url} --follow
```

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy-user-service.yml`:

```yaml
name: Deploy User Service

on:
  push:
    branches: [main]
    paths:
      - 'services/user/**'
      - 'packages/database/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install
        working-directory: services/user

      - name: Run type check
        run: npm run type-check
        working-directory: services/user

      - name: Run tests
        run: npm test
        working-directory: services/user
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: services/user
```

## Rollback

### Quick Rollback

In Vercel Dashboard:
1. Go to Deployments
2. Find previous stable deployment
3. Click menu → Promote to Production

### CLI Rollback

```bash
# List recent deployments
vercel ls

# Promote specific deployment
vercel promote {deployment-url}
```

## Scaling

### Automatic Scaling

Vercel automatically scales based on:
- Request volume
- Geographic distribution
- Resource usage

No manual intervention needed.

### Rate Limiting

Consider adding rate limiting for production:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

// In middleware
const { success } = await ratelimit.limit(userId)
if (!success) {
  return c.json({ error: 'Rate limit exceeded' }, 429)
}
```

## Security Checklist

- [ ] Environment variables set in Vercel
- [ ] `CLERK_SECRET_KEY` configured
- [ ] `CLERK_WEBHOOK_SECRET` configured
- [ ] Database connection uses SSL
- [ ] CORS origins are restricted
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting configured (if needed)
- [ ] Error messages don't leak sensitive data
- [ ] Logging excludes PII data

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check webhook delivery success rate
- Monitor function execution time

**Monthly:**
- Review database query performance
- Check dependency updates
- Analyze usage patterns

**Quarterly:**
- Security audit
- Performance optimization review
- Cost analysis

## Support

For issues:
1. Check Vercel function logs
2. Review Clerk webhook logs
3. Check database connection status
4. Contact support with deployment URL and error details
