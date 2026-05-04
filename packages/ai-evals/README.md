# AI Evaluation Framework (@aah/ai-evals)

AI evaluation package for the Athletic Academics Hub platform.

Status note:
- The package now verifies successfully for its current supported surface with:
  - `pnpm --filter @aah/ai-evals type-check`
  - `pnpm --filter @aah/ai-evals test -- --runInBand`
  - `pnpm --filter @aah/ai-evals cli --help`
- The public export surface was intentionally narrowed during stabilization to exclude unfinished or duplicated implementation stacks.
- Some command paths and subsystems still contain mock/demo or future-scope behavior and should not be oversold as full production functionality.

## Currently Verified

Verified during the latest stabilization pass:
- TypeScript type-check passes
- Jest test suite passes (111 tests)
- CLI entrypoint and command help work
- Config schema/types and interactive scaffolding load successfully

## Package Surface

Current stable/public exports are intentionally conservative:
- types
- scorers
- metrics
- version constant

Not currently exported from the main package surface:
- legacy dataset manager surface
- legacy base-runner surface
- orchestrator stack
- monitoring stack
- unfinished specialized runner stack

Those areas still need additional convergence work before they should be treated as stable public API.

## Installation

From the monorepo root:

```bash
pnpm install
```

## Verification Commands

```bash
pnpm --filter @aah/ai-evals type-check
pnpm --filter @aah/ai-evals test -- --runInBand
pnpm --filter @aah/ai-evals cli --help
```

## CLI Status

The CLI is available and the command surface is wired:

```bash
pnpm --filter @aah/ai-evals cli --help
pnpm --filter @aah/ai-evals cli run --help
pnpm --filter @aah/ai-evals cli compare --help
pnpm --filter @aah/ai-evals cli report --help
pnpm --filter @aah/ai-evals cli dataset --help
pnpm --filter @aah/ai-evals cli config --help
```

Important caveat:
- help output and command wiring are verified
- some command internals still use placeholder/mock/demo behavior
- this package should currently be presented as stabilized, not fully feature-complete

## Configuration Support

Config schema/types are implemented in:
- `src/config/types.ts`
- `src/config/parser.ts`
- `src/config/examples.ts`
- `src/cli/interactive.ts`

Supported config areas include:
- models
- runner
- scorer
- datasets
- output
- baseline

## What This Package Is Good For Right Now

- validating the current ai-evals package builds/tests/type-check cleanly
- exploring CLI command surface and options
- working with scorer and metrics code
- extending the package incrementally from a stable baseline
- continuing the convergence work on duplicated or unfinished subsystems

## What Should Still Be Treated Cautiously

- end-to-end CLI evaluation execution
- database-backed report generation as a finished workflow
- broad public exports for every internal subsystem
- unfinished duplicate implementation trees under runners/datasets/orchestrator/monitoring/safety/performance

## Development

```bash
# Type check
pnpm --filter @aah/ai-evals type-check

# Tests
pnpm --filter @aah/ai-evals test -- --runInBand

# CLI help
pnpm --filter @aah/ai-evals cli --help

# Build
pnpm --filter @aah/ai-evals build
```

## Recommended Next Steps

1. verify non-help CLI command paths one by one
2. reconcile `src/types.ts` vs `src/types/index.ts`
3. decide which narrowed exports should be restored after convergence
4. remove mock/demo behavior from CLI commands that should become production-grade
