# Deployment Guide - Athletic Academics Hub

This guide covers deploying the Athletic Academics Hub microservices platform to Vercel.

## 🎯 Overview

The AAH platform uses Vercel's multi-zone architecture to deploy multiple microservices under a single domain. Each service is deployed as Vercel Serverless Functions with automatic scaling.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are configured in Vercel:

#### Database
- `DATABASE_URL` - Vercel Postgres connection string
- `DATABASE_POOL_MIN` - Minimum connection pool size (default: 2)
- `DATABASE_POOL_MAX` - Maximum connection pool size (default: 10)

#### Authentication
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Clerk webhook secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `JWT_SECRET` - JWT signing secret (32+ characters)

#### AI Services
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `LANGFUSE_PUBLIC_KEY` - Langfuse public key (optional)
- `LANGFUSE_SECRET_KEY` - Langfuse secret key (optional)

#### External Services
- `RESEND_API_KEY` - Resend email API key
- `PUSHER_APP_ID` - Pusher app ID
- `PUSHER_KEY` - Pusher key
- `PUSHER_SECRET` - Pusher secret
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

#### Security
- `ENCRYPTION_KEY` - 32-character encryption key
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `SENTRY_DSN` - Sentry error tracking DSN

### 2. Database Setup

```bash
# Generate Prisma client
cd packages/database
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### 3. Build Verification

```bash
# Test build locally
pnpm build

# Verify all services build successfully
turbo run build --filter=services/*
```

## 🚀 Deployment Steps

### Step 1: Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### Step 2: Configure Project Settings

In the Vercel dashboard:

1. **Framework Preset**: Other
2. **Build Command**: `turbo run build`
3. **Output Directory**: Leave empty (multi-zone)
4. **Install Command**: `pnpm install`
5. **Development Command**: `turbo run dev --parallel`

### Step 3: Set Environment Variables

```bash
# Set environment variables via CLI
vercel env add DATABASE_URL production
vercel env add CLERK_SECRET_KEY production
vercel env add OPENAI_API_KEY production
# ... add all required variables

# Or import from .env file
vercel env pull .env.production
```

### Step 4: Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🔧 Multi-Zone Configuration

The `vercel.json` file configures routing for microservices:

```json
{
  "rewrites": [
    {
      "source": "/api/user/:path*",
      "destination": "/api/services/user/:path*"
    },
    {
      "source": "/api/advising/:path*",
      "destination": "/api/services/advising/:path*"
    }
    // ... other services
  ]
}
```

### Service Endpoints

After deployment, services are available at:

- `https://yourdomain.com/api/user/*` - User Service
- `https://yourdomain.com/api/advising/*` - Advising Service
- `https://yourdomain.com/api/compliance/*` - Compliance Service
- `https://yourdomain.com/api/monitoring/*` - Monitoring Service
- `https://yourdomain.com/api/support/*` - Support Service
- `https://yourdomain.com/api/integration/*` - Integration Service
- `https://yourdomain.com/api/ai/*` - AI Service

## 📊 Monitoring

### Vercel Analytics

Enable Vercel Analytics in the dashboard:
1. Go to Analytics tab
2. Enable Web Analytics
3. Enable Speed Insights

### Sentry Integration

Configure Sentry for error tracking:

```bash
# Install Sentry CLI
npm i -g @sentry/cli

# Login to Sentry
sentry-cli login

# Create release
sentry-cli releases new <version>
sentry-cli releases finalize <version>
```

### Langfuse (AI Observability)

Configure Langfuse for AI monitoring:
1. Create project at https://cloud.langfuse.com
2. Add API keys to Vercel environment variables
3. AI Service will automatically log to Langfuse

## 🔄 Continuous Deployment

### GitHub Integration

1. **Connect Repository**
   - Go to Vercel dashboard
   - Import Git Repository
   - Select your repository

2. **Configure Branches**
   - Production: `main` branch
   - Preview: All other branches

3. **Automatic Deployments**
   - Push to `main` → Production deployment
   - Push to feature branch → Preview deployment
   - Pull request → Preview deployment with comment

### Deployment Hooks

Configure webhooks for external triggers:

```bash
# Create deployment hook
vercel env add DEPLOY_HOOK production

# Trigger deployment
curl -X POST https://api.vercel.com/v1/integrations/deploy/...
```

## 🔐 Security Best Practices

### 1. Environment Variables

- Never commit `.env` files
- Use Vercel's encrypted environment variables
- Rotate secrets regularly
- Use different keys for production/preview

### 2. CORS Configuration

Configure CORS in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://yourdomain.com"
        }
      ]
    }
  ]
}
```

### 3. Rate Limiting

Implement rate limiting in each service:

```typescript
import { rateLimiter } from '@aah/api-utils/rateLimit'

app.use('*', rateLimiter({
  windowMs: 60000,
  max: 100
}))
```

## 🐛 Troubleshooting

### Build Failures

```bash
# Check build logs
vercel logs <deployment-url>

# Test build locally
pnpm build

# Clear Turborepo cache
turbo run build --force
```

### Runtime Errors

```bash
# View function logs
vercel logs --follow

# Check Sentry for errors
# Visit Sentry dashboard

# Verify environment variables
vercel env ls
```

### Database Connection Issues

```bash
# Test database connection
cd packages/database
pnpm db:studio

# Verify DATABASE_URL
vercel env get DATABASE_URL

# Check connection pool settings
# Increase DATABASE_POOL_MAX if needed
```

## 📈 Performance Optimization

### 1. Edge Functions

Move authentication middleware to edge:

```typescript
// middleware.ts
export const config = {
  runtime: 'edge',
}
```

### 2. Caching

Configure caching headers:

```typescript
c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
```

### 3. Database Optimization

- Use connection pooling
- Add database indexes
- Implement query caching
- Use read replicas for analytics

### 4. AI Service Optimization

- Cache common AI responses
- Use streaming for better UX
- Implement token usage limits
- Monitor costs with Langfuse

## 🔄 Rollback Procedures

### Instant Rollback

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### Database Rollback

```bash
# Revert migration
cd packages/database
pnpm db:migrate down

# Or restore from backup
# (Vercel Postgres automatic backups)
```

## 📞 Support

### Vercel Support

- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support
- Status: https://vercel-status.com

### Internal Support

- Technical Lead: [Contact]
- DevOps Team: [Contact]
- On-Call: [PagerDuty/Slack]

## 📝 Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Build passes locally
- [ ] Tests pass
- [ ] Sentry configured
- [ ] Analytics enabled
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Monitoring dashboards set up
- [ ] Rollback procedure tested
- [ ] Team notified of deployment
- [ ] Documentation updated

## 🎉 Post-Deployment

1. **Verify Services**
   ```bash
   # Test each service endpoint
   curl https://yourdomain.com/api/user/health
   curl https://yourdomain.com/api/compliance/health
   # ... test all services
   ```

2. **Monitor Metrics**
   - Check Vercel Analytics
   - Monitor Sentry for errors
   - Review Langfuse AI metrics
   - Check database performance

3. **Smoke Tests**
   - Test critical user flows
   - Verify authentication
   - Test AI chat functionality
   - Check compliance calculations

4. **Team Communication**
   - Notify team of successful deployment
   - Share deployment notes
   - Update status page if applicable
