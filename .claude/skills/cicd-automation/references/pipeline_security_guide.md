# CI/CD Pipeline Security Guide

## Secrets Management

### GitHub Secrets Best Practices

**1. Organization-Level Secrets**
```bash
# Set organization secret
gh secret set ORG_WIDE_TOKEN --org your-org

# Set repository secret
gh secret set REPO_SPECIFIC_KEY --repo owner/repo
```

**2. Environment-Specific Secrets**
```yaml
# Different secrets per environment
jobs:
  deploy-prod:
    environment: production
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.PROD_API_KEY }}  # production secret

  deploy-staging:
    environment: staging
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.STAGING_API_KEY }}  # staging secret
```

**3. Secret Rotation**

Create a rotation schedule:
- **Critical secrets (API keys, tokens)**: Every 90 days
- **Database credentials**: Every 180 days
- **Service account keys**: Every 60 days

```yaml
# Workflow to remind about secret rotation
name: Secret Rotation Reminder

on:
  schedule:
    - cron: '0 0 1 */3 *'  # Every 3 months

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Check secret age
        run: |
          echo "Time to rotate secrets!"
          # Send notification
```

**4. Never Expose Secrets in Logs**

```yaml
# BAD - logs secret
- name: Debug
  run: echo "API key is ${{ secrets.API_KEY }}"

# GOOD - masks secret
- name: Use secret
  run: |
    echo "::add-mask::${{ secrets.API_KEY }}"
    curl -H "Authorization: Bearer ${{ secrets.API_KEY }}" ...
```

### Environment Variables vs Secrets

**Use Secrets For:**
- API keys
- OAuth tokens
- Database credentials
- Private keys
- Webhook secrets

**Use Environment Variables For:**
- Public configuration
- Feature flags
- API endpoints (non-sensitive)
- Build settings

```yaml
env:
  # Public config - OK as env var
  NODE_ENV: production
  API_ENDPOINT: https://api.example.com

steps:
  - name: Deploy
    env:
      # Sensitive - use secret
      API_KEY: ${{ secrets.API_KEY }}
      # Sensitive - use secret
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Supply Chain Security

### SLSA Framework Implementation

**Level 1: Build Process**

```yaml
name: SLSA Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for SLSA

    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: pnpm build

      - name: Generate provenance
        uses: slsa-framework/slsa-github-generator@v1.9.0
        with:
          artifact-path: dist/
```

**Level 2: Build Service**

```yaml
jobs:
  build:
    permissions:
      id-token: write
      contents: read
      actions: read

    steps:
      - name: Generate SLSA provenance
        uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v1.9.0
```

### Dependency Scanning

**1. Automated Dependency Updates**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    reviewers:
      - your-team
    labels:
      - dependencies
      - automated
```

**2. Security Scanning**

```yaml
name: Security Scan

on:
  pull_request:
  schedule:
    - cron: '0 0 * * 1'  # Weekly

jobs:
  scan-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: pnpm audit --audit-level=high

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  scan-code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, typescript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Analyze
        uses: github/codeql-action/analyze@v3
```

**3. Container Scanning**

```yaml
jobs:
  scan-container:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:latest .

      - name: Run Trivy scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:latest
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

### Signed Commits and Verified Actions

**1. Require Signed Commits**

```yaml
# Branch protection rule
- Require signed commits: enabled
- Require linear history: enabled
```

**2. Pin Actions to SHA**

```yaml
# BEST - pinned to specific SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1

# GOOD - pinned to major version with renovate
- uses: actions/checkout@v4

# AVOID - unpinned
- uses: actions/checkout@main
```

**3. Use Verified Publishers**

```yaml
# Verified GitHub Actions
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- uses: actions/cache@v4

# Verified partner actions
- uses: pnpm/action-setup@v4
- uses: docker/build-push-action@v5
```

## Access Control

### OIDC Authentication

**AWS OIDC Setup**

```yaml
name: Deploy to AWS

on: [push]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubAction-AssumeRoleWithAction
          aws-region: us-east-1

      - name: Deploy
        run: aws s3 sync ./dist s3://my-bucket
```

**Google Cloud OIDC**

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
    service_account: 'my-service-account@my-project.iam.gserviceaccount.com'
```

**Azure OIDC**

```yaml
- name: Azure Login
  uses: azure/login@v1
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

### Least Privilege Permissions

**Repository Permissions**

```yaml
permissions:
  # Minimal permissions by default
  contents: read
  pull-requests: write
  statuses: write

jobs:
  deploy:
    # Job-specific permissions
    permissions:
      contents: read
      deployments: write
```

**GITHUB_TOKEN Scopes**

```yaml
jobs:
  comment-pr:
    permissions:
      pull-requests: write  # Only what's needed
    steps:
      - uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: 'Deployment successful!'
            })
```

## Branch Protection Rules

### Comprehensive Protection

```yaml
# Via GitHub CLI
gh api repos/owner/repo/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=build \
  --field required_status_checks[contexts][]=test \
  --field required_status_checks[contexts][]=security-scan \
  --field required_pull_request_reviews[required_approving_review_count]=2 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[require_code_owner_reviews]=true \
  --field required_pull_request_reviews[require_last_push_approval]=true \
  --field enforce_admins=true \
  --field required_conversation_resolution=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

### CODEOWNERS for Security

```
# .github/CODEOWNERS

# Security-critical files
/.github/workflows/ @security-team @devops-team
/packages/auth/** @security-team
**/*security*.ts @security-team

# Infrastructure
/terraform/ @devops-team
/k8s/ @devops-team

# AI/ML code
/packages/ai/** @ai-team @security-team
/packages/ai-evals/** @ai-team
```

## Audit Logging

### Workflow Audit Trail

```yaml
name: Audit Workflow

on:
  workflow_run:
    workflows: ["*"]
    types: [completed]

jobs:
  log-workflow:
    runs-on: ubuntu-latest
    steps:
      - name: Log workflow execution
        run: |
          cat >> audit.log <<EOF
          {
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "workflow": "${{ github.workflow }}",
            "actor": "${{ github.actor }}",
            "event": "${{ github.event_name }}",
            "ref": "${{ github.ref }}",
            "status": "${{ github.event.workflow_run.conclusion }}"
          }
          EOF

      - name: Upload audit log
        uses: actions/upload-artifact@v4
        with:
          name: audit-log
          path: audit.log
```

### Secrets Usage Tracking

```yaml
jobs:
  track-secret-usage:
    runs-on: ubuntu-latest
    steps:
      - name: Log secret access
        run: |
          echo "Secret accessed at $(date)" >> /tmp/secret-access.log
        env:
          API_KEY: ${{ secrets.API_KEY }}

      - name: Report usage
        run: |
          # Send to monitoring system
          curl -X POST https://monitoring.example.com/api/secret-usage \
            -H "Content-Type: application/json" \
            -d '{
              "secret_name": "API_KEY",
              "workflow": "${{ github.workflow }}",
              "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
            }'
```

## Container Security

### Secure Docker Builds

```yaml
name: Secure Container Build

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Use BuildKit for better security
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Scan Dockerfile for issues
      - name: Run Hadolint
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile

      # Build with security best practices
      - name: Build image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: myapp:latest
          build-args: |
            NODE_ENV=production
          cache-from: type=gha
          cache-to: type=gha,mode=max
          # Don't include secrets in image
          secrets: |
            "npm_token=${{ secrets.NPM_TOKEN }}"

      # Scan built image
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:latest
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      # Sign image with Cosign
      - name: Install Cosign
        uses: sigstore/cosign-installer@v3

      - name: Sign image
        run: |
          cosign sign --key cosign.key myapp:latest
```

### Multi-Stage Builds for Security

```dockerfile
# Secure multi-stage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Build application
COPY . .
RUN pnpm build

# Production stage - minimal attack surface
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only production files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Security Checklist

### Pre-Deployment

- [ ] All secrets rotated within policy timeframe
- [ ] Dependencies scanned for vulnerabilities
- [ ] Container images scanned
- [ ] Static code analysis passed
- [ ] SLSA provenance generated
- [ ] Signed commits verified
- [ ] Branch protection rules enforced
- [ ] Required approvals obtained
- [ ] Security tests passed

### Runtime

- [ ] Least privilege permissions applied
- [ ] OIDC authentication configured
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Resource quotas set
- [ ] Network policies applied
- [ ] Secrets not exposed in logs
- [ ] Container running as non-root

### Post-Deployment

- [ ] Deployment logged in audit trail
- [ ] Security monitoring active
- [ ] Alerts configured
- [ ] Incident response plan ready
- [ ] Rollback procedure tested
- [ ] Access logs reviewed
- [ ] Vulnerability scan scheduled
- [ ] Compliance requirements met

## Academic Athletics Hub Specific Security

### Critical Secrets

```yaml
# Required secrets for AAH
secrets:
  # Authentication
  CLERK_SECRET_KEY:
    description: "Clerk authentication secret"
    rotation: 90 days
    environments: [production, staging]

  # AI Services
  ANTHROPIC_API_KEY:
    description: "Claude API key for AI features"
    rotation: 90 days
    cost_limit: $1000/month

  OPENAI_API_KEY:
    description: "OpenAI API key (optional)"
    rotation: 90 days
    cost_limit: $500/month

  # Database
  DATABASE_URL:
    description: "Main Postgres connection string"
    rotation: 180 days
    encrypted: true

  EVAL_DATABASE_URL:
    description: "AI evaluations database"
    rotation: 180 days

  # Deployment
  VERCEL_TOKEN:
    description: "Vercel deployment token"
    rotation: 90 days
    scope: deploy
```

### Data Protection (FERPA Compliance)

```yaml
# FERPA-compliant workflow
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Verify no PII in logs
        run: |
          # Check for common PII patterns
          if grep -rE '(ssn|social.*security|student.*id)' ./logs; then
            echo "PII detected in logs!"
            exit 1
          fi

      - name: Encrypt sensitive data
        run: |
          # Encrypt before transmission
          openssl enc -aes-256-cbc \
            -in sensitive-data.json \
            -out sensitive-data.enc \
            -k ${{ secrets.ENCRYPTION_KEY }}

      - name: Audit data access
        run: |
          # Log all database queries
          echo "Data accessed: $(date)" >> audit.log
```
