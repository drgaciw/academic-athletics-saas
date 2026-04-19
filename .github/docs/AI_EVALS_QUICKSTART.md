# AI Evaluations Quick Start Guide

A quick reference for developers working with the AI Evaluations CI/CD workflow.

## Quick Links

- 📋 [Full Setup Guide](./AI_EVALS_SETUP.md)
- 🔒 [Branch Protection Configuration](./BRANCH_PROTECTION_SETUP.md)
- 📦 [AI Evals Package](../../packages/ai-evals/README.md)

## Common Workflows

### 1. Creating a PR with AI Changes

```bash
# 1. Create feature branch
git checkout -b feature/improve-compliance-agent

# 2. Make changes to AI code
code packages/ai/agents/compliance-agent.ts

# 3. Commit and push
git add .
git commit -m "feat: improve compliance agent accuracy"
git push origin feature/improve-compliance-agent

# 4. Create PR
gh pr create --fill

# 5. Wait for AI Evals workflow to run
# Status will appear in PR checks
```

**What to expect:**
- Workflow runs automatically
- Only affected eval suites run (based on changed files)
- Results posted as PR comment
- Status check shows pass/fail

### 2. Understanding PR Comment

The workflow posts a comment with this structure:

```
## ✅ AI Evaluation Results

All evaluations passed

### Summary

| Metric | Value |
|--------|-------|
| Total Tests | 150 |
| Passed | 147 ✅ |
| Failed | 3 ❌ |
| Accuracy | 98% |
| Total Cost | $0.0523 |

### 📊 Detailed Reports

View detailed evaluation reports in workflow run artifacts.
```

**Status Icons:**
- ✅ All tests passed
- ⚠️ Regressions detected (non-critical)
- 🚨 Critical regressions detected
- ❌ Some tests failed

### 3. Viewing Detailed Results

**Option 1: Download Artifacts**

```bash
# List artifacts for your PR
gh run list --workflow=ai-evals.yml --branch {your-branch} --limit 1

# Download specific artifact
gh run download {RUN_ID} --name eval-results-compliance

# View JSON results
cat compliance-results.json | jq .

# View markdown report
cat compliance-report.md
```

**Option 2: GitHub UI**

1. Go to your PR
2. Click **Checks** tab
3. Select **AI Evaluations** workflow
4. Scroll to **Artifacts** section
5. Download desired artifact

### 4. Handling Critical Regressions

If you see 🚨 **Critical regressions detected**:

**Step 1: Investigate**

```bash
# Download eval results
gh run download {RUN_ID} --name eval-results-{suite}

# Analyze failures
jq '.regressions[] | select(.severity == "critical")' results.json
```

**Step 2: Fix or Override**

**Option A: Fix the regression (recommended)**

```bash
# Make fixes
code packages/ai/agents/compliance-agent.ts

# Commit and push
git add .
git commit -m "fix: address regression in compliance checks"
git push

# Evals will re-run automatically
```

**Option B: Override (if intentional)**

```bash
# Add override label
gh pr edit --add-label regression-override

# Add justification comment
gh pr comment --body "## Regression Override

**Reason:** Upgraded model for better accuracy
**Impact:** 3% slower response time
**Mitigation:** Implementing caching (Issue #123)
**Approved by:** @tech-lead"

# Wait for approvals (requires 2 reviewers)
```

### 5. Manual Trigger

Run evals manually for testing:

```bash
# Trigger workflow for your PR
gh workflow run ai-evals.yml

# Force run all suites (ignores path filters)
gh workflow run ai-evals.yml \
  --field force_run=true

# Compare against specific baseline
gh workflow run ai-evals.yml \
  --field baseline_id=run_abc123xyz
```

## Common Issues

### Issue: Evals Not Running

**Quick Check:**
```bash
# 1. Verify changed files match path filters
git diff --name-only origin/main...HEAD

# 2. Check if workflow file has errors
gh workflow view ai-evals.yml

# 3. Verify Actions are enabled
# Settings → Actions → General → Actions permissions
```

**Expected Changed Paths:**
- `packages/ai/**` - Core AI code
- `services/ai/**` - AI microservice
- `packages/ai-evals/**` - Eval framework

### Issue: All Tests Failing

**Quick Check:**
```bash
# 1. Check API keys are set
gh secret list

# 2. Check workflow logs
gh run view --log

# 3. Look for common errors:
#    - "API key not found"
#    - "Database connection failed"
#    - "Timeout"
```

**Solutions:**
- API keys: Contact admin to set secrets
- Database: Verify connection string
- Timeout: Reduce dataset size or increase timeout

### Issue: Can't Merge Despite Passing Tests

**Quick Check:**
```bash
# 1. Check required status checks
gh api repos/{owner}/{repo}/branches/main/protection \
  | jq '.required_status_checks.contexts'

# 2. Check PR status
gh pr checks {PR_NUMBER}

# 3. Check for other blocking issues
gh pr view {PR_NUMBER}
```

**Common Causes:**
- Missing approvals (requires 2)
- Unresolved conversations
- Stale branch (needs rebase)
- Other required checks pending

## Eval Datasets

### Current Eval Suites

| Suite | Purpose | Typical Tests |
|-------|---------|---------------|
| `compliance` | NCAA eligibility checks | 25-30 tests |
| `advising` | Course recommendations | 20-25 tests |
| `conversational` | Chat responses | 30-40 tests |
| `risk-prediction` | Student risk scoring | 15-20 tests |
| `rag` | Knowledge retrieval | 20-25 tests |
| `safety` | Security & PII detection | 15-20 tests |

### Adding New Test Cases

```bash
# Navigate to evals package
cd packages/ai-evals

# Run CLI in interactive mode
pnpm exec tsx cli.ts dataset add --interactive

# Or add directly to dataset file
code datasets/compliance/eligibility-checks.json
```

**Test Case Format:**
```json
{
  "id": "compliance-001",
  "input": {
    "studentId": "SA12345",
    "gpa": 2.8,
    "creditHours": 24,
    "progressTowardDegree": 0.35
  },
  "expected": {
    "eligible": true,
    "issues": [],
    "recommendations": []
  },
  "metadata": {
    "difficulty": "easy",
    "category": "gpa-check",
    "tags": ["ncaa", "eligibility", "gpa"]
  }
}
```

## Local Development

### Running Evals Locally

```bash
# Navigate to evals package
cd packages/ai-evals

# Install dependencies
pnpm install

# Set environment variables
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export DATABASE_URL="postgres://..."

# Run specific eval suite
pnpm eval run --dataset compliance --verbose

# Run with baseline comparison
pnpm eval run --dataset compliance --baseline run_abc123

# Compare multiple models
pnpm compare --models gpt-4-turbo claude-3-opus-20240229

# Generate report from results
pnpm report --input results.json --format markdown
```

### Running Specific Tests

```bash
# Run single test case
pnpm eval run \
  --dataset compliance \
  --filter "id=compliance-001" \
  --verbose

# Run test category
pnpm eval run \
  --dataset compliance \
  --filter "category=gpa-check" \
  --verbose

# Dry run (no API calls)
pnpm eval run \
  --dataset compliance \
  --dry-run
```

### Debugging Failed Tests

```bash
# Run with maximum verbosity
pnpm eval run \
  --dataset compliance \
  --verbose \
  --debug

# Output to file for analysis
pnpm eval run \
  --dataset compliance \
  --output debug-results.json

# Analyze specific failure
jq '.results[] | select(.passed == false)' debug-results.json
```

## Best Practices

### Before Committing AI Changes

1. **Run evals locally:**
   ```bash
   pnpm --filter @aah/ai-evals eval run --dataset {affected-suite}
   ```

2. **Review results:**
   - Check for regressions
   - Verify expected behavior
   - Document intentional changes

3. **Update tests if needed:**
   - Add tests for new features
   - Update expected outputs for changes
   - Document in test metadata

### Writing PR Descriptions

For AI changes, include:

```markdown
## Changes

Brief description of AI changes

## Eval Results

- ✅ Compliance: 98% accuracy (+2%)
- ✅ Conversational: 95% accuracy (unchanged)
- ⚠️ Risk Prediction: 88% accuracy (-3%)
  - Reason: Adjusted threshold for better precision
  - Trade-off: Fewer false positives, more manual review

## Testing

- [x] Run evals locally
- [x] Reviewed regression details
- [x] Updated test cases for new behavior
```

### Requesting Regression Override

If override needed, provide clear justification:

```markdown
## Regression Override Request

**Component:** {affected component}

**Regression Details:**
- Metric: {what decreased}
- Amount: {how much}
- Impact: {who/what affected}

**Justification:**
- Reason for change: {why made}
- Benefits gained: {what improved}
- Trade-offs: {what's acceptable}

**Mitigation Plan:**
- Action: {what will be done}
- Timeline: {when}
- Tracking: {issue link}

**Approval:** cc @{approver-team}
```

## Useful Commands

### GitHub CLI

```bash
# View PR status
gh pr status

# Check workflow runs
gh run list --workflow=ai-evals.yml --limit 5

# Watch workflow run
gh run watch

# View workflow logs
gh run view --log

# Download artifacts
gh run download {RUN_ID}

# Add/remove labels
gh pr edit {PR_NUMBER} --add-label regression-override
gh pr edit {PR_NUMBER} --remove-label regression-override

# Request review
gh pr review {PR_NUMBER} --approve
```

### Eval CLI

```bash
# Show help
pnpm eval --help

# List datasets
pnpm exec tsx cli.ts dataset list

# Show dataset info
pnpm exec tsx cli.ts dataset info compliance

# Export results
pnpm exec tsx cli.ts report \
  --input results.json \
  --format csv \
  --output metrics.csv
```

### jq for Results Analysis

```bash
# Show all failed tests
jq '.results[] | select(.passed == false)' results.json

# Show accuracy by category
jq '.results | group_by(.category) |
  map({category: .[0].category,
       accuracy: (map(select(.passed)) | length) / length})' \
  results.json

# Show regressions by severity
jq '.regressions | group_by(.severity) |
  map({severity: .[0].severity, count: length})' \
  results.json

# Calculate total cost
jq '[.results[].metadata.cost] | add' results.json
```

## Getting Help

### Documentation

- 📖 [AI Evals Package README](../../packages/ai-evals/README.md)
- 🔧 [Full Setup Guide](./AI_EVALS_SETUP.md)
- 🔒 [Branch Protection Guide](./BRANCH_PROTECTION_SETUP.md)

### Troubleshooting

1. Check workflow logs: `gh run view --log`
2. Review [troubleshooting section](./AI_EVALS_SETUP.md#troubleshooting)
3. Search [existing issues](https://github.com/your-org/athletic-academics-hub/issues)

### Support

- 💬 Slack: `#ai-engineering`
- 📧 Email: ai-team@your-org.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/athletic-academics-hub/issues/new)

## Quick Reference Card

Print this for your desk:

```
┌─────────────────────────────────────────────────────────┐
│          AI EVALUATIONS QUICK REFERENCE                 │
├─────────────────────────────────────────────────────────┤
│ View PR status:                                         │
│ $ gh pr status                                          │
│                                                         │
│ Run evals locally:                                      │
│ $ pnpm --filter @aah/ai-evals eval run --dataset {name}│
│                                                         │
│ Download results:                                       │
│ $ gh run download {RUN_ID}                             │
│                                                         │
│ Add override label:                                     │
│ $ gh pr edit --add-label regression-override           │
│                                                         │
│ Status Icons:                                           │
│ ✅ Passed  ⚠️ Regression  🚨 Critical  ❌ Failed        │
│                                                         │
│ Help: See /github/workflows/AI_EVALS_QUICKSTART.md     │
└─────────────────────────────────────────────────────────┘
```
