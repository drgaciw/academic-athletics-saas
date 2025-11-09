# Quick Command Reference

## Installation & Setup

```bash
# Install all dependencies
pnpm install

# Install for specific workspace
pnpm --filter @aah/ai install
pnpm --filter @aah/service-ai install
```

## Development

```bash
# Start all services in dev mode
turbo run dev

# Start specific service
pnpm --filter @aah/service-ai dev
pnpm --filter main dev

# Start AI service only
cd services/ai && pnpm dev
```

## Building

```bash
# Build all packages
turbo run build

# Build specific package
turbo run build --filter=@aah/ai
turbo run build --filter=@aah/service-ai

# Build with dependencies
turbo run build --filter=@aah/service-ai...
```

## Type Checking

```bash
# Type check all packages
turbo run type-check

# Type check specific package
pnpm --filter @aah/ai type-check
pnpm --filter @aah/service-ai type-check
```

## Testing

```bash
# Run all tests
turbo run test

# Run tests for AI package
pnpm --filter @aah/ai test

# Run tests with coverage
turbo run test -- --coverage
```

## Linting

```bash
# Lint all packages
turbo run lint

# Lint specific package
pnpm --filter @aah/ai lint

# Lint and fix
turbo run lint -- --fix
```

## Cleaning

```bash
# Clean all build artifacts
turbo run clean

# Clean node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clean specific package
pnpm --filter @aah/ai clean
```

## Database (Prisma)

```bash
# Generate Prisma client
pnpm --filter @aah/database prisma generate

# Run migrations
pnpm --filter @aah/database prisma migrate dev

# Open Prisma Studio
pnpm --filter @aah/database prisma studio

# Reset database (WARNING: deletes all data)
pnpm --filter @aah/database prisma migrate reset
```

## Deployment

```bash
# Deploy to Vercel preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

## Troubleshooting

```bash
# Clear Turbo cache
turbo run build --force

# Verify workspace structure
pnpm list --depth=0

# Check for dependency issues
pnpm why <package-name>

# Rebuild everything from scratch
rm -rf node_modules pnpm-lock.yaml .turbo
pnpm install
turbo run build
```

## AI Service Specific

```bash
# Start AI service with logs
cd services/ai
pnpm dev | pnpm exec pino-pretty

# Test AI service health
curl http://localhost:3007/health

# Test AI chat endpoint
curl -X POST http://localhost:3007/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test"}'
```

## Environment Management

```bash
# Copy example env files
cp .env.example .env
cp services/ai/.env.example services/ai/.env

# Validate environment variables
pnpm --filter @aah/service-ai run validate-env
```

## Monitoring (Langfuse)

```bash
# Check Langfuse connection
curl -X GET https://cloud.langfuse.com/api/public/health \
  -H "Authorization: Bearer $LANGFUSE_PUBLIC_KEY"

# View traces locally (if self-hosted)
docker-compose up langfuse
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/ai-agents-task-1.2

# Commit changes
git add .
git commit -m "feat(ai): implement base agent types (task 1.2)"

# Push and create PR
git push origin feature/ai-agents-task-1.2
```

## Useful Aliases (add to ~/.bashrc or ~/.zshrc)

```bash
# Turborepo shortcuts
alias tb='turbo run build'
alias td='turbo run dev'
alias tt='turbo run test'
alias tc='turbo run type-check'

# PNPM shortcuts
alias pi='pnpm install'
alias pd='pnpm dev'
alias pb='pnpm build'

# AI service shortcuts
alias ai-dev='pnpm --filter @aah/service-ai dev'
alias ai-build='pnpm --filter @aah/service-ai build'
alias ai-test='pnpm --filter @aah/service-ai test'
```
