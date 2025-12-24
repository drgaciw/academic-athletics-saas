# Add Workspace Package Skill

Add a new dependency to a specific workspace in the pnpm monorepo.

## Usage

When a user asks to add a package/dependency to an app or service, use this skill to:
1. Identify the correct workspace
2. Add the package with proper flags
3. Verify installation
4. Rebuild if necessary

## Commands

### Add to Specific Workspace

```bash
# Add to an app
pnpm add <package> --filter @aah/main
pnpm add <package> --filter @aah/student
pnpm add <package> --filter @aah/admin

# Add to a service
pnpm add <package> --filter @aah/service-user
pnpm add <package> --filter @aah/service-compliance

# Add to a shared package
pnpm add <package> --filter @aah/database
pnpm add <package> --filter @aah/ui
pnpm add <package> --filter @aah/auth
```

### Add Dev Dependencies

```bash
# Add to specific workspace
pnpm add -D <package> --filter @aah/main

# Add to root (affects all workspaces)
pnpm add -D <package> -w
```

### Add Workspace Dependencies

```bash
# Link to another workspace package
pnpm add @aah/database --filter @aah/service-user
pnpm add @aah/ui --filter @aah/main
```

## Workflow

1. **Identify the workspace:**
   - Apps: `@aah/main`, `@aah/student`, `@aah/admin`
   - Services: `@aah/service-{user,advising,compliance,ai,support,monitoring,integration}`
   - Packages: `@aah/{database,ui,auth,ai,api-utils,ai-evals}`

2. **Add the package:**
   ```bash
   pnpm add <package> --filter @aah/<workspace>
   ```

3. **Verify installation:**
   ```bash
   # Check package.json
   cat packages/<workspace>/package.json | grep <package>

   # Or for apps
   cat apps/<workspace>/package.json | grep <package>
   ```

4. **Rebuild if necessary:**
   ```bash
   # If adding to a shared package
   pnpm run build --filter @aah/<workspace>

   # Then rebuild dependents
   pnpm run build
   ```

## Examples

### Example 1: Add Zod to Main App
```bash
pnpm add zod --filter @aah/main
```

### Example 2: Add React Query to All Apps
```bash
pnpm add @tanstack/react-query --filter @aah/main
pnpm add @tanstack/react-query --filter @aah/student
pnpm add @tanstack/react-query --filter @aah/admin
```

### Example 3: Add TypeScript Types (Dev)
```bash
pnpm add -D @types/node --filter @aah/service-user
```

### Example 4: Add Shared Database Package to Service
```bash
# This creates workspace:* reference
pnpm add @aah/database --filter @aah/service-advising
```

### Example 5: Add Global Dev Tool
```bash
# Adds to root package.json
pnpm add -D prettier -w
```

## Common Packages by Workspace Type

### Apps (Next.js)
- `@tanstack/react-query` - Data fetching
- `zod` - Validation
- `date-fns` - Date utilities
- `lucide-react` - Icons
- `recharts` - Charts

### Services (Hono)
- `zod` - Validation
- `hono` - Framework
- `@hono/zod-validator` - Validation middleware

### UI Package
- `@radix-ui/*` - Primitives
- `class-variance-authority` - Variants
- `lucide-react` - Icons

## After Adding Packages

### If Added to Shared Package (`@aah/ui`, `@aah/database`, etc.):
```bash
# Rebuild the package
pnpm run build --filter @aah/<package>

# Rebuild consuming apps/services
pnpm run build

# Type check
pnpm run type-check
```

### If Added to App/Service:
```bash
# Usually just restart dev server
pnpm run dev:main

# Or rebuild if needed
pnpm run build:main
```

## Troubleshooting

### Lockfile Issues
```bash
pnpm install --no-frozen-lockfile
```

### Package Not Found After Install
```bash
# Reinstall
pnpm install

# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Workspace Protocol Not Working
```bash
# Check that the workspace package exists
ls packages/<package-name>

# Check that it's properly exported
cat packages/<package-name>/package.json
```

## Output

After adding a package, confirm:
1. ✅ Package added to correct workspace's package.json
2. ✅ pnpm-lock.yaml updated
3. ✅ Package available for import
4. ✅ Type checking passes
5. ✅ Rebuild successful (if shared package)

Remember: Always use `pnpm`, never `npm` or `yarn`!
