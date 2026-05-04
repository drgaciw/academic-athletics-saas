# AI Evals CLI Guide

Command-line interface for the AI Evaluation Framework.

Status note:
- The CLI entrypoint is runnable and `pnpm --filter @aah/ai-evals cli --help` works.
- The package currently verifies cleanly with:
  - `pnpm --filter @aah/ai-evals type-check`
  - `pnpm --filter @aah/ai-evals test -- --runInBand`
- Some commands still contain mock/demo behavior and are not full production eval execution flows yet.
- Treat the CLI as a working interface shell around partially implemented command logic.

## Installation

From the monorepo root:

```bash
pnpm install
```

## Verified Commands

These commands are currently verified:

```bash
pnpm --filter @aah/ai-evals type-check
pnpm --filter @aah/ai-evals test -- --runInBand
pnpm --filter @aah/ai-evals cli --help
pnpm --filter @aah/ai-evals cli run --help
pnpm --filter @aah/ai-evals cli compare --help
pnpm --filter @aah/ai-evals cli report --help
pnpm --filter @aah/ai-evals cli dataset --help
pnpm --filter @aah/ai-evals cli config --help
```

## Usage

```bash
# Run via package filter from monorepo root
pnpm --filter @aah/ai-evals cli <command> [options]

# Package-specific helper scripts also exist
pnpm --filter @aah/ai-evals eval
pnpm --filter @aah/ai-evals compare
pnpm --filter @aah/ai-evals report
```

## Commands

### `run` - Execute Evaluations

Run AI evaluations with flexible configuration options.

Important note:
- The command surface exists and help output works.
- Current implementation still contains placeholder/skeleton behavior for actual eval execution.
- `--output` now writes a rendered artifact for the current skeleton/mock execution path.
- Use `--dry-run` and help output as safer validation paths unless you are intentionally working on CLI internals.

```bash
# Interactive mode
pnpm --filter @aah/ai-evals cli run --interactive

# Run with default configuration
pnpm --filter @aah/ai-evals cli run

# Run with custom config file
pnpm --filter @aah/ai-evals cli run --config ./my-eval.yaml

# Dry run (validate without executing)
pnpm --filter @aah/ai-evals cli run --dry-run --verbose
```

**Options:**
- `-c, --config <path>` - Configuration file path
- `-d, --dataset <ids...>` - Dataset IDs to run
- `-m, --model <models...>` - Model IDs to test
- `-b, --baseline <id>` - Baseline run ID for comparison
- `-o, --output <path>` - Output file path
- `-f, --format <format>` - Output format (json|table|markdown|html|csv)
- `-v, --verbose` - Verbose output
- `-i, --interactive` - Interactive mode
- `--dry-run` - Validate configuration without executing
- `--parallel` - Enable parallel execution
- `--concurrency <n>` - Set concurrency limit

### `compare` - Compare Models

Compare performance of multiple AI models side-by-side.

Important note:
- Command wiring and help output are live.
- Verified compare paths now load repository-backed run metrics when persisted completed runs are available for the selected dataset/models.
- The command still falls back to mock/demo comparison output when qualifying persisted data is unavailable.
- `--output` now writes the rendered comparison artifact to disk.

```bash
pnpm --filter @aah/ai-evals cli compare --models gpt-4-turbo claude-3-opus
pnpm --filter @aah/ai-evals cli compare --models gpt-4-turbo claude-3-opus --format markdown
```

**Options:**
- `-c, --config <path>` - Configuration file path
- `-d, --dataset <ids...>` - Dataset IDs to use for comparison
- `-m, --models <models...>` - Model IDs (required, minimum 2)
- `-o, --output <path>` - Output file path
- `-f, --format <format>` - Output format (json|table|markdown|html)
- `--metric <metrics...>` - Specific metrics to compare
- `-v, --verbose` - Verbose output

### `report` - Generate Reports

Generate reports from evaluation runs.

Important note:
- Help output is verified.
- Verified report paths now load repository-backed run data and active-baseline comparisons when persisted data is available.
- The command still falls back to mock/demo report output in verified automated paths when qualifying persisted data is unavailable.
- Live report execution currently requires repository DB configuration (for example `DATABASE_URL`) because repository access happens before fallback.
- `--output` now writes the rendered report artifact when the command completes successfully.

```bash
pnpm --filter @aah/ai-evals cli report --latest
pnpm --filter @aah/ai-evals cli report --latest --format markdown
```

**Options:**
- `-r, --run-id <id>` - Run ID to generate report for
- `-l, --latest` - Use latest run
- `-f, --format <format>` - Output format (json|markdown|html|pdf)
- `-o, --output <path>` - Output file path
- `--include-failures` - Include failed test details
- `--include-metrics` - Include detailed metrics
- `--compare-baseline` - Compare with baseline

### `dataset` - Manage Datasets

Manage datasets used by the package.

Important note:
- Command structure exists.
- Some dataset command behaviors remain mock/demo oriented.

```bash
pnpm --filter @aah/ai-evals cli dataset list
pnpm --filter @aah/ai-evals cli dataset show compliance-eligibility
pnpm --filter @aah/ai-evals cli dataset validate compliance-eligibility
```

### `config` - Manage Configuration

Manage evaluation configuration files.

This is one of the more concrete parts of the CLI surface:
- config schema/types exist
- interactive setup path exists
- examples/config scaffolding is present

```bash
pnpm --filter @aah/ai-evals cli config init
pnpm --filter @aah/ai-evals cli config init --template compliance
pnpm --filter @aah/ai-evals cli config validate ./my-eval.yaml
pnpm --filter @aah/ai-evals cli config show ./my-eval.yaml
```

## Configuration Files

Supported configuration formats:

```bash
ai-evals.config.yaml
ai-evals.config.yml
ai-evals.config.json
```

Typical config sections:
- `models`
- `runner`
- `scorer`
- `datasets`
- `output`
- `baseline`

## Current Reality vs Future Scope

Currently verified and working:
- package type-check passes
- package tests pass
- CLI entrypoint and per-command help work
- CLI/config schemas and interactive scaffolding load successfully

Not yet something this guide should oversell:
- full end-to-end eval execution
- full database-backed coverage across every CLI path
- complete non-mock dataset/report/compare flows
- production-grade orchestration through the CLI

## Recommended Usage Pattern Right Now

Use the CLI for:
- help discovery
- option discovery
- config scaffolding
- command-surface verification
- incremental development of CLI internals

Do not assume every command performs fully integrated production evaluation work unless you verify that path directly.
