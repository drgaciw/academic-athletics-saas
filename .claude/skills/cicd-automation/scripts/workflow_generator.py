#!/usr/bin/env python3
"""
CI/CD Workflow Generator

Automated tool for creating and scaffolding CI/CD workflows.
Supports GitHub Actions, GitLab CI, and custom templates.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional

import yaml


class WorkflowGenerator:
    """Generate CI/CD workflow files from templates."""

    def __init__(self, output_dir: str = ".github/workflows"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_github_actions(
        self,
        template: str,
        name: str = "CI/CD Pipeline",
        on_events: Optional[List[str]] = None,
    ) -> str:
        """Generate GitHub Actions workflow."""
        if on_events is None:
            on_events = ["push", "pull_request"]

        templates = {
            "ai-evals": self._ai_evals_template,
            "monorepo-build": self._monorepo_build_template,
            "deployment-pipeline": self._deployment_pipeline_template,
            "security-scan": self._security_scan_template,
            "test-suite": self._test_suite_template,
        }

        if template not in templates:
            raise ValueError(
                f"Unknown template: {template}. "
                f"Available: {', '.join(templates.keys())}"
            )

        workflow_content = templates[template](name, on_events)
        output_file = self.output_dir / f"{template}.yml"

        with open(output_file, "w") as f:
            yaml.dump(workflow_content, f, sort_keys=False, default_flow_style=False)

        print(f"✓ Generated workflow: {output_file}")
        return str(output_file)

    def _ai_evals_template(
        self, name: str, on_events: List[str]
    ) -> Dict:
        """AI Evaluations workflow template."""
        return {
            "name": name or "AI Evaluations",
            "on": {
                "pull_request": {
                    "paths": [
                        "packages/ai/**",
                        "services/ai/**",
                        "packages/ai-evals/**",
                    ]
                },
                "workflow_dispatch": {
                    "inputs": {
                        "force_run": {
                            "description": "Force run all evals",
                            "required": False,
                            "default": "false",
                            "type": "boolean",
                        }
                    }
                },
            },
            "concurrency": {
                "group": "ai-evals-${{ github.event.pull_request.number || github.ref }}",
                "cancel-in-progress": True,
            },
            "env": {
                "NODE_VERSION": "20",
                "PNPM_VERSION": "9",
            },
            "jobs": {
                "run-evals": {
                    "runs-on": "ubuntu-latest",
                    "timeout-minutes": 30,
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {
                            "name": "Setup pnpm",
                            "uses": "pnpm/action-setup@v4",
                            "with": {"version": "${{ env.PNPM_VERSION }}"},
                        },
                        {
                            "name": "Setup Node.js",
                            "uses": "actions/setup-node@v4",
                            "with": {
                                "node-version": "${{ env.NODE_VERSION }}",
                                "cache": "pnpm",
                            },
                        },
                        {
                            "name": "Install dependencies",
                            "run": "pnpm install --frozen-lockfile",
                        },
                        {
                            "name": "Build packages",
                            "run": "pnpm --filter @aah/database build && "
                            "pnpm --filter @aah/ai build && "
                            "pnpm --filter @aah/ai-evals build",
                        },
                        {
                            "name": "Run evaluations",
                            "env": {
                                "ANTHROPIC_API_KEY": "${{ secrets.ANTHROPIC_API_KEY }}",
                                "DATABASE_URL": "${{ secrets.EVAL_DATABASE_URL }}",
                            },
                            "run": "pnpm eval run --dataset all --format json",
                        },
                        {
                            "name": "Upload results",
                            "if": "always()",
                            "uses": "actions/upload-artifact@v4",
                            "with": {
                                "name": "eval-results",
                                "path": "packages/ai-evals/eval-results/",
                                "retention-days": 30,
                            },
                        },
                    ],
                }
            },
        }

    def _monorepo_build_template(
        self, name: str, on_events: List[str]
    ) -> Dict:
        """Monorepo build workflow template."""
        return {
            "name": name or "Monorepo Build",
            "on": on_events or ["push", "pull_request"],
            "concurrency": {
                "group": "build-${{ github.ref }}",
                "cancel-in-progress": True,
            },
            "env": {
                "NODE_VERSION": "20",
                "PNPM_VERSION": "9",
            },
            "jobs": {
                "detect-changes": {
                    "runs-on": "ubuntu-latest",
                    "outputs": {
                        "packages": "${{ steps.filter.outputs.changes }}",
                    },
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {
                            "uses": "dorny/paths-filter@v3",
                            "id": "filter",
                            "with": {
                                "filters": {
                                    "ai": ["packages/ai/**"],
                                    "database": ["packages/database/**"],
                                    "ui": ["packages/ui/**"],
                                }
                            },
                        },
                    ],
                },
                "build": {
                    "needs": "detect-changes",
                    "if": "needs.detect-changes.outputs.packages != '[]'",
                    "runs-on": "ubuntu-latest",
                    "strategy": {
                        "fail-fast": False,
                        "matrix": {
                            "package": "${{ fromJson(needs.detect-changes.outputs.packages) }}"
                        },
                    },
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {
                            "uses": "pnpm/action-setup@v4",
                            "with": {"version": "${{ env.PNPM_VERSION }}"},
                        },
                        {
                            "uses": "actions/setup-node@v4",
                            "with": {
                                "node-version": "${{ env.NODE_VERSION }}",
                                "cache": "pnpm",
                            },
                        },
                        {"run": "pnpm install --frozen-lockfile"},
                        {
                            "name": "Build ${{ matrix.package }}",
                            "run": "pnpm --filter @aah/${{ matrix.package }} build",
                        },
                    ],
                },
            },
        }

    def _deployment_pipeline_template(
        self, name: str, on_events: List[str]
    ) -> Dict:
        """Full deployment pipeline template."""
        return {
            "name": name or "Deploy",
            "on": {
                "push": {"branches": ["main"]},
                "pull_request": {},
            },
            "concurrency": {
                "group": "deploy-${{ github.ref }}",
                "cancel-in-progress": False,
            },
            "jobs": {
                "test": {
                    "runs-on": "ubuntu-latest",
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {"uses": "./.github/actions/setup-monorepo"},
                        {"run": "pnpm test"},
                        {"run": "pnpm lint"},
                        {"run": "pnpm type-check"},
                    ],
                },
                "deploy-preview": {
                    "needs": "test",
                    "if": "github.event_name == 'pull_request'",
                    "runs-on": "ubuntu-latest",
                    "environment": "preview",
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {"uses": "./.github/actions/setup-monorepo"},
                        {"run": "pnpm build"},
                        {
                            "name": "Deploy to Vercel Preview",
                            "run": "vercel --token ${{ secrets.VERCEL_TOKEN }}",
                        },
                    ],
                },
                "deploy-production": {
                    "needs": "test",
                    "if": "github.ref == 'refs/heads/main'",
                    "runs-on": "ubuntu-latest",
                    "environment": "production",
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {"uses": "./.github/actions/setup-monorepo"},
                        {"run": "pnpm build"},
                        {
                            "name": "Deploy to Vercel Production",
                            "run": "vercel --prod --token ${{ secrets.VERCEL_TOKEN }}",
                        },
                    ],
                },
            },
        }

    def _security_scan_template(
        self, name: str, on_events: List[str]
    ) -> Dict:
        """Security scanning workflow template."""
        return {
            "name": name or "Security Scan",
            "on": {
                "pull_request": {},
                "schedule": [{"cron": "0 0 * * 1"}],  # Weekly
            },
            "jobs": {
                "dependency-scan": {
                    "runs-on": "ubuntu-latest",
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {
                            "name": "Run npm audit",
                            "run": "pnpm audit --audit-level=high",
                        },
                    ],
                },
                "code-scan": {
                    "runs-on": "ubuntu-latest",
                    "permissions": {
                        "security-events": "write",
                        "contents": "read",
                    },
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {
                            "uses": "github/codeql-action/init@v3",
                            "with": {"languages": "javascript,typescript"},
                        },
                        {"uses": "github/codeql-action/autobuild@v3"},
                        {"uses": "github/codeql-action/analyze@v3"},
                    ],
                },
            },
        }

    def _test_suite_template(
        self, name: str, on_events: List[str]
    ) -> Dict:
        """Test suite workflow template."""
        return {
            "name": name or "Test Suite",
            "on": on_events or ["push", "pull_request"],
            "jobs": {
                "unit-tests": {
                    "runs-on": "ubuntu-latest",
                    "strategy": {
                        "matrix": {
                            "node-version": [18, 20],
                        }
                    },
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {
                            "uses": "actions/setup-node@v4",
                            "with": {
                                "node-version": "${{ matrix.node-version }}",
                                "cache": "pnpm",
                            },
                        },
                        {"run": "pnpm install --frozen-lockfile"},
                        {"run": "pnpm test"},
                        {
                            "name": "Upload coverage",
                            "if": "matrix.node-version == 20",
                            "uses": "codecov/codecov-action@v4",
                        },
                    ],
                },
                "e2e-tests": {
                    "runs-on": "ubuntu-latest",
                    "steps": [
                        {"uses": "actions/checkout@v4"},
                        {"uses": "./.github/actions/setup-monorepo"},
                        {"run": "pnpm test:e2e"},
                    ],
                },
            },
        }


def main():
    parser = argparse.ArgumentParser(
        description="Generate CI/CD workflow files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate AI evaluations workflow
  python workflow_generator.py --type github-actions --template ai-evals

  # Generate monorepo build workflow
  python workflow_generator.py --template monorepo-build --output ./workflows

  # Generate deployment pipeline
  python workflow_generator.py --template deployment-pipeline
        """,
    )

    parser.add_argument(
        "--type",
        choices=["github-actions", "gitlab-ci"],
        default="github-actions",
        help="Type of CI/CD platform (default: github-actions)",
    )

    parser.add_argument(
        "--template",
        required=True,
        choices=[
            "ai-evals",
            "monorepo-build",
            "deployment-pipeline",
            "security-scan",
            "test-suite",
        ],
        help="Workflow template to generate",
    )

    parser.add_argument(
        "--output",
        default=".github/workflows",
        help="Output directory (default: .github/workflows)",
    )

    parser.add_argument(
        "--name",
        help="Custom workflow name (default: template-specific)",
    )

    args = parser.parse_args()

    try:
        generator = WorkflowGenerator(output_dir=args.output)

        if args.type == "github-actions":
            workflow_file = generator.generate_github_actions(
                template=args.template,
                name=args.name,
            )
            print(f"\n✓ Successfully generated {args.template} workflow")
            print(f"  Location: {workflow_file}")
            print(f"\nNext steps:")
            print(f"  1. Review the generated workflow")
            print(f"  2. Commit the file to your repository")
            print(f"  3. Ensure required secrets are configured")
        else:
            print(f"GitLab CI support coming soon")
            return 1

        return 0

    except Exception as e:
        print(f"Error generating workflow: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
