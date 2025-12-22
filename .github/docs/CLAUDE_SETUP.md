# Claude Code GitHub Actions Setup

This document covers the setup required to enable Claude Code for automated PR reviews and interactive @claude mentions in issues and pull requests.

## Prerequisites

- GitHub repository with Actions enabled
- Claude Code OAuth token from Anthropic

## Required Secrets

### CLAUDE_CODE_OAUTH_TOKEN

This is the only required secret for Claude Code workflows.

**To obtain:**
1. Go to [claude.ai/code](https://claude.ai/code)
2. Sign in with your Anthropic account
3. Navigate to Settings > API & OAuth
4. Generate a new OAuth token for GitHub Actions
5. Copy the token value

**To add to GitHub:**
1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `CLAUDE_CODE_OAUTH_TOKEN`
5. Value: Paste your OAuth token
6. Click "Add secret"

### Verify Secret is Set

```bash
gh secret list | grep CLAUDE_CODE_OAUTH_TOKEN
```

## Workflow Files

### claude.yml (Interactive @claude mentions)

Triggers when users mention `@claude` in:
- Issue comments
- PR comments
- PR review comments
- Issue titles/bodies

**Features:**
- Responds to @claude mentions
- Can read CI results
- Posts comments on issues/PRs
- Reports errors if something fails

### claude-code-review.yml (Automatic PR Reviews)

Triggers automatically on:
- New pull requests
- PR updates (synchronize)

**Features:**
- Automatic code review on every PR
- Reviews code quality, bugs, security, performance
- Uses CLAUDE.md for project-specific guidance
- Posts review as PR comment
- Reports errors if review fails

## Required Permissions

Both workflows need these GitHub permissions:

| Permission | Level | Purpose |
|------------|-------|---------|
| `contents` | read | Read repository code |
| `pull-requests` | write | Comment on PRs |
| `issues` | write | Comment on issues |
| `id-token` | write | OIDC authentication |
| `actions` | read | Read CI results |

## Setup Checklist

### Phase 1: Secret Configuration (5 minutes)

- [ ] Obtain Claude Code OAuth token
- [ ] Add `CLAUDE_CODE_OAUTH_TOKEN` to repository secrets
- [ ] Verify secret is set: `gh secret list`

### Phase 2: Workflow Permissions (5 minutes)

1. Go to Settings > Actions > General
2. Under "Workflow permissions":
   - [ ] Select "Read and write permissions"
   - [ ] Check "Allow GitHub Actions to create and approve pull requests"
3. Click "Save"

### Phase 3: Test Interactive Claude (5 minutes)

1. Create a test issue:
   ```bash
   gh issue create --title "Test @claude" --body "@claude please say hello"
   ```
2. Wait for Claude to respond (usually < 2 minutes)
3. Verify Claude's comment appears
4. Close the test issue:
   ```bash
   gh issue close <issue-number>
   ```

### Phase 4: Test Automatic PR Reviews (10 minutes)

1. Create a test branch:
   ```bash
   git checkout -b test/claude-review
   ```
2. Make a small code change:
   ```bash
   echo "// test change" >> apps/main/app/page.tsx
   ```
3. Commit and push:
   ```bash
   git add . && git commit -m "test: claude pr review" && git push -u origin test/claude-review
   ```
4. Create a PR:
   ```bash
   gh pr create --fill
   ```
5. Wait for review (usually 2-5 minutes)
6. Verify:
   - [ ] "Claude Code Review" workflow ran
   - [ ] Review comment was posted
7. Clean up:
   ```bash
   gh pr close && git checkout main && git branch -D test/claude-review
   ```

## Troubleshooting

### "CLAUDE_CODE_OAUTH_TOKEN secret is not set"

The workflow cannot find the secret. Verify:
1. Secret name is exactly `CLAUDE_CODE_OAUTH_TOKEN` (case-sensitive)
2. Secret is set at repository level (not environment level)
3. Run `gh secret list` to confirm

### "Error: Resource not accessible by integration"

Missing permissions. Check:
1. Workflow permissions in Settings > Actions > General
2. Permissions block in workflow YAML file
3. Repository settings allow Actions to write

### Claude doesn't respond to @claude mentions

1. Check if workflow ran: Actions > Claude Code
2. Verify the comment contains `@claude` (not just "claude")
3. Check workflow logs for errors
4. Ensure the user has write access to the repository

### PR review doesn't post

1. Check if workflow ran: Actions > Claude Code Review
2. Look at the "Run Claude Code Review" step logs
3. Verify `pull-requests: write` permission is set
4. Check for timeout (default is 10 minutes)

### Workflow times out

Increase timeout in workflow:
```yaml
timeout_minutes: 15  # or higher
```

### Rate limiting

If you see rate limit errors:
1. Check your Claude Code usage at claude.ai/code
2. Consider adding delays between PR reviews
3. Use path filters to reduce review frequency

## Best Practices

### 1. Use Path Filters for PR Reviews

Only review relevant code changes:
```yaml
on:
  pull_request:
    paths:
      - "apps/**"
      - "packages/**"
      - "services/**"
```

### 2. Exclude Draft PRs

Don't review draft PRs:
```yaml
jobs:
  claude-review:
    if: github.event.pull_request.draft == false
```

### 3. Rate Limit Reviews

For busy repositories, consider limiting review frequency:
```yaml
on:
  pull_request:
    types: [opened]  # Only on new PRs, not updates
```

### 4. Customize Review Focus

Add project-specific instructions in the prompt:
```yaml
prompt: |
  Focus your review on:
  - NCAA compliance requirements
  - FERPA data handling
  - Prisma query patterns from CLAUDE.md
```

## Configuration Options

### claude_args

Customize Claude's behavior:

```yaml
claude_args: '--allowed-tools "Bash(gh pr:*),Bash(gh issue:*)"'
```

### timeout_minutes

Set review timeout:

```yaml
timeout_minutes: 15
```

### additional_permissions

Grant extra permissions:

```yaml
additional_permissions: |
  actions: read
```

## Support

- [Claude Code Action Documentation](https://github.com/anthropics/claude-code-action)
- [Claude Code CLI Reference](https://docs.claude.com/en/docs/claude-code/cli-reference)
- Repository Issues: Create an issue with the `claude-setup` label
