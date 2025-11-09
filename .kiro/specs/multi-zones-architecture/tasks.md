# Implementation Plan

- [x] 1. Setup Turborepo infrastructure and workspace configuration
  - Configure turbo.json with build pipelines for all zones
  - Update root package.json with workspace scripts (dev, build, lint)
  - Create pnpm-workspace.yaml defining apps and packages
  - Configure global dependencies and cache settings
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Create shared packages structure
- [x] 2.1 Extract and setup shared UI package (@aah/ui)
  - Move existing UI components from apps/web to packages/ui
  - Create Button, Card, and base components with Tailwind CSS
  - Implement CrossZoneLink component with prefetching logic
  - Setup package.json with proper exports and dependencies
  - Configure TypeScript for component library
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.2 Create shared auth package (@aah/auth)
  - Implement authMiddleware factory function wrapping Clerk
  - Create requireRole utility for RBAC checks
  - Export auth helper functions for use across zones
  - _Requirements: 2.3, 3.2, 8.2, 8.3_

- [x] 2.3 Setup shared database package (@aah/database)
  - Move Prisma schema to packages/database
  - Create Prisma client singleton export
  - Configure package.json with Prisma scripts
  - _Requirements: 3.4, 8.1, 8.4_

- [x] 2.4 Create shared config package (@aah/config)
  - Setup shared ESLint configuration
  - Create shared TypeScript config base
  - Setup shared Tailwind config
  - _Requirements: 4.1, 4.5, 8.3_

- [x] 3. Configure Main App for Multi-Zones
- [x] 3.1 Update Main App next.config.js with rewrite rules
  - Add rewrites for /student/** to Student Portal
  - Add rewrites for /admin/** to Admin Portal
  - Add rewrites for /docs/** to Docs App
  - Configure transpilePackages for shared packages
  - Setup environment variable handling for zone URLs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2, 10.3_

- [x] 3.2 Implement health check API endpoint
  - Create /api/health route in Main App
  - Implement zone health check logic with timeout handling
  - Return structured health status for all zones
  - _Requirements: 9.2, 9.3, 9.5_

- [x] 3.3 Add error handling for cross-zone navigation
  - Create ZoneErrorBoundary component in @aah/ui
  - Implement fallback UI for zone loading failures
  - Add error logging to Vercel Logs
  - _Requirements: 9.1, 9.4_

- [ ] 4. Create Student Portal zone application
- [x] 4.1 Initialize Student Portal Next.js app
  - Create apps/student directory structure
  - Setup package.json with dependencies on shared packages
  - Configure next.config.js with basePath: '/student'
  - Add rewrite rules for /student/** to root paths
  - _Requirements: 2.1, 2.5_

- [x] 4.2 Implement Student Portal authentication middleware
  - Create middleware.ts with Clerk auth checks
  - Implement student role verification
  - Add redirect logic for unauthorized access
  - _Requirements: 2.3_

- [x] 4.3 Build Student Portal dashboard page
  - Create /student/dashboard route with App Router
  - Implement data fetching using @aah/database
  - Display student courses, schedule, and compliance status
  - Use @aah/ui components for consistent styling
  - _Requirements: 2.2, 2.4_

- [x] 4.4 Build Student Portal schedule page
  - Create /student/schedule route
  - Fetch and display student course schedule
  - Implement conflict detection visualization
  - _Requirements: 2.2_

- [x] 4.5 Build Student Portal resources page
  - Create /student/resources route
  - Display tutoring, study hall, and support resources
  - Implement booking interface for sessions
  - _Requirements: 2.2_

- [x] 5. Create Admin Portal zone application
- [x] 5.1 Initialize Admin Portal Next.js app
  - Create apps/admin directory structure
  - Setup package.json with dependencies on shared packages
  - Configure next.config.js with basePath: '/admin'
  - Add rewrite rules for /admin/** to root paths
  - _Requirements: 3.1, 3.5_

- [x] 5.2 Implement Admin Portal RBAC middleware
  - Create middleware.ts with staff/admin role checks
  - Implement 403 response for unauthorized users
  - Add role-based route protection
  - _Requirements: 3.2_

- [x] 5.3 Build Admin Portal dashboard page
  - Create /admin/dashboard route with App Router
  - Implement analytics and overview widgets
  - Display key metrics (eligibility rates, at-risk students)
  - Use @aah/ui components for consistent styling
  - _Requirements: 3.3, 3.4_

- [x] 5.4 Build Admin Portal student management page
  - Create /admin/students route
  - Implement student list with filtering and search
  - Add student detail views with compliance records
  - _Requirements: 3.3_

- [x] 5.5 Build Admin Portal program management page
  - Create /admin/programs route
  - Implement tutoring and study hall management
  - Add session scheduling and attendance tracking
  - _Requirements: 3.3_

- [ ] 6. Create Docs App zone application
- [ ] 6.1 Initialize Docs App Next.js app
  - Create apps/docs directory structure
  - Setup package.json with dependencies on shared packages
  - Configure next.config.js with basePath: '/docs'
  - Add rewrite rules for /docs/** to root paths
  - _Requirements: 1.4_

- [ ] 6.2 Build Docs App structure
  - Create documentation pages for user guides
  - Implement API documentation pages
  - Add help and FAQ sections
  - Use @aah/ui components for consistent styling
  - _Requirements: 1.4_

- [ ] 7. Implement cross-zone navigation and prefetching
- [ ] 7.1 Update navigation components to use CrossZoneLink
  - Replace standard links with CrossZoneLink for cross-zone navigation
  - Configure prefetching for improved performance
  - Add openInNewTab option for external zone links
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7.2 Implement navigation menu across zones
  - Create shared navigation component in @aah/ui
  - Add zone-aware active state highlighting
  - Ensure consistent navigation across all zones
  - _Requirements: 1.5, 6.5_

- [ ] 8. Configure Vercel deployment for each zone
- [ ] 8.1 Setup Main App Vercel project
  - Create vercel.json with build configuration
  - Configure environment variables for zone URLs
  - Setup production and preview deployments
  - _Requirements: 7.1, 10.3_

- [ ] 8.2 Setup Student Portal Vercel project
  - Create vercel.json with build configuration
  - Configure environment variables (Clerk, database)
  - Link to same domain as Main App
  - _Requirements: 2.5, 7.2, 10.3_

- [ ] 8.3 Setup Admin Portal Vercel project
  - Create vercel.json with build configuration
  - Configure environment variables (Clerk, database, Sentry)
  - Link to same domain as Main App
  - _Requirements: 3.5, 7.3, 10.3_

- [ ] 8.4 Setup Docs App Vercel project
  - Create vercel.json with build configuration
  - Configure environment variables
  - Link to same domain as Main App
  - _Requirements: 7.4, 10.3_

- [ ] 9. Implement environment variable management
- [ ] 9.1 Create zone-specific .env files
  - Setup .env.local for each zone in apps directory
  - Document required environment variables per zone
  - Add .env.example files for reference
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 9.2 Configure shared environment variables
  - Create root .env for shared variables
  - Setup environment variable validation at build time
  - Ensure sensitive variables are not committed
  - _Requirements: 10.2, 10.4, 10.5_

- [ ] 10. Setup development workflow
- [ ] 10.1 Configure concurrent development servers
  - Update root package.json with dev scripts for all zones
  - Configure different ports for each zone (3000, 3001, 3002, 3003)
  - Test parallel development with `pnpm dev`
  - _Requirements: 5.4_

- [ ] 10.2 Configure zone-specific development scripts
  - Add dev:main, dev:student, dev:admin, dev:docs scripts
  - Implement filtered builds using Turborepo --filter flag
  - _Requirements: 5.5_

- [ ] 11. Implement testing infrastructure
- [ ]* 11.1 Setup unit testing for shared packages
  - Configure Jest for @aah/ui package
  - Write tests for Button, Card, CrossZoneLink components
  - Configure Jest for @aah/auth package
  - Write tests for authMiddleware and requireRole utilities
  - _Requirements: 4.4, 4.5_

- [ ]* 11.2 Setup integration testing for zones
  - Configure Playwright for cross-zone navigation tests
  - Write tests for Main App to Student Portal navigation
  - Write tests for Main App to Admin Portal navigation
  - Test authentication flow across zones
  - _Requirements: 1.5, 2.2, 3.3_

- [ ]* 11.3 Setup E2E testing for user workflows
  - Write E2E test for student dashboard workflow
  - Write E2E test for admin student management workflow
  - Write E2E test for cross-zone navigation with authentication
  - _Requirements: 2.2, 3.3, 6.1_

- [ ] 12. Implement monitoring and observability
- [ ] 12.1 Setup zone health monitoring
  - Implement health check endpoints in each zone
  - Create monitoring dashboard for zone status
  - Configure alerts for zone unavailability
  - _Requirements: 9.2, 9.3, 9.5_

- [ ] 12.2 Configure error tracking
  - Setup Sentry for Admin Portal
  - Implement error logging to Vercel Logs
  - Add error context (zone, user, request) to logs
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 13. Migration and deployment
- [ ] 13.1 Migrate existing routes to appropriate zones
  - Identify routes in current apps/web to migrate
  - Move student-specific routes to Student Portal
  - Move admin-specific routes to Admin Portal
  - Update internal links to use new zone paths
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 13.2 Deploy to staging environment
  - Deploy all zones to Vercel staging
  - Validate cross-zone navigation in staging
  - Test authentication and authorization across zones
  - Perform load testing on zone transitions
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 13.3 Production deployment
  - Deploy Main App to production
  - Deploy Student Portal to production
  - Deploy Admin Portal to production
  - Deploy Docs App to production
  - Monitor zone health and performance
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 13.4 Create deployment documentation
  - Document deployment process for each zone
  - Create rollback procedures
  - Document environment variable configuration
  - Create troubleshooting guide for common issues
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.1, 10.2, 10.3_
