# CI/CD Automation Skill

Comprehensive CI/CD automation toolkit for GitHub Actions, pipeline optimization, secrets management, and deployment validation.

## Quick Start

### Installation

Install required Python dependencies:

```bash
# Core dependencies
pip install pyyaml requests

# Optional for enhanced features
pip install psycopg2-binary  # For database validation
```

### Usage

#### 1. Generate Workflows

Create GitHub Actions workflows from templates:

```bash
# Generate AI evaluations workflow
python .claude/skills/cicd-automation/scripts/workflow_generator.py \
  --template ai-evals \
  --output .github/workflows

# Generate monorepo build workflow
python .claude/skills/cicd-automation/scripts/workflow_generator.py \
  --template monorepo-build

# Generate full deployment pipeline
python .claude/skills/cicd-automation/scripts/workflow_generator.py \
  --template deployment-pipeline
```

**Available Templates:**
- `ai-evals` - AI evaluation workflows with baseline comparison
- `monorepo-build` - Turborepo/pnpm workspace builds
- `deployment-pipeline` - Full CI/CD with staging and production
- `security-scan` - Security scanning and dependency updates
- `test-suite` - Comprehensive testing with coverage

#### 2. Validate Secrets

Check GitHub secrets and environment variables:

```bash
# Check all GitHub secrets
python .claude/skills/cicd-automation/scripts/secrets_validator.py --check-github

# Validate API keys (requires env vars set)
export ANTHROPIC_API_KEY="sk-ant-..."
export DATABASE_URL="postgres://..."
python .claude/skills/cicd-automation/scripts/secrets_validator.py --check-all

# Check secret rotation schedule
python .claude/skills/cicd-automation/scripts/secrets_validator.py --check-rotation
```

#### 3. Optimize Pipelines

Analyze workflows and get optimization suggestions:

```bash
# Analyze workflow
python .claude/skills/cicd-automation/scripts/pipeline_optimizer.py \
  --analyze .github/workflows/ci.yml

# Output as JSON
python .claude/skills/cicd-automation/scripts/pipeline_optimizer.py \
  --analyze .github/workflows/ai-evals.yml \
  --json \
  --output optimization-report.json
```

#### 4. Check Deployment Health

Validate deployments before and after:

```bash
# Pre-deployment checks
python .claude/skills/cicd-automation/scripts/deployment_health_checker.py --pre-deploy

# Post-deployment validation
python .claude/skills/cicd-automation/scripts/deployment_health_checker.py \
  --post-deploy \
  --url https://your-app.vercel.app \
  --verify-endpoints

# With custom timeout
python .claude/skills/cicd-automation/scripts/deployment_health_checker.py \
  --post-deploy \
  --url https://your-app.vercel.app \
  --timeout 60 \
  --json
```

## Features

### Workflow Generator

- **Templates**: Pre-built workflows for common scenarios
- **Customization**: Adjust names, events, and configurations
- **Best Practices**: Includes caching, parallelization, security

### Secrets Validator

- **GitHub Secrets**: Check availability via GitHub CLI
- **API Keys**: Validate format and test connectivity
- **Database URLs**: Parse and test connection strings
- **Rotation**: Track when secrets need rotation

### Pipeline Optimizer

- **Caching Analysis**: Check for pnpm, Turborepo caching
- **Parallelization**: Identify opportunities to run jobs in parallel
- **Conditional Execution**: Suggest path filters and conditional logic
- **Timeouts**: Validate timeout configurations
- **Concurrency**: Check concurrency controls

### Deployment Health Checker

- **Pre-Deployment**: Env vars, build artifacts, migrations, dependencies
- **Post-Deployment**: Service availability, health endpoints, API checks
- **Database**: Test connectivity and query execution
- **Custom Checks**: Extensible for project-specific validations

## Reference Documentation

### GitHub Actions Patterns

See `references/github_actions_patterns.md` for:
- Monorepo change detection
- Caching strategies (pnpm, Turborepo, build outputs)
- Matrix builds and parallelization
- Conditional execution patterns
- Reusable workflows and composite actions
- Concurrency control
- Performance optimization

### Pipeline Security

See `references/pipeline_security_guide.md` for:
- Secrets management best practices
- SLSA framework implementation
- Dependency scanning (npm audit, Snyk, CodeQL)
- Container security (Trivy, Hadolint)
- OIDC authentication (AWS, GCP, Azure)
- Branch protection rules
- FERPA compliance for student data

### Deployment Strategies

See `references/deployment_strategies.md` for:
- Blue/Green deployments
- Canary releases
- Rolling updates
- Feature flags (LaunchDarkly)
- A/B testing
- Zero-downtime deployments
- Health checks and graceful shutdown

## Project-Specific Context

This skill is optimized for the Academic Athletics Hub monorepo:

### Architecture

- **3 Next.js apps**: main, student, admin
- **7 backend services**: user, advising, compliance, ai, support, monitoring, integration
- **Shared packages**: database, ui, auth, ai, api-utils
- **Build tools**: Turborepo, pnpm workspaces

### Key Workflows

1. **AI Evaluations** (`packages/ai-evals`)
   - Runs on AI code changes
   - Compares against baseline
   - Blocks on critical regressions
   - Stores results in database

2. **Monorepo Builds**
   - Path-based change detection
   - Parallel package builds
   - Turborepo caching
   - Type checking and linting

3. **Deployments**
   - Preview deployments for PRs (Vercel)
   - Production deployments from main
   - Health checks before/after
   - Rollback capability

### Critical Secrets

- `ANTHROPIC_API_KEY` - Claude API access
- `EVAL_DATABASE_URL` - Evaluation results storage
- `DATABASE_URL` - Main Postgres database
- `CLERK_SECRET_KEY` - Authentication
- `VERCEL_TOKEN` - Deployment access

## Examples

### Complete CI/CD Setup

```bash
# 1. Generate workflows
python scripts/workflow_generator.py --template ai-evals
python scripts/workflow_generator.py --template monorepo-build
python scripts/workflow_generator.py --template deployment-pipeline

# 2. Validate secrets
python scripts/secrets_validator.py --check-github

# 3. Optimize workflows
python scripts/pipeline_optimizer.py --analyze .github/workflows/ci.yml

# 4. Test deployment checks
python scripts/deployment_health_checker.py --pre-deploy
```

### Continuous Integration

```bash
# In CI workflow
- name: Optimize pipeline
  run: python scripts/pipeline_optimizer.py --analyze .github/workflows/ci.yml

- name: Validate secrets
  run: python scripts/secrets_validator.py --check-all

- name: Pre-deployment checks
  run: python scripts/deployment_health_checker.py --pre-deploy
```

### Monitoring

```bash
# Scheduled workflow to check secrets rotation
python scripts/secrets_validator.py --check-rotation --json > rotation-report.json

# Monitor deployment health
python scripts/deployment_health_checker.py \
  --post-deploy \
  --url https://production.com \
  --verify-endpoints \
  --json > health-report.json
```

## Troubleshooting

### GitHub CLI Not Found

```bash
# Install GitHub CLI
brew install gh  # macOS
apt install gh   # Ubuntu
winget install --id GitHub.cli  # Windows

# Authenticate
gh auth login
```

### Python Dependencies Missing

```bash
# Install all dependencies
pip install pyyaml requests psycopg2-binary

# Or use requirements file
pip install -r requirements.txt
```

### Permission Errors

```bash
# Make scripts executable
chmod +x .claude/skills/cicd-automation/scripts/*.py

# Run with python explicitly
python .claude/skills/cicd-automation/scripts/workflow_generator.py --help
```

## Contributing

When adding new features:

1. **Scripts**: Follow existing patterns in `scripts/`
2. **Documentation**: Update reference docs in `references/`
3. **Examples**: Add examples to `SKILL.md`
4. **Tests**: Add validation and error handling

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Turborepo CI/CD](https://turbo.build/repo/docs/ci)
- [pnpm CI Configuration](https://pnpm.io/continuous-integration)
- [Project Documentation](../../../../.github/workflows/)

## Support

For issues or questions:
- Review reference documentation in `references/`
- Check script help: `python script.py --help`
- See project CI/CD setup in `.github/workflows/`
