# Create New Service Skill

Scaffold a new Hono microservice in the monorepo.

## Usage

When a user needs a new backend service, use this skill to:
1. Create the service directory structure
2. Set up package.json with correct configuration
3. Create Hono app boilerplate
4. Configure build tools (tsup)
5. Add to Turborepo pipeline

## Service Creation Workflow

### Step 1: Create Directory Structure

```bash
mkdir -p services/<service-name>/src/{routes,handlers,middleware,utils}
cd services/<service-name>
```

### Step 2: Create package.json

```json
{
  "name": "@aah/service-<service-name>",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs",
    "dev": "tsup src/index.ts --format esm,cjs --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "hono": "^3.11.7",
    "@aah/database": "workspace:*",
    "@aah/api-utils": "workspace:*",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3"
  }
}
```

**CRITICAL:** Do NOT add `--dts` flag to build script!

### Step 3: Create tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Create Hono App Entry Point

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handle } from 'hono/vercel';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error';

export const runtime = 'edge'; // or 'nodejs' if needed

const app = new Hono().basePath('/api/v1/<service-name>');

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000'],
  credentials: true,
}));

// Routes
app.route('/health', healthRouter);

// Error handling
app.onError(errorHandler);

// Export for Vercel
export default handle(app);
```

### Step 5: Create Health Route

```typescript
// src/routes/health.ts
import { Hono } from 'hono';

const health = new Hono();

health.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: '<service-name>',
    timestamp: new Date().toISOString(),
  });
});

export { health as healthRouter };
```

### Step 6: Create Auth Middleware

```typescript
// src/middleware/auth.ts
import { Context, Next } from 'hono';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Add your token verification logic
    // Example: await verifyClerkToken(token);
    c.set('userId', 'user-id-from-token');
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
```

### Step 7: Create Error Handler

```typescript
// src/middleware/error.ts
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export function errorHandler(err: Error, c: Context) {
  console.error('Service error:', err);

  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  return c.json({ error: 'Internal server error' }, 500);
}
```

### Step 8: Add Example Route Handler

```typescript
// src/handlers/example.ts
import { Context } from 'hono';
import { prisma } from '@aah/database';
import { z } from 'zod';

const exampleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function createExampleHandler(c: Context) {
  try {
    const body = await c.req.json();
    const data = exampleSchema.parse(body);

    // Your business logic here
    const result = await prisma.yourModel.create({
      data,
    });

    return c.json({ result }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors,
      }, 400);
    }
    throw error;
  }
}
```

### Step 9: Install Dependencies

```bash
cd services/<service-name>
pnpm install
```

### Step 10: Add to Root package.json Scripts

Edit root `package.json` to add dev script:

```json
{
  "scripts": {
    "dev:<service-name>": "pnpm --filter @aah/service-<service-name> dev",
    "build:<service-name>": "pnpm --filter @aah/service-<service-name> build"
  }
}
```

### Step 11: Add to Turborepo (if needed)

The service should automatically be picked up by Turborepo. Verify:

```bash
# Check that it appears in workspace list
pnpm list -r --depth -1
```

### Step 12: Build and Test

```bash
# Build service
pnpm run build --filter @aah/service-<service-name>

# Type check
pnpm run type-check --filter @aah/service-<service-name>

# Run dev
pnpm run dev:<service-name>
```

## Complete File Structure

After completion, you should have:

```
services/<service-name>/
├── src/
│   ├── index.ts                    # Hono app entry
│   ├── routes/
│   │   ├── health.ts               # Health check
│   │   └── <resource>.ts           # Resource routes
│   ├── handlers/
│   │   └── example.ts              # Business logic
│   ├── middleware/
│   │   ├── auth.ts                 # Authentication
│   │   └── error.ts                # Error handling
│   └── utils/
│       └── validation.ts           # Shared utilities
├── package.json
├── tsconfig.json
└── .gitignore
```

## External Dependencies Configuration

If your service uses AI SDK or other problematic dependencies:

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --external @ai-sdk/openai --external @ai-sdk/anthropic"
  }
}
```

Or in `tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  external: ['@ai-sdk/openai', '@ai-sdk/anthropic', 'isomorphic-fetch'],
  clean: true,
});
```

## Vercel Deployment (Optional)

Create `vercel.json` in root if needed:

```json
{
  "rewrites": [
    {
      "source": "/api/v1/<service-name>/:path*",
      "destination": "/services/<service-name>"
    }
  ]
}
```

## Testing the Service

```bash
# Health check
curl http://localhost:3000/api/v1/<service-name>/health

# Example authenticated request
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/<service-name>/endpoint
```

## Checklist

After creating the service:

- [ ] Directory structure created
- [ ] package.json configured (NO --dts flag)
- [ ] tsconfig.json created
- [ ] Hono app entry point created
- [ ] Health route implemented
- [ ] Auth middleware added
- [ ] Error handler added
- [ ] Dependencies installed
- [ ] Build script works
- [ ] Type check passes
- [ ] Service listed in pnpm workspace
- [ ] Dev script added to root package.json
- [ ] Can import from @aah/database
- [ ] Can import from @aah/api-utils

Remember: Services are serverless, stateless, and should NOT generate TypeScript declarations!
