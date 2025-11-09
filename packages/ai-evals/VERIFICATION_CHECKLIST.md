# Tasks 7.1 & 7.2 Verification Checklist

## Installation & Setup

- [ ] Run `pnpm install` from monorepo root
- [ ] Verify dependencies installed correctly
- [ ] Check TypeScript compilation: `pnpm --filter @aah/ai-evals type-check`

## CLI Commands Verification

### Help & Documentation

- [ ] `pnpm --filter @aah/ai-evals cli --help` - Shows main help
- [ ] `pnpm --filter @aah/ai-evals cli run --help` - Shows run command help
- [ ] `pnpm --filter @aah/ai-evals cli compare --help` - Shows compare command help
- [ ] `pnpm --filter @aah/ai-evals cli report --help` - Shows report command help
- [ ] `pnpm --filter @aah/ai-evals cli dataset --help` - Shows dataset command help
- [ ] `pnpm --filter @aah/ai-evals cli config --help` - Shows config command help

### Config Command

- [ ] `pnpm --filter @aah/ai-evals cli config init` - Creates default config
- [ ] `pnpm --filter @aah/ai-evals cli config init --template compliance` - Creates compliance template
- [ ] `pnpm --filter @aah/ai-evals cli config init --template conversational --format yaml` - Creates YAML config
- [ ] `pnpm --filter @aah/ai-evals cli config show ./ai-evals.config.yaml` - Displays config (if created)
- [ ] `pnpm --filter @aah/ai-evals cli config validate ./ai-evals.config.yaml` - Validates config (if created)

### Dataset Command

- [ ] `pnpm --filter @aah/ai-evals cli dataset list` - Lists datasets (mock)
- [ ] `pnpm --filter @aah/ai-evals cli dataset list --verbose` - Lists with details
- [ ] `pnpm --filter @aah/ai-evals cli dataset show compliance-eligibility` - Shows dataset details (mock)
- [ ] `pnpm --filter @aah/ai-evals cli dataset validate compliance-eligibility` - Validates dataset (mock)

### Run Command

- [ ] `pnpm --filter @aah/ai-evals cli run --dry-run` - Dry run with default config
- [ ] `pnpm --filter @aah/ai-evals cli run --dry-run --verbose` - Dry run with verbose output
- [ ] `pnpm --filter @aah/ai-evals cli run --help` - Shows all options
- [ ] Test `--config` option (after creating config file)
- [ ] Test `--dataset` option
- [ ] Test `--model` option
- [ ] Test `--output` option
- [ ] Test `--format` option (json, table, markdown)

### Compare Command

- [ ] `pnpm --filter @aah/ai-evals cli compare --models gpt-4-turbo claude-3-opus` - Model comparison (mock)
- [ ] `pnpm --filter @aah/ai-evals cli compare --models gpt-4 claude-3-opus --verbose` - Verbose comparison
- [ ] Test `--dataset` option
- [ ] Test `--metric` option
- [ ] Test `--format` option

### Report Command

- [ ] `pnpm --filter @aah/ai-evals cli report --latest` - Latest report (mock)
- [ ] `pnpm --filter @aah/ai-evals cli report --run-id test123` - Specific run (mock)
- [ ] `pnpm --filter @aah/ai-evals cli report --latest --format markdown` - Markdown format
- [ ] `pnpm --filter @aah/ai-evals cli report --latest --format json` - JSON format
- [ ] Test `--include-failures` option
- [ ] Test `--compare-baseline` option

### Interactive Mode

- [ ] `pnpm --filter @aah/ai-evals cli run --interactive` - Start interactive mode
- [ ] Navigate through all prompts (can cancel at end)
- [ ] Verify model selection works
- [ ] Verify dataset selection works
- [ ] Verify scorer configuration works
- [ ] Verify output configuration works
- [ ] Verify baseline configuration works

## Configuration File Format

### YAML Configuration

- [ ] Create `ai-evals.config.yaml` from template
- [ ] Verify YAML parsing works
- [ ] Verify validation works
- [ ] Test all configuration sections:
  - [ ] `models` array
  - [ ] `runner` settings
  - [ ] `scorer` configuration
  - [ ] `datasets` selection
  - [ ] `output` options
  - [ ] `baseline` settings

### JSON Configuration

- [ ] Create `ai-evals.config.json` from template
- [ ] Verify JSON parsing works
- [ ] Verify validation works

### Configuration Validation

- [ ] Test with invalid YAML syntax - should show error
- [ ] Test with invalid schema - should show validation errors
- [ ] Test with missing required fields - should show errors
- [ ] Test with environment variable override:
  - [ ] Set `OPENAI_API_KEY` env var
  - [ ] Verify it's used in config

## Example Configurations

- [ ] Review `examples/compliance-eval.yaml`
- [ ] Review `examples/conversational-eval.yaml`
- [ ] Review `examples/model-comparison.json`
- [ ] Verify each can be loaded with `--config` option

## File Structure

Verify all files exist:

- [ ] `cli.ts` - CLI entry point
- [ ] `package.json` - Package configuration
- [ ] `tsconfig.json` - TypeScript config
- [ ] `tsup.config.ts` - Build config
- [ ] `.gitignore` - Git ignore file
- [ ] `.npmignore` - NPM ignore file
- [ ] `README.md` - Package documentation
- [ ] `CLI.md` - CLI documentation
- [ ] `TASKS_7.1_7.2_SUMMARY.md` - Implementation summary
- [ ] `VERIFICATION_CHECKLIST.md` - This file

### src/config/

- [ ] `src/config/index.ts`
- [ ] `src/config/types.ts`
- [ ] `src/config/parser.ts`
- [ ] `src/config/examples.ts`

### src/cli/

- [ ] `src/cli/utils.ts`
- [ ] `src/cli/interactive.ts`

### src/cli/commands/

- [ ] `src/cli/commands/index.ts`
- [ ] `src/cli/commands/run.ts`
- [ ] `src/cli/commands/compare.ts`
- [ ] `src/cli/commands/report.ts`
- [ ] `src/cli/commands/dataset.ts`
- [ ] `src/cli/commands/config.ts`

### examples/

- [ ] `examples/compliance-eval.yaml`
- [ ] `examples/conversational-eval.yaml`
- [ ] `examples/model-comparison.json`

## TypeScript Compilation

- [ ] `pnpm --filter @aah/ai-evals type-check` - No errors
- [ ] All types properly exported from `src/index.ts`
- [ ] All Zod schemas validate correctly
- [ ] Config types are type-safe

## Documentation

- [ ] README.md is comprehensive
- [ ] CLI.md provides detailed CLI usage
- [ ] Example configurations are well-documented
- [ ] All commands have help text
- [ ] Error messages are clear and actionable

## Integration Points

Note: These will be tested when core components are implemented

- [ ] Ready for Dataset Manager integration (Task 2)
- [ ] Ready for Runner Engine integration (Task 3)
- [ ] Ready for Scorer Engine integration (Task 4)
- [ ] Ready for Orchestrator integration (Task 5)
- [ ] Ready for Database integration (Task 6)

## Known Limitations

Current implementation includes:
- ✅ Full CLI structure and commands
- ✅ Configuration parsing and validation
- ✅ Interactive mode
- ✅ Mock data for demonstration
- ⏳ Pending: Integration with eval execution engine
- ⏳ Pending: Integration with actual datasets
- ⏳ Pending: Integration with database for results

## Success Criteria

Tasks 7.1 and 7.2 are complete when:

- [x] CLI has all 5 main commands (run, compare, report, dataset, config)
- [x] Interactive mode provides guided workflow
- [x] Configuration files (YAML/JSON) are supported
- [x] Zod validation for all config schemas
- [x] Environment variable support
- [x] Example configurations provided
- [x] Comprehensive help documentation
- [x] Rich terminal output with colors and formatting
- [x] Ready for integration with core components

## Next Steps

After verification:

1. Implement Runner Engine (Task 3)
2. Implement Scorer Engine (Task 4)
3. Implement Orchestrator (Task 5)
4. Connect to Database (Task 6)
5. Replace mock data with real implementations
6. Add end-to-end tests
