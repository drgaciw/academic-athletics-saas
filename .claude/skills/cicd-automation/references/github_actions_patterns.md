# GitHub Actions Patterns and Best Practices

## Workflow Design Patterns

### 1. Monorepo Change Detection

Optimize builds by only running workflows for changed packages:

```yaml
name: Monorepo CI

on: [push, pull_request]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            ai:
              - 'packages/ai/**'
            database:
              - 'packages/database/**'
            main-app:
              - 'apps/main/**'

  build-changed:
    needs: detect-changes
    if: needs.detect-changes.outputs.packages != '[]'
    strategy:
      matrix:
        package: ${{ fromJson(needs.detect-changes.outputs.packages) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build ${{ matrix.package }}
        run: pnpm --filter @aah/${{ matrix.package }} build
```

### 2. Caching Strategies

**pnpm Store Caching:**

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'

- name: Get pnpm store directory
  shell: bash
  run: |
    echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

- name: Setup pnpm cache
  uses: actions/cache@v4
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-
```

**Turborepo Cache:**

```yaml
- name: Setup Turborepo cache
  uses: actions/cache@v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-
```

**Build Artifacts Cache:**

```yaml
- name: Cache build outputs
  uses: actions/cache@v4
  with:
    path: |
      .next/cache
      packages/*/dist
      services/*/dist
    key: ${{ runner.os }}-build-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-build-${{ hashFiles('**/pnpm-lock.yaml') }}-
      ${{ runner.os }}-build-
```

### 3. Matrix Builds

**Multi-Environment Testing:**

```yaml
strategy:
  fail-fast: false
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest, macos-latest, windows-latest]
    include:
      # Run coverage only on Linux with Node 20
      - os: ubuntu-latest
        node-version: 20
        coverage: true
    exclude:
      # Skip Windows with Node 18
      - os: windows-latest
        node-version: 18

steps:
  - name: Setup Node ${{ matrix.node-version }}
    uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}

  - name: Run tests
    run: pnpm test

  - name: Upload coverage
    if: matrix.coverage
    uses: codecov/codecov-action@v4
```

**Service Matrix:**

```yaml
strategy:
  matrix:
    service:
      - user
      - advising
      - compliance
      - ai
      - support
      - monitoring
      - integration

steps:
  - name: Build ${{ matrix.service }}
    run: pnpm --filter @aah/service-${{ matrix.service }} build

  - name: Test ${{ matrix.service }}
    run: pnpm --filter @aah/service-${{ matrix.service }} test
```

### 4. Conditional Execution

**Skip on Draft PRs:**

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  test:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
```

**Run Only on Specific Paths:**

```yaml
on:
  pull_request:
    paths:
      - 'packages/ai/**'
      - 'services/ai/**'
      - 'packages/ai-evals/**'
```

**Environment-Based Conditions:**

```yaml
jobs:
  deploy-production:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production

  deploy-preview:
    if: github.event_name == 'pull_request'
    environment: preview
```

### 5. Reusable Workflows

**Callable Workflow:**

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build

on:
  workflow_call:
    inputs:
      package:
        required: true
        type: string
      node-version:
        required: false
        type: string
        default: '20'
    outputs:
      build-status:
        description: 'Build success status'
        value: ${{ jobs.build.outputs.status }}
    secrets:
      DATABASE_URL:
        required: true

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      status: ${{ steps.build.outcome }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - id: build
        run: pnpm --filter ${{ inputs.package }} build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Calling the Workflow:**

```yaml
# .github/workflows/build-packages.yml
name: Build Packages

on: [push, pull_request]

jobs:
  build-ai:
    uses: ./.github/workflows/reusable-build.yml
    with:
      package: '@aah/ai'
    secrets:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}

  build-database:
    uses: ./.github/workflows/reusable-build.yml
    with:
      package: '@aah/database'
    secrets:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 6. Concurrency Control

**Prevent Duplicate Workflow Runs:**

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Per-PR Concurrency:**

```yaml
concurrency:
  group: ai-evals-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

### 7. Composite Actions

**Custom Setup Action:**

```yaml
# .github/actions/setup-monorepo/action.yml
name: 'Setup Monorepo'
description: 'Setup Node, pnpm, and install dependencies with caching'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'

runs:
  using: 'composite'
  steps:
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: 9

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'pnpm'

    - name: Install dependencies
      shell: bash
      run: pnpm install --frozen-lockfile

    - name: Cache Turbo
      uses: actions/cache@v4
      with:
        path: .turbo
        key: ${{ runner.os }}-turbo-${{ github.sha }}
        restore-keys: |
          ${{ runner.os }}-turbo-
```

**Using Composite Action:**

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/setup-monorepo
    with:
      node-version: '20'
  - run: pnpm build
```

## Performance Optimization

### 1. Parallel Job Execution

```yaml
jobs:
  # Jobs run in parallel by default
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test

  # This job waits for all above jobs
  deploy:
    needs: [lint, type-check, test]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm deploy
```

### 2. Dependency Graph Optimization

```yaml
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-monorepo
      - run: echo "Dependencies installed"

  build-packages:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter '@aah/*' build

  build-services:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter '@aah/service-*' build

  build-apps:
    needs: [build-packages, build-services]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter './apps/*' build
```

### 3. Artifact Sharing

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: build-outputs
          path: |
            packages/*/dist
            services/*/dist
          retention-days: 7

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-outputs
      - run: pnpm test
```

## Security Best Practices

### 1. Secrets Management

**Never Log Secrets:**

```yaml
steps:
  - name: Use secret safely
    run: |
      # DON'T DO THIS - will expose secret
      # echo "Key: ${{ secrets.API_KEY }}"

      # DO THIS - mask the value
      echo "::add-mask::${{ secrets.API_KEY }}"
      echo "Key is set"
```

**Use Environment Secrets:**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy
        env:
          # Secret scoped to production environment
          API_KEY: ${{ secrets.PROD_API_KEY }}
```

### 2. Least Privilege Permissions

```yaml
permissions:
  contents: read
  pull-requests: write
  statuses: write

jobs:
  test:
    permissions:
      contents: read
    runs-on: ubuntu-latest
```

### 3. Pin Action Versions

```yaml
# GOOD - pinned to SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1

# ACCEPTABLE - pinned to major version
- uses: actions/checkout@v4

# BAD - unpinned
- uses: actions/checkout@main
```

### 4. Verified Actions

```yaml
# Use only verified actions
- uses: actions/checkout@v4  # GitHub verified
- uses: pnpm/action-setup@v4 # Verified publisher
```

## Common Patterns for AAH Project

### AI Evaluations Workflow

```yaml
name: AI Evaluations

on:
  pull_request:
    paths:
      - 'packages/ai/**'
      - 'services/ai/**'
      - 'packages/ai-evals/**'

concurrency:
  group: ai-evals-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  run-evals:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      DATABASE_URL: ${{ secrets.EVAL_DATABASE_URL }}

    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/setup-monorepo

      - name: Build dependencies
        run: |
          pnpm --filter @aah/database build
          pnpm --filter @aah/ai build
          pnpm --filter @aah/ai-evals build

      - name: Run evaluations
        run: pnpm eval run --dataset all --format json

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: packages/ai-evals/eval-results/
```

### Monorepo Build Workflow

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/setup-monorepo

      - name: Build all packages
        run: pnpm run build

      - name: Type check
        run: pnpm run type-check

      - name: Lint
        run: pnpm run lint
```

### Vercel Deployment

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}

    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/setup-monorepo

      - name: Build project
        run: pnpm run build

      - name: Deploy to Vercel
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
          else
            vercel --token ${{ secrets.VERCEL_TOKEN }}
          fi
```
