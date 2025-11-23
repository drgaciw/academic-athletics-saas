# Dependency Update - Quick Commands

**Status**: Ready to execute  
**Time Required**: ~5 minutes

## Step 1: Install Dependencies

```bash
# From project root
pnpm install
```

**Expected**: Lockfile updated, all dependencies installed

## Step 2: Verify Build

```bash
# Build all packages and services
turbo run build
```

**Expected**: All 7 services + packages build successfully

## Step 3: Type Check

```bash
# Type check entire monorepo
turbo run type-check
```

**Expected**: No type errors

## Step 4: Start Services (Optional)

```bash
# Start all services in development mode
turbo run dev
```

**Expected**: All services start on their respective ports

## Verification Commands

```bash
# Check Hono version in all services
pnpm list hono

# Check workspace dependencies
pnpm list | grep "workspace:"

# Verify specific service
pnpm --filter @aah/service-user build
pnpm --filter @aah/service-user type-check
```

## What Changed?

### All 7 Services Updated:
- ✅ Hono: `^3.11.0` → `^4.0.0`
- ✅ Dependencies: `"*"` → `"workspace:*"`
- ✅ Added: `@aah/api-utils`, `@aah/config`
- ✅ Added: Jest testing infrastructure
- ✅ Added: Package metadata (description, keywords, engines)

### Services:
- services/user
- services/ai
- services/advising
- services/compliance
- services/integration
- services/monitoring
- services/support

### Packages:
- packages/api-utils

## Troubleshooting

### Issue: "Cannot find module '@aah/api-utils'"

```bash
# Rebuild packages first
turbo run build --filter=@aah/api-utils
turbo run build --filter=@aah/config
pnpm install
```

### Issue: Type errors after update

```bash
# Clear cache and rebuild
rm -rf .turbo node_modules
pnpm install
turbo run build
```

### Issue: Service won't start

```bash
# Check specific service
cd services/[service-name]
pnpm install
pnpm build
pnpm dev
```

## Next Steps (Optional)

### Add Jest Configuration

Create `jest.config.js` in each service:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
}
```

### Create Initial Tests

```bash
# Example for user service
mkdir -p services/user/src/__tests__
touch services/user/src/__tests__/routes.test.ts
```

## Documentation

- **Detailed Plan**: `.kiro/specs/microservices-architecture/DEPENDENCY_STANDARDIZATION.md`
- **Summary**: `.kiro/specs/microservices-architecture/DEPENDENCY_STANDARDIZATION_SUMMARY.md`

## Questions?

Check the detailed documentation or run:

```bash
# Verify everything is working
turbo run build && turbo run type-check && echo "✅ All good!"
```

---

**Ready to proceed?** Run the commands above in order.
