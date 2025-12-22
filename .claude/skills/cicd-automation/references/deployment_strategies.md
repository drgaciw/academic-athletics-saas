# Deployment Strategies

## Blue/Green Deployments

### Concept

Maintain two identical production environments (Blue and Green). Route traffic to one while the other is idle, then swap when deploying.

**Benefits:**
- Zero downtime
- Instant rollback
- Full environment testing

**Trade-offs:**
- Requires double infrastructure
- Database migrations complexity
- Stateful service challenges

### Implementation with Vercel

```yaml
name: Blue/Green Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-green:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Green environment
        run: |
          vercel --token ${{ secrets.VERCEL_TOKEN }} \
            --env GREEN \
            --prod=false \
            --output green-url.txt

      - name: Run health checks on Green
        run: |
          GREEN_URL=$(cat green-url.txt)
          ./scripts/health-check.sh $GREEN_URL

      - name: Run smoke tests
        run: |
          GREEN_URL=$(cat green-url.txt)
          pnpm test:e2e --base-url=$GREEN_URL

      - name: Switch traffic to Green
        if: success()
        run: |
          # Update Vercel alias to point to Green deployment
          vercel alias set $(cat green-url.txt) myapp.com \
            --token ${{ secrets.VERCEL_TOKEN }}

      - name: Mark Blue as idle
        run: |
          echo "Blue environment now idle, ready for next deployment"
```

### Kubernetes Blue/Green

```yaml
# blue-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
  labels:
    app: myapp
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
      - name: myapp
        image: myapp:v1.0.0
        ports:
        - containerPort: 8080

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
    version: blue  # Switch to green when deploying
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

**Deploy and Switch:**

```bash
# Deploy green
kubectl apply -f green-deployment.yaml

# Wait for green to be ready
kubectl rollout status deployment/myapp-green

# Run validation
kubectl run test-pod --rm -i --tty --image=busybox -- \
  wget -O- http://myapp-green:8080/health

# Switch service to green
kubectl patch service myapp-service -p '{"spec":{"selector":{"version":"green"}}}'

# Cleanup blue
kubectl delete deployment myapp-blue
```

## Canary Deployments

### Concept

Gradually roll out changes to a small subset of users before full deployment.

**Benefits:**
- Lower risk
- Real user feedback
- Progressive rollout
- Easy rollback

**Trade-offs:**
- More complex routing
- Longer deployment time
- Requires monitoring
- Version compatibility needed

### Percentage-Based Canary

```yaml
name: Canary Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-canary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy canary (10% traffic)
        run: |
          vercel --token ${{ secrets.VERCEL_TOKEN }} \
            --target production \
            --split 10

      - name: Monitor canary for 10 minutes
        run: |
          sleep 600
          # Check error rates
          ./scripts/monitor-errors.sh canary

      - name: Increase to 50%
        if: success()
        run: |
          vercel --token ${{ secrets.VERCEL_TOKEN }} \
            --target production \
            --split 50

      - name: Monitor 50% for 10 minutes
        run: |
          sleep 600
          ./scripts/monitor-errors.sh canary

      - name: Full rollout (100%)
        if: success()
        run: |
          vercel --token ${{ secrets.VERCEL_TOKEN }} \
            --target production \
            --split 100

      - name: Rollback on failure
        if: failure()
        run: |
          vercel rollback --token ${{ secrets.VERCEL_TOKEN }}
```

### Kubernetes Canary with Flagger

```yaml
# canary.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  service:
    port: 8080
  analysis:
    interval: 1m
    threshold: 10
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
    - name: request-duration
      thresholdRange:
        max: 500
  webhooks:
    - name: smoke-tests
      url: http://flagger-loadtester/
      timeout: 5s
      metadata:
        type: bash
        cmd: "curl -s http://myapp-canary:8080/health | grep OK"
```

**Deployment Flow:**

```bash
# Update image version
kubectl set image deployment/myapp myapp=myapp:v2.0.0

# Flagger automatically:
# 1. Creates canary deployment
# 2. Gradually shifts traffic (10%, 20%, 30%, ...)
# 3. Monitors metrics at each step
# 4. Rolls back if metrics fail
# 5. Promotes to production if successful
```

## Rolling Updates

### Concept

Gradually replace old instances with new ones without downtime.

**Benefits:**
- Zero downtime
- Simple implementation
- Built into most platforms

**Trade-offs:**
- Multiple versions running simultaneously
- Slower rollouts
- Complex rollbacks

### Kubernetes Rolling Update

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2        # Max pods above desired during update
      maxUnavailable: 1   # Max pods unavailable during update
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:v2.0.0
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
```

**Deploy:**

```bash
# Apply new version
kubectl apply -f deployment.yaml

# Watch rollout
kubectl rollout status deployment/myapp

# Pause rollout if issues detected
kubectl rollout pause deployment/myapp

# Resume or undo
kubectl rollout resume deployment/myapp
kubectl rollout undo deployment/myapp
```

### Vercel Rolling Deployment

```yaml
name: Rolling Deploy

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        region: [sfo1, iad1, cdg1]
      max-parallel: 1  # Deploy one region at a time
    steps:
      - name: Deploy to ${{ matrix.region }}
        run: |
          vercel --token ${{ secrets.VERCEL_TOKEN }} \
            --prod \
            --region ${{ matrix.region }}

      - name: Health check ${{ matrix.region }}
        run: |
          ./scripts/health-check.sh \
            --region ${{ matrix.region }} \
            --timeout 300

      - name: Monitor for 5 minutes
        run: sleep 300

      - name: Rollback region on failure
        if: failure()
        run: |
          vercel rollback ${{ matrix.region }} \
            --token ${{ secrets.VERCEL_TOKEN }}
```

## Feature Flags

### Concept

Deploy code to production but control feature activation through configuration.

**Benefits:**
- Decouple deployment from release
- Gradual rollout control
- A/B testing support
- Quick feature toggles

**Trade-offs:**
- Code complexity
- Technical debt if not cleaned up
- Requires feature flag service

### Implementation

**LaunchDarkly Integration:**

```typescript
// lib/feature-flags.ts
import { LDClient, init } from '@launchdarkly/node-server-sdk';

export class FeatureFlags {
  private client: LDClient;

  async initialize() {
    this.client = init(process.env.LAUNCHDARKLY_SDK_KEY!);
    await this.client.waitForInitialization();
  }

  async isEnabled(flag: string, user: { key: string; email?: string }) {
    return await this.client.variation(flag, user, false);
  }

  async getVariant(flag: string, user: { key: string }) {
    return await this.client.variation(flag, user, 'control');
  }
}
```

**Usage:**

```typescript
// API route with feature flag
export async function POST(request: Request) {
  const user = await auth();
  const flags = new FeatureFlags();
  await flags.initialize();

  // Check feature flag
  const useNewAIModel = await flags.isEnabled('use-claude-opus-4-5', {
    key: user.id,
    email: user.email
  });

  if (useNewAIModel) {
    return processWithClaudeOpus45(request);
  } else {
    return processWithClaudeSonnet(request);
  }
}
```

**Gradual Rollout:**

```yaml
# .github/workflows/feature-rollout.yml
name: Gradual Feature Rollout

on:
  workflow_dispatch:
    inputs:
      feature:
        description: 'Feature flag name'
        required: true
      percentage:
        description: 'Rollout percentage'
        required: true
        default: '10'

jobs:
  update-flag:
    runs-on: ubuntu-latest
    steps:
      - name: Update feature flag
        run: |
          curl -X PATCH \
            -H "Authorization: ${{ secrets.LAUNCHDARKLY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "instructions": [{
                "kind": "updateFallthroughVariationOrRollout",
                "rolloutWeights": {
                  "true": ${{ github.event.inputs.percentage }},
                  "false": ${{ 100 - github.event.inputs.percentage }}
                }
              }]
            }' \
            "https://app.launchdarkly.com/api/v2/flags/default/${{ github.event.inputs.feature }}"

      - name: Monitor metrics
        run: |
          # Monitor error rates for 10 minutes
          for i in {1..10}; do
            ./scripts/check-metrics.sh ${{ github.event.inputs.feature }}
            sleep 60
          done

      - name: Rollback on failure
        if: failure()
        run: |
          # Set feature to 0%
          curl -X PATCH \
            -H "Authorization: ${{ secrets.LAUNCHDARKLY_TOKEN }}" \
            -d '{"instructions": [{"kind": "turnFlagOff"}]}' \
            "https://app.launchdarkly.com/api/v2/flags/default/${{ github.event.inputs.feature }}"
```

## A/B Testing

### Concept

Deploy multiple versions simultaneously and compare metrics to determine best variant.

**Benefits:**
- Data-driven decisions
- Reduced risk
- Optimization insights
- User segmentation

**Trade-offs:**
- Requires traffic splitting
- Statistical significance needed
- Longer feedback cycles
- Complex analysis

### Vercel A/B Testing

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get or set variant cookie
  let variant = request.cookies.get('ab-variant')?.value;

  if (!variant) {
    // Randomly assign variant (50/50 split)
    variant = Math.random() < 0.5 ? 'a' : 'b';
    response.cookies.set('ab-variant', variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Add header for variant
  response.headers.set('x-ab-variant', variant);

  return response;
}

export const config = {
  matcher: '/checkout/:path*',
};
```

**Variant Components:**

```typescript
// components/CheckoutButton.tsx
'use client';

import { useHeaders } from 'next/headers';

export default function CheckoutButton() {
  const variant = headers().get('x-ab-variant');

  if (variant === 'b') {
    // Variant B: New design
    return (
      <button className="bg-green-500 text-white px-6 py-3 rounded-full">
        Complete Purchase
      </button>
    );
  }

  // Variant A: Control
  return (
    <button className="bg-blue-500 text-white px-4 py-2 rounded">
      Checkout
    </button>
  );
}
```

**Analytics:**

```typescript
// lib/analytics.ts
export function trackConversion(variant: string, value: number) {
  // Send to analytics service
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: 'conversion',
      variant,
      value,
      timestamp: Date.now(),
    }),
  });
}
```

## Zero-Downtime Deployments

### Requirements

1. **Health Checks**
   - Readiness probes
   - Liveness probes
   - Startup probes

2. **Graceful Shutdown**
   - Handle SIGTERM
   - Drain connections
   - Complete in-flight requests

3. **Rolling Restarts**
   - Update instances one at a time
   - Wait for health checks
   - Monitor error rates

### Implementation

**Health Check Endpoint:**

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs(),
  ]);

  const healthy = checks.every(check => check.healthy);

  return Response.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { service: 'database', healthy: true };
  } catch (error) {
    return { service: 'database', healthy: false, error: error.message };
  }
}
```

**Graceful Shutdown:**

```typescript
// server.ts
import { createServer } from 'http';

const server = createServer(app);

let isShuttingDown = false;

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('Received shutdown signal, closing server gracefully...');

  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');

    // Close database connections
    await prisma.$disconnect();

    // Close Redis connections
    await redis.disconnect();

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Health check returns unhealthy during shutdown
app.get('/health', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: 'shutting down' });
  }
  res.json({ status: 'healthy' });
});
```

## Academic Athletics Hub Deployment Strategy

### Recommended Approach

**Production:** Blue/Green with Feature Flags
- Deploy to green environment
- Run AI evaluations on green
- Use feature flags for gradual rollout
- Monitor FERPA compliance
- Full rollback capability

**Preview/Staging:** Rolling Updates
- Deploy to Vercel preview
- Run integration tests
- Validate AI performance
- Check data security

### Implementation

```yaml
name: AAH Production Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-green:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/setup-monorepo

      - name: Run pre-deployment checks
        run: |
          pnpm run type-check
          pnpm run lint
          pnpm run test

      - name: Run AI evaluations
        run: pnpm eval run --dataset all
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Deploy to green environment
        run: |
          vercel --token ${{ secrets.VERCEL_TOKEN }} \
            --env GREEN \
            --build-env DATABASE_URL=${{ secrets.DATABASE_URL }} \
            --build-env CLERK_SECRET_KEY=${{ secrets.CLERK_SECRET_KEY }}

      - name: Run smoke tests on green
        run: pnpm test:e2e --base-url=$GREEN_URL

      - name: Check FERPA compliance
        run: ./scripts/check-ferpa-compliance.sh

      - name: Gradual rollout (10% -> 100%)
        run: |
          # Start at 10%
          ./scripts/traffic-split.sh 10
          sleep 600  # Monitor for 10 min

          # Increase to 50%
          ./scripts/traffic-split.sh 50
          sleep 600

          # Full rollout
          ./scripts/traffic-split.sh 100

      - name: Rollback on failure
        if: failure()
        run: |
          ./scripts/traffic-split.sh 0
          vercel rollback
```
