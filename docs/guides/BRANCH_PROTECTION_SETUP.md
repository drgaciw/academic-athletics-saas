# Branch Protection Rules Configuration

This document provides comprehensive instructions for configuring GitHub branch protection rules to enable AI evaluation deployment blocking and regression override approvals.

## Table of Contents

- [Overview](#overview)
- [Required Status Checks](#required-status-checks)
- [Regression Override Approval Workflow](#regression-override-approval-workflow)
- [Configuration Methods](#configuration-methods)
- [Testing Configuration](#testing-configuration)
- [Troubleshooting](#troubleshooting)

## Overview

Branch protection rules ensure that:

1. **AI evaluations pass** before code can be merged
2. **Critical regressions block deployment** unless explicitly overridden
3. **Regression overrides require approval** from authorized reviewers
4. **Code quality standards** are maintained

## Required Status Checks

### Status Check Name

The AI Evals workflow creates this status check:

- **Name:** `AI Evals Status Check`
- **Type:** Required
- **Behavior:**
  - ✅ Pass: All evals passed or override approved
  - ❌ Fail: Critical regressions detected without override

### Configuration Steps

#### Option 1: GitHub UI

1. Navigate to your repository on GitHub
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule** (or edit existing `main` rule)
4. Configure the following settings:

```
Branch name pattern: main

☑ Require a pull request before merging
  ├─ Required approvals: 2
  ├─ ☑ Dismiss stale pull request approvals when new commits are pushed
  ├─ ☑ Require review from Code Owners
  └─ ☑ Require approval of the most recent reviewable push

☑ Require status checks to pass before merging
  ├─ ☑ Require branches to be up to date before merging
  └─ Status checks that are required:
      └─ AI Evals Status Check

☑ Require conversation resolution before merging

☑ Do not allow bypassing the above settings (recommended)
```

5. Click **Create** or **Save changes**

#### Option 2: GitHub CLI

```bash
# Enable branch protection with required status check
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=AI Evals Status Check \
  --field required_pull_request_reviews[required_approving_review_count]=2 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[require_code_owner_reviews]=true \
  --field enforce_admins=true \
  --field required_conversation_resolution=true

# Verify configuration
gh api repos/{owner}/{repo}/branches/main/protection | jq
```

#### Option 3: Terraform

```hcl
resource "github_branch_protection" "main" {
  repository_id = github_repository.repo.node_id
  pattern       = "main"

  required_status_checks {
    strict   = true
    contexts = ["AI Evals Status Check"]
  }

  required_pull_request_reviews {
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
    required_approving_review_count = 2
    require_last_push_approval      = true
  }

  enforce_admins                = true
  require_conversation_resolution = true
  allows_deletions              = false
  allows_force_pushes           = false
}
```

## Regression Override Approval Workflow

### Overview

When critical regressions are detected, the workflow blocks deployment. To override:

1. Developer adds `regression-override` label to PR
2. Workflow allows merge (status check passes)
3. But PR still requires **2 approvals** from reviewers
4. Code owners must review and approve

### Label-Based Approval Configuration

#### 1. Create CODEOWNERS File

Create `.github/CODEOWNERS` to specify who can approve regression overrides:

```bash
# .github/CODEOWNERS

# AI-related code requires review from AI team
packages/ai/**                    @your-org/ai-team @your-org/tech-leads
services/ai/**                    @your-org/ai-team @your-org/tech-leads
packages/ai-evals/**              @your-org/ai-team @your-org/tech-leads

# Default reviewers for all files
*                                 @your-org/engineering
```

#### 2. Create Regression Override Team

Create a GitHub team for regression override approvals:

**Via GitHub UI:**

1. Go to **Organization** → **Teams**
2. Click **New team**
3. Team name: `regression-approvers`
4. Team members: Add tech leads and senior engineers
5. Repository access: Add repository with **Write** role

**Via GitHub CLI:**

```bash
# Create team
gh api orgs/{org}/teams \
  --method POST \
  --field name='regression-approvers' \
  --field description='Team authorized to approve regression overrides' \
  --field privacy='closed'

# Add team members
gh api orgs/{org}/teams/regression-approvers/memberships/{username} \
  --method PUT \
  --field role='maintainer'

# Grant repository access
gh api orgs/{org}/teams/regression-approvers/repos/{owner}/{repo} \
  --method PUT \
  --field permission='push'
```

#### 3. Update CODEOWNERS

Update `.github/CODEOWNERS` to include regression approvers:

```bash
# .github/CODEOWNERS

# Regression overrides require approval from authorized team
# Any file with 'regression-override' label
*                                 @your-org/regression-approvers
```

### Approval Process

#### Step 1: Developer Adds Override Label

When critical regressions are detected:

1. Review regression details in PR comment
2. Download and analyze detailed reports
3. Document reason for override in PR comment:

```markdown
## Regression Override Request

**Component:** Compliance Agent
**Regression:** 5% decrease in accuracy for edge cases
**Reason:** Upgraded to Claude Opus for better reasoning
**Impact:** Acceptable - edge cases represent <1% of traffic
**Mitigation:** Creating targeted dataset for fine-tuning (Issue #456)
**Expected resolution:** 2 weeks

cc @your-org/regression-approvers for review
```

4. Add `regression-override` label:

```bash
gh pr edit {PR_NUMBER} --add-label regression-override
```

#### Step 2: Reviewers Approve Override

Reviewers from `@your-org/regression-approvers` team:

1. **Review justification:**
   - Is regression acceptable?
   - Is mitigation plan adequate?
   - Is documentation sufficient?

2. **Review eval results:**
   - Download artifacts from workflow run
   - Analyze failed test cases
   - Verify accuracy of regression analysis

3. **Request changes if needed:**
   ```bash
   gh pr review {PR_NUMBER} --request-changes --body "..."
   ```

4. **Approve if acceptable:**
   ```bash
   gh pr review {PR_NUMBER} --approve --body "Regression override approved. Reason: ..."
   ```

#### Step 3: Merge After Approval

Once approved by required reviewers:

1. Status check passes (override label present)
2. Required approvals met (2+ reviews)
3. PR can be merged

```bash
# Merge via CLI
gh pr merge {PR_NUMBER} --squash
```

### Automated Override Expiry (Optional)

Implement automated label removal using GitHub Actions:

```yaml
# .github/workflows/label-cleanup.yml
name: Label Cleanup

on:
  pull_request:
    types: [closed]

jobs:
  remove-override-label:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.labels.*.name, 'regression-override')
    steps:
      - name: Remove regression-override label
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.removeLabel({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              name: 'regression-override'
            });
```

## Configuration Methods

### Method 1: GitHub UI (Recommended for Initial Setup)

**Pros:**
- Visual interface
- No scripting required
- Immediate preview

**Cons:**
- Manual process
- Hard to version control
- Difficult to replicate across repos

**Use when:**
- Setting up for first time
- Learning the options
- One-off changes

### Method 2: GitHub CLI (Recommended for Automation)

**Pros:**
- Scriptable and automatable
- Version controllable
- Easy to replicate

**Cons:**
- Requires CLI installation
- Complex JSON syntax
- Less discoverable

**Use when:**
- Automating setup
- Managing multiple repos
- Scripting infrastructure

### Method 3: Terraform (Recommended for IaC)

**Pros:**
- Infrastructure as code
- Version controlled
- Declarative configuration
- Drift detection

**Cons:**
- Requires Terraform knowledge
- Additional tooling
- State management

**Use when:**
- Managing infrastructure as code
- Multiple environments
- Auditing requirements
- Team uses Terraform

### Method 4: GitHub REST API

**Pros:**
- Maximum flexibility
- Language-agnostic
- Integration with existing tools

**Cons:**
- Most complex
- Requires authentication handling
- Manual state management

**Use when:**
- Building custom tooling
- Integration with existing systems
- Advanced automation

## Testing Configuration

### Test 1: Status Check Appears

1. Create a test PR with AI changes:
   ```bash
   git checkout -b test/branch-protection
   echo "// test" >> packages/ai/lib/chat.ts
   git add . && git commit -m "test: branch protection"
   git push origin test/branch-protection
   gh pr create --fill
   ```

2. Verify status check appears in PR:
   - Check **Checks** tab in PR
   - Look for "AI Evals Status Check"

3. Expected: Status check is **pending** or **running**

### Test 2: Blocking on Failure

1. Simulate critical regression:
   ```bash
   # In ai-evals CLI, create failing test
   # Or modify existing test to fail
   ```

2. Push changes and wait for workflow

3. Expected:
   - Status check shows **failure**
   - PR cannot be merged (button disabled)
   - Error message explains how to override

### Test 3: Override Mechanism

1. Add override label:
   ```bash
   gh pr edit {PR_NUMBER} --add-label regression-override
   ```

2. Wait for workflow to re-run

3. Expected:
   - Status check shows **success** (with warning)
   - PR still requires approvals
   - Merge button enabled after approvals

### Test 4: Approval Requirement

1. With override label, attempt to merge without approvals

2. Expected:
   - Merge blocked due to missing approvals
   - Message shows "Requires 2 approving reviews"

3. Add approvals:
   ```bash
   gh pr review {PR_NUMBER} --approve
   ```

4. Expected:
   - After 2 approvals, merge enabled

### Test 5: Cleanup

```bash
# Close test PR
gh pr close {PR_NUMBER}

# Delete test branch
git branch -D test/branch-protection
git push origin --delete test/branch-protection
```

## Troubleshooting

### Status Check Not Appearing

**Symptom:** PR created but status check doesn't show

**Causes & Solutions:**

1. **Workflow not triggered:**
   ```bash
   # Check if workflow ran
   gh run list --workflow=ai-evals.yml --limit 5
   ```
   Solution: Verify path filters match changed files

2. **Status check name mismatch:**
   ```bash
   # Check actual status check names
   gh api repos/{owner}/{repo}/commits/{SHA}/status | jq '.statuses[].context'
   ```
   Solution: Update branch protection rule to match actual name

3. **Permissions issue:**
   Check workflow permissions: Settings → Actions → General

### Merge Button Enabled Despite Failure

**Symptom:** Can merge PR even though status check failed

**Causes & Solutions:**

1. **Status check not required:**
   Verify "AI Evals Status Check" is in required list

2. **Admin bypass:**
   Check if "Do not allow bypassing" is disabled
   Admins may bypass rules unless explicitly prevented

3. **Status check name:**
   Ensure exact name match (case-sensitive)

### Override Not Working

**Symptom:** Added label but PR still blocked

**Causes & Solutions:**

1. **Workflow not re-running:**
   ```bash
   # Trigger workflow manually
   gh workflow run ai-evals.yml
   ```

2. **Label name mismatch:**
   Ensure label is exactly `regression-override` (case-sensitive)

3. **Check workflow logs:**
   ```bash
   gh run view --log
   ```
   Look for override detection logic

### Approvals Not Counting

**Symptom:** Reviews approved but PR still requires approvals

**Causes & Solutions:**

1. **Review from PR author:**
   PR author's review doesn't count
   Require reviews from other team members

2. **Stale reviews dismissed:**
   New commits dismiss approvals
   Re-approve after latest commit

3. **Code owners not reviewed:**
   If enabled, code owners must review
   Check CODEOWNERS file

## Security Considerations

### Least Privilege Access

1. **Limit override approvers:**
   - Only senior engineers and tech leads
   - Regular audit of team membership

2. **Separate concerns:**
   - AI team reviews AI changes
   - Regression approvers handle overrides
   - Security team reviews safety tests

### Audit Trail

1. **Enable audit log:**
   - Organization settings → Audit log
   - Track label additions, approvals

2. **Require PR comments:**
   - Document override reasons
   - Link to mitigation issues
   - Tag approvers for review

3. **Monitor override frequency:**
   ```bash
   # Count overrides in last 30 days
   gh pr list --state merged --limit 100 --json labels \
     | jq '[.[] | select(.labels[]?.name == "regression-override")] | length'
   ```

### Emergency Override

For critical production hotfixes:

1. **Create bypass team:**
   - Emergency responders only
   - Separate from regular approvers

2. **Configure bypass label:**
   - `emergency-bypass` for critical fixes
   - Requires different approval team
   - Higher review threshold (3+)

3. **Post-incident review:**
   - Document all emergency overrides
   - Review in next retrospective
   - Update tests to prevent recurrence

## Best Practices

1. **Regular Review:**
   - Monthly review of branch protection rules
   - Quarterly audit of override usage
   - Update approvers as team changes

2. **Documentation:**
   - Keep this guide updated
   - Document all override decisions
   - Maintain runbook for approvers

3. **Training:**
   - Onboard new team members
   - Review override process quarterly
   - Share examples of good override justifications

4. **Monitoring:**
   - Track override frequency
   - Alert on unusual patterns
   - Review regression trends

5. **Continuous Improvement:**
   - Reduce need for overrides
   - Improve eval accuracy
   - Expand test coverage

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Status Checks Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [AI Evals Setup Guide](./AI_EVALS_SETUP.md)
