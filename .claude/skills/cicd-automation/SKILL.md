---
name: cicd-automation
description: Comprehensive CI/CD automation skill for GitHub Actions, GitLab CI, deployment pipelines, secrets management, and workflow optimization. Specialized in monorepo builds, AI evaluation workflows, branch protection, and automated testing. Use when designing CI/CD pipelines, optimizing workflows, managing secrets, implementing deployment strategies, or troubleshooting GitHub Actions.
---

# CI/CD Automation

Complete toolkit for CI/CD automation with modern GitHub Actions, GitLab CI, and deployment workflows.

## Quick Start

### Main Capabilities

This skill provides four core capabilities through automated scripts:

```bash
# Script 1: Workflow Generator
python scripts/workflow_generator.py [options]

# Script 2: Secrets Validator
python scripts/secrets_validator.py [options]

# Script 3: Pipeline Optimizer
python scripts/pipeline_optimizer.py [options]

# Script 4: Deployment Health Checker
python scripts/deployment_health_checker.py [options]
```

## Core Capabilities

### 1. Workflow Generator

Automated tool for creating and scaffolding CI/CD workflows.

**Features:**
- GitHub Actions workflow generation
- GitLab CI pipeline templates
- Monorepo-aware build configurations
- Matrix builds for multiple environments
- Caching strategies for optimal performance

**Usage:**
```bash
python scripts/workflow_generator.py --type github-actions --template ai-evals
python scripts/workflow_generator.py --type monorepo-build --outputs ./workflows
```

**Common Templates:**
- `ai-evals` - AI evaluation workflows with baseline comparison
- `monorepo-build` - Turborepo/pnpm workspace builds
- `deployment-pipeline` - Full CI/CD with staging and production
- `security-scan` - Security scanning and dependency updates
- `test-suite` - Comprehensive testing with coverage

### 2. Secrets Validator

Comprehensive validation and management tool for CI/CD secrets.

**Features:**
- Validate secret availability and format
- Check API key validity
- Database connection testing
- Environment variable completeness
- Rotation recommendations

**Usage:**
```bash
python scripts/secrets_validator.py --check-github
python scripts/secrets_validator.py --validate-apis --env production
```

**Validations:**
- API key format and validity
- Database connection strings
- Environment-specific secrets
- Missing secrets detection
- Expiration warnings

### 3. Pipeline Optimizer

Advanced optimization for CI/CD pipeline performance.

**Features:**
- Build time analysis
- Cache hit rate optimization
- Dependency resolution improvements
- Parallel job recommendations
- Cost reduction strategies

**Usage:**
```bash
python scripts/pipeline_optimizer.py --analyze-workflow .github/workflows/ci.yml
python scripts/pipeline_optimizer.py --suggest-improvements --threshold 5m
```

**Optimizations:**
- Caching strategy improvements
- Job parallelization
- Conditional workflow execution
- Resource allocation tuning
- Matrix build optimization

### 4. Deployment Health Checker

Production deployment validation and health monitoring.

**Features:**
- Pre-deployment validation
- Post-deployment health checks
- Rollback detection
- Service availability monitoring
- Performance regression detection

**Usage:**
```bash
python scripts/deployment_health_checker.py --env production --service api
python scripts/deployment_health_checker.py --pre-deploy --checks all
```

## Reference Documentation

### GitHub Actions Best Practices

Comprehensive guide available in `references/github_actions_patterns.md`:

- Workflow design patterns
- Security best practices
- Caching strategies
- Matrix builds and reusable workflows
- Secrets management
- Monorepo optimization
- Performance tuning

### Pipeline Security Guide

Complete security documentation in `references/pipeline_security_guide.md`:

- Secrets management best practices
- Supply chain security (SLSA framework)
- Dependency scanning
- Container security
- Branch protection rules
- OIDC authentication
- Audit logging

### Deployment Strategies

Technical reference guide in `references/deployment_strategies.md`:

- Blue/Green deployments
- Canary releases
- Rolling updates
- Feature flags integration
- A/B testing strategies
- Zero-downtime deployments
- Rollback procedures

## Tech Stack

**CI/CD Platforms:** GitHub Actions, GitLab CI, CircleCI, Azure DevOps
**Container Tools:** Docker, Podman, Kaniko
**Orchestration:** Kubernetes, Docker Compose, Helm
**Cloud Platforms:** Vercel, AWS, GCP, Azure
**Build Tools:** Turborepo, pnpm, npm, Vite, esbuild
**Testing:** Vitest, Jest, Playwright, Cypress
**Monitoring:** GitHub Actions logs, Datadog, Sentry

## Development Workflow

### 1. Create New Workflow

```bash
# Generate workflow from template
python scripts/workflow_generator.py \
  --type github-actions \
  --template monorepo-build \
  --output .github/workflows/build.yml

# Validate workflow syntax
gh workflow view build.yml
```

### 2. Validate Secrets

```bash
# Check all required secrets
python scripts/secrets_validator.py --check-all

# Test specific API keys
python scripts/secrets_validator.py \
  --validate ANTHROPIC_API_KEY \
  --validate DATABASE_URL
```

### 3. Optimize Pipeline

```bash
# Analyze current workflow performance
python scripts/pipeline_optimizer.py \
  --analyze .github/workflows/ci.yml \
  --output report.json

# Apply optimization suggestions
python scripts/pipeline_optimizer.py \
  --apply-suggestions \
  --workflow .github/workflows/ci.yml
```

### 4. Monitor Deployments

```bash
# Pre-deployment health checks
python scripts/deployment_health_checker.py \
  --pre-deploy \
  --env production

# Post-deployment validation
python scripts/deployment_health_checker.py \
  --post-deploy \
  --verify-endpoints \
  --check-metrics
```

## Best Practices Summary

### Workflow Design

- Use reusable workflows for common patterns
- Implement proper caching strategies
- Optimize matrix builds for parallelization
- Use concurrency controls to prevent waste
- Implement timeout limits for all jobs

### Security

- Never commit secrets to repository
- Use GitHub OIDC for cloud authentication
- Implement least privilege access
- Scan dependencies regularly
- Use signed commits and verified actions

### Performance

- Cache dependencies aggressively
- Use build matrices efficiently
- Implement conditional workflow execution
- Optimize Docker layer caching
- Parallelize independent jobs

### Monitoring

- Track workflow execution times
- Monitor success/failure rates
- Set up alerts for critical failures
- Log important metrics
- Review audit logs regularly

## Common Patterns

### Monorepo CI/CD

```yaml
# Optimized monorepo workflow
name: Monorepo CI
on: [push, pull_request]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: .github/filters.yml

  build:
    needs: detect-changes
    strategy:
      matrix:
        package: ${{ fromJson(needs.detect-changes.outputs.packages) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter ${{ matrix.package }} build
```

### AI Evaluations Pipeline

```yaml
# AI evaluation workflow with baseline comparison
name: AI Evaluations
on:
  pull_request:
    paths: ['packages/ai/**', 'services/ai/**']

jobs:
  run-evals:
    runs-on: ubuntu-latest
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      DATABASE_URL: ${{ secrets.EVAL_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm --filter @aah/ai-evals build
      - run: pnpm eval run --dataset all --baseline latest
      - uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: packages/ai-evals/eval-results/
```

### Deployment Pipeline

```yaml
# Production deployment with health checks
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      # Pre-deployment validation
      - name: Health Check
        run: python scripts/deployment_health_checker.py --pre-deploy

      # Deploy
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

      # Post-deployment validation
      - name: Verify Deployment
        run: python scripts/deployment_health_checker.py --post-deploy
```

## Troubleshooting

### Workflow Failures

**Issue:** Workflow fails inconsistently
- Check cache invalidation
- Review concurrency settings
- Verify secrets availability
- Check rate limits

**Issue:** Slow build times
- Run pipeline optimizer
- Review caching strategy
- Parallelize independent jobs
- Use build matrices

### Secret Issues

**Issue:** Secret not found
- Verify secret name matches exactly
- Check environment/repository scope
- Ensure proper permissions
- Validate secret format

**Issue:** API authentication failures
- Validate key format
- Check key expiration
- Test key manually
- Review usage limits

### Deployment Problems

**Issue:** Deployment hangs
- Check timeout settings
- Verify health check endpoints
- Review logs for errors
- Check resource limits

**Issue:** Rollback needed
- Use deployment health checker
- Review recent changes
- Check metric regressions
- Follow rollback procedure

## Integration Examples

### GitHub Actions + Vercel

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
    vercel-args: '--prod'
```

### Slack Notifications

```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment failed: ${{ github.workflow }}"
      }
```

### Database Migrations

```yaml
- name: Run Migrations
  run: |
    pnpm --filter @aah/database db:migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Advanced Topics

### Custom Actions

Create reusable custom actions:

```yaml
# .github/actions/setup-node-pnpm/action.yml
name: 'Setup Node with pnpm'
description: 'Setup Node.js and pnpm with caching'
inputs:
  node-version:
    description: 'Node.js version'
    default: '20'
runs:
  using: 'composite'
  steps:
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'pnpm'
```

### Matrix Strategies

Optimize matrix builds:

```yaml
strategy:
  fail-fast: false
  matrix:
    node: [18, 20]
    os: [ubuntu-latest, macos-latest]
    include:
      - node: 20
        os: ubuntu-latest
        coverage: true
```

### Reusable Workflows

Create organization-level workflows:

```yaml
# .github/workflows/reusable-build.yml
on:
  workflow_call:
    inputs:
      package:
        required: true
        type: string

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm --filter ${{ inputs.package }} build
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)
- [Turborepo CI/CD](https://turbo.build/repo/docs/ci)
- [pnpm CI Configuration](https://pnpm.io/continuous-integration)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Project-Specific Context

### Academic Athletics Hub

This skill is optimized for the Academic Athletics Hub monorepo:

**Structure:**
- 3 Next.js apps (main, student, admin)
- 7 backend services
- Shared packages
- AI evaluation framework

**Key Workflows:**
- AI Evaluations (packages/ai-evals)
- Monorepo builds (Turborepo)
- Vercel deployments
- Database migrations (Prisma)

**Critical Secrets:**
- `ANTHROPIC_API_KEY` - Claude API access
- `EVAL_DATABASE_URL` - Evaluation results storage
- `DATABASE_URL` - Main Postgres database
- `VERCEL_TOKEN` - Deployment authentication
- `CLERK_SECRET_KEY` - Authentication

**Optimization Priorities:**
1. Fast CI/CD feedback loops
2. Cost-effective AI evaluation runs
3. Secure secrets management
4. Zero-downtime deployments
5. Comprehensive testing coverage
