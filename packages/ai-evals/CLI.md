# AI Evals CLI Guide

Command-line interface for the AI Evaluation Framework.

## Installation

```bash
# Install dependencies
pnpm install

# Make CLI executable
chmod +x cli.ts
```

## Usage

```bash
# Run via pnpm
pnpm cli <command> [options]

# Or after building
./cli.ts <command> [options]
```

## Commands

### `run` - Execute Evaluations

Run AI evaluations with flexible configuration options.

```bash
# Interactive mode (recommended for first-time users)
pnpm cli run --interactive

# Run with default configuration
pnpm cli run

# Run with custom config file
pnpm cli run --config ./my-eval.yaml

# Run specific datasets
pnpm cli run --dataset compliance-eligibility compliance-gpa

# Run with specific models
pnpm cli run --model gpt-4-turbo claude-3-opus

# Compare against baseline
pnpm cli run --baseline run_abc123

# Save results to file
pnpm cli run --output ./results/eval.json --format json

# Dry run (validate without executing)
pnpm cli run --dry-run --verbose
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
- `--concurrency <n>` - Set concurrency limit (default: 5)

### `compare` - Compare Models

Compare performance of multiple AI models side-by-side.

```bash
# Compare 2+ models
pnpm cli compare --models gpt-4-turbo claude-3-opus gpt-3.5-turbo

# Compare on specific datasets
pnpm cli compare \
  --models gpt-4-turbo claude-3-opus \
  --dataset compliance-full

# Focus on specific metrics
pnpm cli compare \
  --models gpt-4-turbo claude-3-opus \
  --metric accuracy latency cost

# Output to markdown
pnpm cli compare \
  --models gpt-4-turbo claude-3-opus \
  --format markdown \
  --output comparison-report.md
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

Generate detailed reports from evaluation runs.

```bash
# Report for specific run
pnpm cli report --run-id run_abc123

# Report for latest run
pnpm cli report --latest

# Generate markdown report
pnpm cli report --latest --format markdown --output report.md

# Include baseline comparison
pnpm cli report --run-id run_abc123 --compare-baseline

# Include only failures
pnpm cli report --latest --include-failures --format table
```

**Options:**
- `-r, --run-id <id>` - Run ID to generate report for
- `-l, --latest` - Use latest run
- `-f, --format <format>` - Output format (json|markdown|html|pdf)
- `-o, --output <path>` - Output file path
- `--include-failures` - Include failed test details (default: true)
- `--include-metrics` - Include detailed metrics (default: true)
- `--compare-baseline` - Compare with baseline

### `dataset` - Manage Datasets

Manage test datasets for evaluations.

```bash
# List all datasets
pnpm cli dataset list

# List with details
pnpm cli dataset list --verbose

# Show dataset details
pnpm cli dataset show compliance-eligibility

# Validate dataset schema
pnpm cli dataset validate compliance-eligibility

# Create new dataset
pnpm cli dataset create \
  --name "My Custom Tests" \
  --description "Custom test cases for feature X" \
  --file ./my-tests.json
```

**Subcommands:**
- `list` - List all available datasets
- `show <id>` - Show dataset details
- `validate <id>` - Validate dataset schema
- `create` - Create new dataset

### `config` - Manage Configuration

Manage evaluation configuration files.

```bash
# Initialize default config
pnpm cli config init

# Initialize with template
pnpm cli config init --template compliance --format yaml

# Available templates:
# - default: Generic configuration
# - compliance: NCAA compliance testing
# - conversational: Chat quality evaluation
# - rag: RAG pipeline testing
# - comparison: Multi-model comparison

# Validate configuration
pnpm cli config validate ./my-eval.yaml

# Display configuration
pnpm cli config show ./my-eval.yaml

# Display as YAML
pnpm cli config show ./my-eval.json --format yaml
```

**Subcommands:**
- `init` - Initialize new configuration file
- `validate <path>` - Validate configuration file
- `show <path>` - Display configuration

## Configuration Files

### File Formats

The CLI supports both YAML and JSON formats:

```bash
# YAML (recommended for readability)
ai-evals.config.yaml
ai-evals.config.yml

# JSON (for programmatic generation)
ai-evals.config.json
```

### Configuration Priority

The CLI loads configuration in this order:

1. File specified with `--config` option (highest priority)
2. `./ai-evals.config.yaml`
3. `./ai-evals.config.yml`
4. `./ai-evals.config.json`
5. `./.ai-evals.yaml`
6. `./.ai-evals.json`
7. Default configuration (lowest priority)

### Example Configuration

See `examples/` directory for complete examples:

- `compliance-eval.yaml` - NCAA compliance testing
- `conversational-eval.yaml` - Chat quality assessment
- `model-comparison.json` - Multi-model comparison

## Interactive Mode

Interactive mode provides a guided wizard for creating evaluations:

```bash
pnpm cli run --interactive
```

**Features:**
1. **Model Selection** - Choose providers and models with recommendations
2. **Dataset Selection** - Browse and filter available datasets
3. **Scorer Configuration** - Configure scoring strategy and thresholds
4. **Runner Settings** - Set timeout, retries, and concurrency
5. **Output Options** - Choose format and destination
6. **Baseline Setup** - Enable baseline comparison
7. **Configuration Preview** - Review before execution

## Environment Variables

```bash
# API Keys (required)
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...

# Optional
export NODE_ENV=development
export DEBUG=true
```

Configuration files can reference environment variables, or you can set them directly in the config:

```yaml
apiKeys:
  openai: ${OPENAI_API_KEY}
  anthropic: ${ANTHROPIC_API_KEY}
```

## Output Formats

### Table (Default)

Human-readable table format for terminal viewing:

```bash
pnpm cli run --format table
```

### JSON

Machine-readable format for CI/CD integration:

```bash
pnpm cli run --format json --output results.json
```

### Markdown

Documentation-friendly format with formatting:

```bash
pnpm cli run --format markdown --output report.md
```

### HTML

Web-ready format with styling:

```bash
pnpm cli run --format html --output report.html
```

### CSV

Spreadsheet-friendly format for data analysis:

```bash
pnpm cli run --format csv --output results.csv
```

## Examples

### Quick Start

```bash
# Generate config template
pnpm cli config init --template compliance

# Edit the config file
# vim ai-evals.config.yaml

# Run evaluation
pnpm cli run

# View report
pnpm cli report --latest
```

### CI/CD Integration

```bash
# Run in CI with specific config
pnpm cli run \
  --config .github/evals/ci.yaml \
  --format json \
  --output results.json

# Check exit code
if [ $? -ne 0 ]; then
  echo "Evaluation failed"
  exit 1
fi
```

### Model Comparison Workflow

```bash
# 1. Compare models
pnpm cli compare \
  --models gpt-4-turbo claude-3-opus gpt-3.5-turbo \
  --output comparison.json

# 2. Select best model from results
# (manual review of comparison.json)

# 3. Run full evaluation with selected model
pnpm cli run \
  --model gpt-4-turbo \
  --output full-eval.json

# 4. Set as baseline
# (note the run ID from output)
```

### Regression Testing

```bash
# 1. Initial run (establish baseline)
pnpm cli run --output baseline.json
# Note the run ID: run_abc123

# 2. After code changes, run with baseline comparison
pnpm cli run --baseline run_abc123

# 3. Check for regressions
# CLI will fail with exit code 1 if regressions detected
```

## Troubleshooting

### Configuration Errors

```bash
# Validate configuration
pnpm cli config validate ./my-eval.yaml

# Run with verbose output
pnpm cli run --verbose
```

### API Rate Limits

Reduce concurrency in your configuration:

```yaml
runner:
  concurrency: 3
  rateLimit:
    maxRequests: 50
    perSeconds: 60
```

### Long Execution Times

Enable parallel execution:

```bash
pnpm cli run --parallel --concurrency 10
```

### Missing Datasets

List available datasets:

```bash
pnpm cli dataset list --verbose
```

## Advanced Usage

### Custom Scorers

Create a custom scorer module:

```typescript
// scorers/my-scorer.ts
export async function scoreResult(expected: any, actual: any) {
  // Custom scoring logic
  const score = calculateScore(expected, actual);

  return {
    passed: score >= 0.8,
    score,
    explanation: 'Custom scoring explanation'
  };
}
```

Use in configuration:

```yaml
scorer:
  strategy: custom
  customScorer: ./scorers/my-scorer.ts
  threshold: 0.8
```

### Programmatic Usage

Use the CLI commands programmatically:

```typescript
import { createRunCommand } from '@aah/ai-evals';

const runCommand = createRunCommand();
await runCommand.parseAsync(['--config', './my-eval.yaml']);
```

## Getting Help

```bash
# General help
pnpm cli --help

# Command-specific help
pnpm cli run --help
pnpm cli compare --help
pnpm cli report --help
pnpm cli dataset --help
pnpm cli config --help
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/athletic-academics-hub/issues
- Documentation: See README.md for full package documentation
