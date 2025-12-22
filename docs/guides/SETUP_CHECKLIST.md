# AI Evaluations CI/CD Setup Checklist

Complete this checklist to set up the AI Evaluations workflow in your repository.

## Prerequisites

- [ ] Repository has `packages/ai-evals` package installed
- [ ] OpenAI API key obtained
- [ ] Anthropic API key obtained
- [ ] Vercel Postgres database for evals created
- [ ] Team members identified for approval groups

## Phase 1: GitHub Secrets (15 minutes)

### Required Secrets

- [ ] **OPENAI_API_KEY**
  - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
  - Create new API key
  - Add to GitHub: Settings → Secrets → Actions → New secret
  - Name: `OPENAI_API_KEY`
  - Value: `sk-...`

- [ ] **ANTHROPIC_API_KEY**
  - Go to [Anthropic Console](https://console.anthropic.com/)
  - Create new API key
  - Add to GitHub: Settings → Secrets → Actions → New secret
  - Name: `ANTHROPIC_API_KEY`
  - Value: `sk-ant-...`

- [ ] **EVAL_DATABASE_URL**
  - Create Vercel Postgres database: `vercel postgres create eval-database`
  - Get connection string: `vercel postgres url eval-database`
  - Add to GitHub: Settings → Secrets → Actions → New secret
  - Name: `EVAL_DATABASE_URL`
  - Value: `postgres://...`

### Verify Secrets

- [ ] Run command to list secrets: `gh secret list`
- [ ] Verify all three secrets appear in list
- [ ] Test OpenAI key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
- [ ] Test Anthropic key: `curl https://api.anthropic.com/v1/messages ...`

## Phase 2: GitHub Teams (20 minutes)

### Create Teams

- [ ] **engineering** (Default reviewers)
  - Go to Organization → Teams → New team
  - Name: `engineering`
  - Add all engineers
  - Repository access: Write

- [ ] **tech-leads** (Technical leadership)
  - Name: `tech-leads`
  - Add tech leads and senior engineers
  - Repository access: Write

- [ ] **ai-team** (AI specialists)
  - Name: `ai-team`
  - Add AI/ML engineers
  - Repository access: Write

- [ ] **regression-approvers** (Authorized approvers)
  - Name: `regression-approvers`
  - Add: Tech leads + Senior engineers + AI specialists
  - Repository access: Write
  - **Important:** These members can approve regression overrides

- [ ] **devops** (DevOps engineers)
  - Name: `devops`
  - Add DevOps team members
  - Repository access: Admin

### Verify Teams

- [ ] Visit Organization → Teams
- [ ] Verify all teams created
- [ ] Check team membership correct
- [ ] Verify repository access granted

## Phase 3: CODEOWNERS (10 minutes)

### Setup File

- [ ] Copy example: `cp .github/CODEOWNERS.example .github/CODEOWNERS`
- [ ] Open in editor: `code .github/CODEOWNERS`
- [ ] Replace `@your-org` with actual organization name
  - Find/replace: `@your-org` → `@actual-org-name`
- [ ] Verify team names match created teams
- [ ] Review AI code ownership patterns:
  ```
  /packages/ai/** @org/ai-team @org/regression-approvers
  /services/ai/** @org/ai-team @org/regression-approvers
  ```

### Test CODEOWNERS

- [ ] Create test branch: `git checkout -b test/codeowners`
- [ ] Edit AI file: `echo "// test" >> packages/ai/lib/chat.ts`
- [ ] Commit: `git commit -am "test: codeowners"`
- [ ] Push: `git push origin test/codeowners`
- [ ] Create PR: `gh pr create --fill`
- [ ] Verify correct reviewers requested automatically
- [ ] Close test PR: `gh pr close`
- [ ] Delete test branch: `git branch -D test/codeowners`

## Phase 4: Branch Protection Rules (15 minutes)

### Via GitHub UI

- [ ] Go to Settings → Branches
- [ ] Click "Add rule" (or edit existing `main` rule)
- [ ] Configure settings:

**General:**
- [ ] Branch name pattern: `main`

**Protect matching branches:**
- [ ] ☑ Require a pull request before merging
  - [ ] Required approvals: `2`
  - [ ] ☑ Dismiss stale pull request approvals when new commits are pushed
  - [ ] ☑ Require review from Code Owners
  - [ ] ☑ Require approval of the most recent reviewable push

- [ ] ☑ Require status checks to pass before merging
  - [ ] ☑ Require branches to be up to date before merging
  - [ ] Status checks required:
    - [ ] Add: `AI Evals Status Check`

- [ ] ☑ Require conversation resolution before merging

- [ ] ☑ Do not allow bypassing the above settings
  - [ ] ☑ Include administrators (recommended)

- [ ] Click "Create" or "Save changes"

### Verify Configuration

- [ ] View branch protection rules
- [ ] Verify `AI Evals Status Check` in required list
- [ ] Verify approval count is 2
- [ ] Verify code owners review required
- [ ] Test protection (see Phase 6)

### Alternative: Via GitHub CLI

If using CLI instead of UI:

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=AI Evals Status Check \
  --field required_pull_request_reviews[required_approving_review_count]=2 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[require_code_owner_reviews]=true \
  --field enforce_admins=true \
  --field required_conversation_resolution=true
```

- [ ] Command executed successfully
- [ ] Verify with: `gh api repos/{owner}/{repo}/branches/main/protection | jq`

## Phase 5: Workflow Validation (10 minutes)

### Check Workflow File

- [ ] File exists: `.github/workflows/ai-evals.yml`
- [ ] Validate syntax: `yamllint .github/workflows/ai-evals.yml`
- [ ] Check Actions enabled: Settings → Actions → General
- [ ] Verify workflow permissions: Settings → Actions → General → Workflow permissions
  - [ ] Select: "Read and write permissions"
  - [ ] ☑ Allow GitHub Actions to create and approve pull requests

### Test Workflow Manually

- [ ] Go to Actions → AI Evaluations
- [ ] Click "Run workflow"
- [ ] Select branch: `main`
- [ ] Set inputs:
  - Force run: `true`
  - Baseline ID: (leave empty)
- [ ] Click "Run workflow"
- [ ] Wait for workflow to complete (may take 10-15 minutes)
- [ ] Check workflow status: Should be green ✅
- [ ] Review job logs for any errors
- [ ] Download artifacts to verify results generated

## Phase 6: End-to-End Test (20 minutes)

### Test 1: Normal PR Flow

- [ ] Create test branch: `git checkout -b test/ai-evals-normal`
- [ ] Make AI change: `echo "// test change" >> packages/ai/lib/chat.ts`
- [ ] Commit: `git commit -am "test: normal eval flow"`
- [ ] Push: `git push origin test/ai-evals-normal`
- [ ] Create PR: `gh pr create --title "Test: Normal AI Evals" --body "Testing normal eval flow"`
- [ ] Wait for workflow to run (~12 minutes)

**Verify:**
- [ ] Workflow triggered automatically
- [ ] Only conversational suite ran (path filter working)
- [ ] PR comment posted with results
- [ ] Status check appears: "AI Evals Status Check"
- [ ] Status check is green ✅ (assuming tests pass)
- [ ] Can see artifacts in workflow run

**Clean up:**
- [ ] Close PR: `gh pr close`
- [ ] Delete branch: `git branch -D test/ai-evals-normal && git push origin --delete test/ai-evals-normal`

### Test 2: Regression Override Flow

- [ ] Create test branch: `git checkout -b test/ai-evals-override`
- [ ] Make breaking change (to simulate regression)
- [ ] Commit: `git commit -am "test: regression override flow"`
- [ ] Push: `git push origin test/ai-evals-override`
- [ ] Create PR: `gh pr create --title "Test: Regression Override" --body "Testing override mechanism"`
- [ ] If no actual regression, manually fail a test or skip to next step

**Simulate regression detected:**
- [ ] Add label: `gh pr edit --add-label regression-override`
- [ ] Add justification comment:
  ```bash
  gh pr comment --body "## Regression Override Test

  **Reason:** Testing override mechanism
  **Impact:** None (test PR)
  **Mitigation:** Will be deleted
  **Approved by:** Testing"
  ```
- [ ] Wait for workflow to re-run
- [ ] Verify status check passes (with warning)
- [ ] Verify 2 approvals still required
- [ ] Request approvals from 2 team members
- [ ] After approvals, verify merge button enabled

**Clean up:**
- [ ] Close PR: `gh pr close`
- [ ] Delete branch: `git branch -D test/ai-evals-override && git push origin --delete test/ai-evals-override`

### Test 3: Path Filtering

- [ ] Create test branch: `git checkout -b test/path-filtering`
- [ ] Make non-AI change: `echo "// test" >> apps/main/app/page.tsx`
- [ ] Commit: `git commit -am "test: path filtering"`
- [ ] Push: `git push origin test/path-filtering`
- [ ] Create PR: `gh pr create --fill`
- [ ] Verify workflow did NOT run (no AI paths changed)
- [ ] Close PR: `gh pr close`
- [ ] Delete branch: `git branch -D test/path-filtering && git push origin --delete test/path-filtering`

## Phase 7: Documentation Review (10 minutes)

### Team Documentation

- [ ] Review [Setup Guide](.github/workflows/AI_EVALS_SETUP.md)
- [ ] Review [Quick Start](.github/workflows/AI_EVALS_QUICKSTART.md)
- [ ] Review [Branch Protection](.github/workflows/BRANCH_PROTECTION_SETUP.md)
- [ ] Bookmark important docs

### Create Internal Wiki (Optional)

- [ ] Add link to Setup Guide in team wiki
- [ ] Create "AI Evals Onboarding" page
- [ ] Add FAQ section with common issues
- [ ] Link to troubleshooting guide

## Phase 8: Team Training (30 minutes)

### Training Session

- [ ] Schedule team meeting (30 min)
- [ ] Prepare demo PR with AI changes
- [ ] Cover topics:
  - How workflow triggers
  - Reading PR comments
  - Understanding status checks
  - Handling regressions
  - Override process
  - Best practices

### Training Materials

- [ ] Share [Quick Start Guide](.github/workflows/AI_EVALS_QUICKSTART.md)
- [ ] Demo creating PR with AI changes
- [ ] Show how to download artifacts
- [ ] Explain regression override process
- [ ] Walk through approval workflow

### Knowledge Check

- [ ] Team members can create PR with AI changes
- [ ] Team members can interpret PR comments
- [ ] Team members understand override process
- [ ] Team members know where to find documentation

## Phase 9: Monitoring Setup (15 minutes)

### GitHub Notifications

- [ ] Enable workflow notifications: Settings → Notifications
- [ ] Subscribe to workflow failures
- [ ] Configure notification preferences

### Metrics Baseline

- [ ] Record initial metrics:
  - [ ] Average workflow duration: _____ minutes
  - [ ] Average cost per run: $_____
  - [ ] Success rate: _____%
- [ ] Set targets:
  - [ ] Duration target: <15 minutes
  - [ ] Cost target: <$1 per run
  - [ ] Success rate target: >95%

### Alert Setup (Optional)

If setting up alerts:
- [ ] Configure Slack webhook (if using)
- [ ] Set up email notifications (if using)
- [ ] Configure custom alerts for:
  - [ ] High failure rate (>20%)
  - [ ] High override rate (>10%)
  - [ ] High costs (>$100/month)

## Phase 10: Production Rollout (5 minutes)

### Enable for Production

- [ ] Remove test PRs
- [ ] Announce to team via Slack/email
- [ ] Update team docs with workflow info
- [ ] Monitor first few PRs closely

### Announcement Template

```
🎉 AI Evaluations CI/CD is now live!

The AI Evals workflow now automatically runs on all PRs that change AI code.

📖 Quick Start: .github/workflows/AI_EVALS_QUICKSTART.md
🔧 Full Docs: .github/workflows/AI_EVALS_SETUP.md

Key points:
- Evals run automatically on AI code changes
- Results appear in PR comments
- Critical regressions block merge
- Override requires `regression-override` label + 2 approvals

Questions? Ask in #ai-engineering
```

## Post-Setup Checklist

### Week 1

- [ ] Monitor first 5 PRs
- [ ] Review workflow logs for errors
- [ ] Gather team feedback
- [ ] Address any issues

### Week 2-4

- [ ] Review success metrics
- [ ] Calculate average costs
- [ ] Check override frequency
- [ ] Optimize if needed

### Monthly

- [ ] Review and update baselines
- [ ] Analyze trends
- [ ] Update documentation
- [ ] Team retrospective

## Rollback Plan

If issues arise:

1. **Disable Workflow:**
   ```yaml
   # Add to .github/workflows/ai-evals.yml at top
   # Temporarily disabled
   # on: []
   ```

2. **Remove Required Status Check:**
   - Settings → Branches → Edit rule
   - Uncheck "AI Evals Status Check"

3. **Investigate and Fix:**
   - Review workflow logs
   - Check secrets configuration
   - Verify team setup
   - Test manually

4. **Re-enable:**
   - Fix issues
   - Test manually first
   - Re-enable workflow
   - Re-add required status check

## Completion

- [ ] All phases completed
- [ ] All tests passed
- [ ] Team trained
- [ ] Monitoring active
- [ ] Production rollout complete

**Setup completed by:** ___________________
**Date:** ___________________
**Verified by:** ___________________

---

## Support

Issues during setup? Check:

1. [Troubleshooting Guide](.github/workflows/AI_EVALS_SETUP.md#troubleshooting)
2. [GitHub Issues](https://github.com/your-org/athletic-academics-hub/issues)
3. Slack: #ai-engineering
4. Email: ai-team@your-org.com
