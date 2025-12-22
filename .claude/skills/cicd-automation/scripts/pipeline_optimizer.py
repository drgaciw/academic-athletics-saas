#!/usr/bin/env python3
"""
CI/CD Pipeline Optimizer

Advanced optimization for CI/CD pipeline performance.
Analyzes workflows and suggests improvements for speed and cost.
"""

import argparse
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import yaml


class PipelineOptimizer:
    """Analyze and optimize CI/CD pipelines."""

    def __init__(self):
        self.suggestions = []
        self.metrics = {}

    def analyze_workflow(self, workflow_file: str) -> Dict:
        """Analyze a GitHub Actions workflow file."""
        print(f"📊 Analyzing workflow: {workflow_file}\n")

        with open(workflow_file) as f:
            workflow = yaml.safe_load(f)

        analyses = [
            self._check_caching,
            self._check_parallelization,
            self._check_conditional_execution,
            self._check_timeouts,
            self._check_concurrency,
        ]

        for analysis_func in analyses:
            analysis_func(workflow, workflow_file)

        return self._generate_report()

    def _check_caching(self, workflow: Dict, file_path: str):
        """Check caching configuration."""
        issues = []
        has_pnpm_cache = False
        has_turbo_cache = False

        for job_name, job in workflow.get("jobs", {}).items():
            steps = job.get("steps", [])

            # Check for caching steps
            for step in steps:
                uses = step.get("uses", "")
                if "actions/cache" in uses:
                    path = step.get("with", {}).get("path", "")
                    if ".pnpm-store" in str(path) or "pnpm store" in str(step.get("run", "")):
                        has_pnpm_cache = True
                    if ".turbo" in str(path):
                        has_turbo_cache = True

                # Check for setup-node with cache
                if "setup-node" in uses:
                    if step.get("with", {}).get("cache") == "pnpm":
                        has_pnpm_cache = True

        if not has_pnpm_cache:
            self.suggestions.append({
                "category": "Caching",
                "severity": "high",
                "title": "Missing pnpm cache",
                "description": "Add pnpm caching to speed up dependency installation",
                "improvement": "~2-5 minutes faster",
                "code": """- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'""",
            })

        if not has_turbo_cache:
            self.suggestions.append({
                "category": "Caching",
                "severity": "medium",
                "title": "Missing Turborepo cache",
                "description": "Add Turborepo caching for build outputs",
                "improvement": "~1-3 minutes faster",
                "code": """- uses: actions/cache@v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-""",
            })

    def _check_parallelization(self, workflow: Dict, file_path: str):
        """Check job parallelization opportunities."""
        jobs = workflow.get("jobs", {})
        job_dependencies = defaultdict(list)

        # Build dependency graph
        for job_name, job in jobs.items():
            needs = job.get("needs", [])
            if isinstance(needs, str):
                needs = [needs]
            job_dependencies[job_name] = needs

        # Find jobs that could run in parallel
        sequential_jobs = [
            name for name, deps in job_dependencies.items() if deps
        ]

        if len(sequential_jobs) > 3:
            self.suggestions.append({
                "category": "Parallelization",
                "severity": "medium",
                "title": "Potential for more parallelization",
                "description": f"{len(sequential_jobs)} jobs have dependencies. Review if all are necessary.",
                "improvement": "~20-40% time reduction",
            })

        # Check for matrix builds
        for job_name, job in jobs.items():
            strategy = job.get("strategy", {})
            matrix = strategy.get("matrix", {})

            if matrix and not strategy.get("fail-fast"):
                # Good: fail-fast disabled allows parallel execution
                pass
            elif len(job.get("steps", [])) > 5 and not matrix:
                self.suggestions.append({
                    "category": "Parallelization",
                    "severity": "low",
                    "title": f"Consider matrix build for job '{job_name}'",
                    "description": "Job has many steps and might benefit from matrix strategy",
                    "improvement": "Variable depending on job",
                })

    def _check_conditional_execution(self, workflow: Dict, file_path: str):
        """Check for conditional execution optimizations."""
        jobs = workflow.get("jobs", {})

        # Check for path filters
        on_config = workflow.get("on", {})
        has_path_filter = False

        if isinstance(on_config, dict):
            for event, config in on_config.items():
                if isinstance(config, dict) and "paths" in config:
                    has_path_filter = True

        if not has_path_filter and "push" in on_config:
            self.suggestions.append({
                "category": "Conditional Execution",
                "severity": "medium",
                "title": "Missing path filters",
                "description": "Add path filters to avoid running workflow on unrelated changes",
                "improvement": "Reduce unnecessary workflow runs",
                "code": """on:
  push:
    paths:
      - 'src/**'
      - 'package.json'
      - 'pnpm-lock.yaml'""",
            })

        # Check for draft PR skip
        has_draft_skip = any(
            "github.event.pull_request.draft" in str(job.get("if", ""))
            for job in jobs.values()
        )

        if not has_draft_skip and "pull_request" in on_config:
            self.suggestions.append({
                "category": "Conditional Execution",
                "severity": "low",
                "title": "Skip draft PRs",
                "description": "Skip running workflows on draft PRs to save resources",
                "code": """jobs:
  build:
    if: github.event.pull_request.draft == false""",
            })

    def _check_timeouts(self, workflow: Dict, file_path: str):
        """Check timeout configurations."""
        jobs = workflow.get("jobs", {})

        for job_name, job in jobs.items():
            timeout = job.get("timeout-minutes")

            if not timeout:
                self.suggestions.append({
                    "category": "Timeouts",
                    "severity": "low",
                    "title": f"Missing timeout for job '{job_name}'",
                    "description": "Add timeout to prevent hung jobs",
                    "code": f"""jobs:
  {job_name}:
    timeout-minutes: 30  # Adjust as needed""",
                })
            elif timeout > 60:
                self.suggestions.append({
                    "category": "Timeouts",
                    "severity": "medium",
                    "title": f"Long timeout for job '{job_name}' ({timeout} min)",
                    "description": "Consider if job can be optimized or split",
                })

    def _check_concurrency(self, workflow: Dict, file_path: str):
        """Check concurrency controls."""
        concurrency = workflow.get("concurrency")

        if not concurrency:
            self.suggestions.append({
                "category": "Concurrency",
                "severity": "medium",
                "title": "Missing concurrency control",
                "description": "Add concurrency control to cancel outdated runs",
                "improvement": "Reduce resource usage",
                "code": """concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true""",
            })

    def _generate_report(self) -> Dict:
        """Generate optimization report."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_suggestions": len(self.suggestions),
            "by_severity": defaultdict(int),
            "by_category": defaultdict(int),
            "suggestions": self.suggestions,
        }

        for suggestion in self.suggestions:
            report["by_severity"][suggestion["severity"]] += 1
            report["by_category"][suggestion["category"]] += 1

        return report

    def print_report(self, report: Dict):
        """Print optimization report."""
        print(f"\n{'='*70}")
        print("PIPELINE OPTIMIZATION REPORT")
        print(f"{'='*70}\n")

        print(f"Total Suggestions: {report['total_suggestions']}")
        print(f"High Priority: {report['by_severity']['high']}")
        print(f"Medium Priority: {report['by_severity']['medium']}")
        print(f"Low Priority: {report['by_severity']['low']}")

        print(f"\n{'='*70}\n")

        # Group by category
        by_category = defaultdict(list)
        for suggestion in report["suggestions"]:
            by_category[suggestion["category"]].append(suggestion)

        for category, suggestions in sorted(by_category.items()):
            print(f"\n## {category} ({len(suggestions)} suggestion{'s' if len(suggestions) > 1 else ''})")
            print("-" * 70)

            for i, suggestion in enumerate(suggestions, 1):
                severity_icon = {
                    "high": "🔴",
                    "medium": "🟡",
                    "low": "🟢",
                }[suggestion["severity"]]

                print(f"\n{i}. {severity_icon} {suggestion['title']}")
                print(f"   {suggestion['description']}")

                if "improvement" in suggestion:
                    print(f"   💡 Improvement: {suggestion['improvement']}")

                if "code" in suggestion:
                    print(f"\n   Suggested code:")
                    for line in suggestion["code"].split("\n"):
                        print(f"   {line}")

        print(f"\n{'='*70}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Optimize CI/CD pipeline performance",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze workflow
  python pipeline_optimizer.py --analyze .github/workflows/ci.yml

  # Analyze and output JSON
  python pipeline_optimizer.py --analyze ci.yml --json --output report.json

  # Analyze all workflows
  python pipeline_optimizer.py --analyze .github/workflows/*.yml
        """,
    )

    parser.add_argument(
        "--analyze",
        "-a",
        required=True,
        help="Workflow file to analyze",
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON",
    )

    parser.add_argument(
        "--output",
        "-o",
        help="Output file (default: stdout)",
    )

    parser.add_argument(
        "--threshold",
        type=int,
        help="Only show suggestions above this severity threshold (1=low, 2=medium, 3=high)",
    )

    args = parser.parse_args()

    try:
        optimizer = PipelineOptimizer()
        report = optimizer.analyze_workflow(args.analyze)

        if args.json:
            output = json.dumps(report, indent=2)
            if args.output:
                with open(args.output, "w") as f:
                    f.write(output)
                print(f"Report saved to {args.output}")
            else:
                print(output)
        else:
            optimizer.print_report(report)

        # Return error code based on high-priority suggestions
        return 1 if report["by_severity"]["high"] > 0 else 0

    except FileNotFoundError:
        print(f"Error: Workflow file not found: {args.analyze}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Error analyzing workflow: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
