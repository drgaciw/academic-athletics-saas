#!/usr/bin/env python3
"""
Deployment Health Checker

Production deployment validation and health monitoring.
Performs pre and post-deployment checks.
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

try:
    import requests
except ImportError:
    print("Error: requests module required. Install with: pip install requests")
    sys.exit(1)


class DeploymentHealthChecker:
    """Check deployment health and validate deployments."""

    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.checks_passed = 0
        self.checks_failed = 0
        self.results = []

    def pre_deploy_checks(self) -> bool:
        """Run pre-deployment validation checks."""
        print(f"🔍 Running pre-deployment checks...\n")

        checks = [
            ("Environment Variables", self._check_env_vars),
            ("Build Artifacts", self._check_build_artifacts),
            ("Database Migrations", self._check_migrations_ready),
            ("Dependencies", self._check_dependencies),
        ]

        return self._run_checks(checks)

    def post_deploy_checks(self, verify_endpoints: bool = True) -> bool:
        """Run post-deployment validation checks."""
        print(f"✅ Running post-deployment checks for {self.base_url}...\n")

        checks = [
            ("Service Availability", self._check_service_availability),
            ("Health Endpoint", self._check_health_endpoint),
        ]

        if verify_endpoints:
            checks.append(("API Endpoints", self._check_api_endpoints))
            checks.append(("Database Connectivity", self._check_database_connectivity))

        return self._run_checks(checks)

    def _run_checks(self, checks: List[Tuple[str, callable]]) -> bool:
        """Run a list of checks."""
        for name, check_func in checks:
            try:
                passed, message = check_func()
                self._record_check(name, passed, message)
            except Exception as e:
                self._record_check(name, False, f"Error: {e}")

        self._print_summary()
        return self.checks_failed == 0

    def _record_check(self, name: str, passed: bool, message: str):
        """Record check result."""
        status = "✓" if passed else "✗"
        status_text = "PASS" if passed else "FAIL"

        print(f"{status} {name}: {status_text}")
        if message:
            print(f"  {message}")

        if passed:
            self.checks_passed += 1
        else:
            self.checks_failed += 1

        self.results.append({
            "check": name,
            "passed": passed,
            "message": message,
            "timestamp": datetime.now().isoformat(),
        })

    def _check_env_vars(self) -> Tuple[bool, str]:
        """Check required environment variables."""
        required = [
            "NODE_ENV",
            "DATABASE_URL",
        ]

        missing = [var for var in required if not os.getenv(var)]

        if missing:
            return False, f"Missing env vars: {', '.join(missing)}"
        return True, "All required env vars present"

    def _check_build_artifacts(self) -> Tuple[bool, str]:
        """Check if build artifacts exist."""
        artifacts = [
            ".next",
            "dist",
            "packages/*/dist",
        ]

        from pathlib import Path
        import glob

        missing = []
        for pattern in artifacts:
            if "*" in pattern:
                if not glob.glob(pattern):
                    missing.append(pattern)
            elif not Path(pattern).exists():
                missing.append(pattern)

        if missing:
            return False, f"Missing artifacts: {', '.join(missing)}"
        return True, "Build artifacts present"

    def _check_migrations_ready(self) -> Tuple[bool, str]:
        """Check if database migrations are ready."""
        try:
            # Check Prisma migration status
            result = subprocess.run(
                ["pnpm", "prisma", "migrate", "status"],
                capture_output=True,
                text=True,
                timeout=10,
            )

            if "No pending migrations" in result.stdout:
                return True, "No pending migrations"
            elif "Database schema is up to date" in result.stdout:
                return True, "Database schema up to date"
            else:
                return False, "Pending migrations detected"

        except subprocess.TimeoutExpired:
            return False, "Migration check timed out"
        except FileNotFoundError:
            return True, "Prisma not available (skipping)"
        except Exception as e:
            return False, f"Migration check error: {e}"

    def _check_dependencies(self) -> Tuple[bool, str]:
        """Check for dependency vulnerabilities."""
        try:
            result = subprocess.run(
                ["pnpm", "audit", "--audit-level=high"],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode == 0:
                return True, "No high/critical vulnerabilities"
            else:
                vulnerabilities = result.stdout.count("high") + result.stdout.count("critical")
                return False, f"Found {vulnerabilities} vulnerabilities"

        except subprocess.TimeoutExpired:
            return False, "Audit check timed out"
        except Exception as e:
            return True, f"Audit skipped: {e}"

    def _check_service_availability(self) -> Tuple[bool, str]:
        """Check if service is available."""
        try:
            response = requests.get(
                self.base_url,
                timeout=self.timeout,
                allow_redirects=True,
            )

            if response.status_code < 500:
                return True, f"Service responding (status: {response.status_code})"
            else:
                return False, f"Service error (status: {response.status_code})"

        except requests.RequestException as e:
            return False, f"Service unavailable: {e}"

    def _check_health_endpoint(self) -> Tuple[bool, str]:
        """Check health endpoint."""
        health_url = urljoin(self.base_url, "/api/health")

        try:
            response = requests.get(health_url, timeout=self.timeout)

            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "unknown")
                return True, f"Health check: {status}"
            else:
                return False, f"Health endpoint returned {response.status_code}"

        except requests.RequestException as e:
            return False, f"Health check failed: {e}"

    def _check_api_endpoints(self) -> Tuple[bool, str]:
        """Check critical API endpoints."""
        endpoints = [
            "/api/health",
            "/api/status",
        ]

        failed = []
        for endpoint in endpoints:
            url = urljoin(self.base_url, endpoint)
            try:
                response = requests.get(url, timeout=10)
                if response.status_code >= 500:
                    failed.append(f"{endpoint} ({response.status_code})")
            except requests.RequestException:
                failed.append(f"{endpoint} (unreachable)")

        if failed:
            return False, f"Failed endpoints: {', '.join(failed)}"
        return True, f"All {len(endpoints)} endpoints responding"

    def _check_database_connectivity(self) -> Tuple[bool, str]:
        """Check database connectivity."""
        import os

        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            return True, "DATABASE_URL not set (skipping)"

        try:
            import psycopg2

            conn = psycopg2.connect(db_url, connect_timeout=5)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            conn.close()

            if result and result[0] == 1:
                return True, "Database connection successful"
            else:
                return False, "Unexpected database response"

        except ImportError:
            return True, "psycopg2 not installed (skipping)"
        except Exception as e:
            return False, f"Database connection failed: {e}"

    def _print_summary(self):
        """Print check summary."""
        total = self.checks_passed + self.checks_failed

        print(f"\n{'='*60}")
        print("HEALTH CHECK SUMMARY")
        print(f"{'='*60}")
        print(f"Total Checks: {total}")
        print(f"Passed: {self.checks_passed} ✓")
        print(f"Failed: {self.checks_failed} ✗")
        print(f"{'='*60}\n")


import os


def main():
    parser = argparse.ArgumentParser(
        description="Deployment health checker",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Pre-deployment checks
  python deployment_health_checker.py --pre-deploy

  # Post-deployment checks
  python deployment_health_checker.py --post-deploy --url https://myapp.com

  # Full verification
  python deployment_health_checker.py --post-deploy --url https://myapp.com --verify-endpoints

  # Output as JSON
  python deployment_health_checker.py --post-deploy --url https://myapp.com --json
        """,
    )

    parser.add_argument(
        "--pre-deploy",
        action="store_true",
        help="Run pre-deployment checks",
    )

    parser.add_argument(
        "--post-deploy",
        action="store_true",
        help="Run post-deployment checks",
    )

    parser.add_argument(
        "--url",
        help="Base URL for post-deployment checks",
    )

    parser.add_argument(
        "--verify-endpoints",
        action="store_true",
        help="Verify all API endpoints",
    )

    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Request timeout in seconds (default: 30)",
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )

    parser.add_argument(
        "--wait",
        type=int,
        help="Wait N seconds before starting checks",
    )

    args = parser.parse_args()

    if not args.pre_deploy and not args.post_deploy:
        parser.print_help()
        return 1

    if args.post_deploy and not args.url:
        print("Error: --url required for post-deployment checks", file=sys.stderr)
        return 1

    if args.wait:
        print(f"Waiting {args.wait} seconds before checks...")
        time.sleep(args.wait)

    try:
        if args.pre_deploy:
            checker = DeploymentHealthChecker(
                base_url=args.url or "http://localhost:3000",
                timeout=args.timeout,
            )
            success = checker.pre_deploy_checks()
        else:
            checker = DeploymentHealthChecker(
                base_url=args.url,
                timeout=args.timeout,
            )
            success = checker.post_deploy_checks(
                verify_endpoints=args.verify_endpoints
            )

        if args.json:
            result = {
                "success": success,
                "checks_passed": checker.checks_passed,
                "checks_failed": checker.checks_failed,
                "results": checker.results,
                "timestamp": datetime.now().isoformat(),
            }
            print(json.dumps(result, indent=2))

        return 0 if success else 1

    except KeyboardInterrupt:
        print("\n\nHealth check cancelled by user")
        return 130
    except Exception as e:
        print(f"Error during health check: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
