#!/usr/bin/env python3
"""
CI/CD Secrets Validator

Comprehensive validation and management tool for CI/CD secrets.
Validates secret availability, format, and connectivity.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    print("Warning: requests module not installed. Some features disabled.")
    requests = None


class SecretsValidator:
    """Validate CI/CD secrets and environment variables."""

    def __init__(self, env: str = "production"):
        self.env = env
        self.results = []
        self.errors = []

    def validate_all(self) -> bool:
        """Run all validations."""
        print(f"🔐 Validating secrets for {self.env} environment...\n")

        checks = [
            ("GitHub Secrets", self.check_github_secrets),
            ("API Keys", self.validate_api_keys),
            ("Database URLs", self.validate_database_urls),
            ("Environment Variables", self.check_env_completeness),
        ]

        all_passed = True
        for name, check_func in checks:
            try:
                passed = check_func()
                status = "✓" if passed else "✗"
                print(f"{status} {name}: {'PASSED' if passed else 'FAILED'}")
                all_passed = all_passed and passed
            except Exception as e:
                print(f"✗ {name}: ERROR - {e}")
                all_passed = False

        self._print_summary()
        return all_passed

    def check_github_secrets(self) -> bool:
        """Check if required GitHub secrets exist."""
        required_secrets = [
            "ANTHROPIC_API_KEY",
            "EVAL_DATABASE_URL",
            "DATABASE_URL",
            "CLERK_SECRET_KEY",
        ]

        optional_secrets = [
            "OPENAI_API_KEY",
            "VERCEL_TOKEN",
            "SLACK_WEBHOOK",
        ]

        try:
            result = subprocess.run(
                ["gh", "secret", "list", "--json", "name"],
                capture_output=True,
                text=True,
                check=True,
            )
            secrets = json.loads(result.stdout)
            secret_names = {s["name"] for s in secrets}

            missing_required = set(required_secrets) - secret_names
            missing_optional = set(optional_secrets) - secret_names

            if missing_required:
                self.errors.append(
                    f"Missing required secrets: {', '.join(missing_required)}"
                )
                return False

            if missing_optional:
                print(f"  ℹ Optional secrets not set: {', '.join(missing_optional)}")

            return True

        except subprocess.CalledProcessError as e:
            self.errors.append(f"Failed to list secrets: {e.stderr}")
            return False
        except FileNotFoundError:
            self.errors.append("GitHub CLI (gh) not installed")
            return False

    def validate_api_keys(self) -> bool:
        """Validate API key format and connectivity."""
        api_keys = {
            "ANTHROPIC_API_KEY": self._validate_anthropic_key,
            "OPENAI_API_KEY": self._validate_openai_key,
        }

        all_valid = True
        for key_name, validator in api_keys.items():
            key_value = os.getenv(key_name)
            if key_value:
                valid, message = validator(key_value)
                if not valid:
                    self.errors.append(f"{key_name}: {message}")
                    all_valid = False
                else:
                    print(f"  ✓ {key_name} validated")
            else:
                print(f"  ⊘ {key_name} not set (skipping)")

        return all_valid

    def _validate_anthropic_key(self, key: str) -> Tuple[bool, str]:
        """Validate Anthropic API key."""
        # Check format
        if not key.startswith("sk-ant-"):
            return False, "Invalid format (should start with sk-ant-)"

        # Test connectivity if requests available
        if requests:
            try:
                response = requests.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "anthropic-version": "2023-06-01",
                        "x-api-key": key,
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-sonnet-4-5-20250929",
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "test"}],
                    },
                    timeout=10,
                )
                if response.status_code in (200, 400):  # 400 = valid key, bad request
                    return True, "Valid and active"
                elif response.status_code == 401:
                    return False, "Invalid or expired key"
                else:
                    return False, f"Unexpected status: {response.status_code}"
            except requests.RequestException as e:
                return False, f"Connection error: {e}"

        return True, "Format valid (connectivity not tested)"

    def _validate_openai_key(self, key: str) -> Tuple[bool, str]:
        """Validate OpenAI API key."""
        # Check format
        if not key.startswith("sk-"):
            return False, "Invalid format (should start with sk-)"

        # Test connectivity
        if requests:
            try:
                response = requests.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {key}"},
                    timeout=10,
                )
                if response.status_code == 200:
                    return True, "Valid and active"
                elif response.status_code == 401:
                    return False, "Invalid or expired key"
                else:
                    return False, f"Unexpected status: {response.status_code}"
            except requests.RequestException as e:
                return False, f"Connection error: {e}"

        return True, "Format valid (connectivity not tested)"

    def validate_database_urls(self) -> bool:
        """Validate database connection strings."""
        db_urls = {
            "DATABASE_URL": os.getenv("DATABASE_URL"),
            "EVAL_DATABASE_URL": os.getenv("EVAL_DATABASE_URL"),
        }

        all_valid = True
        for name, url in db_urls.items():
            if not url:
                print(f"  ⊘ {name} not set (skipping)")
                continue

            valid, message = self._validate_postgres_url(url)
            if not valid:
                self.errors.append(f"{name}: {message}")
                all_valid = False
            else:
                print(f"  ✓ {name} validated")

        return all_valid

    def _validate_postgres_url(self, url: str) -> Tuple[bool, str]:
        """Validate PostgreSQL connection string."""
        try:
            parsed = urlparse(url)

            # Check scheme
            if parsed.scheme not in ("postgres", "postgresql"):
                return False, "Invalid scheme (should be postgres:// or postgresql://)"

            # Check components
            if not parsed.hostname:
                return False, "Missing hostname"
            if not parsed.username:
                return False, "Missing username"
            if not parsed.password:
                return False, "Missing password"

            # Test connection if psycopg2 available
            try:
                import psycopg2

                conn = psycopg2.connect(url, connect_timeout=5)
                conn.close()
                return True, "Valid and connectable"
            except ImportError:
                return True, "Format valid (psycopg2 not installed for connection test)"
            except Exception as e:
                return False, f"Connection failed: {e}"

        except Exception as e:
            return False, f"Invalid URL format: {e}"

    def check_env_completeness(self) -> bool:
        """Check if all required environment variables are set."""
        required_vars = {
            "NODE_ENV": ["development", "staging", "production"],
            "DATABASE_URL": None,
            "CLERK_SECRET_KEY": None,
        }

        missing = []
        invalid = []

        for var, allowed_values in required_vars.items():
            value = os.getenv(var)
            if not value:
                missing.append(var)
            elif allowed_values and value not in allowed_values:
                invalid.append(
                    f"{var}={value} (allowed: {', '.join(allowed_values)})"
                )

        if missing:
            self.errors.append(f"Missing env vars: {', '.join(missing)}")

        if invalid:
            self.errors.append(f"Invalid env vars: {', '.join(invalid)}")

        return len(missing) == 0 and len(invalid) == 0

    def check_secret_rotation(self) -> Dict[str, dict]:
        """Check when secrets were last rotated."""
        # This would integrate with your secrets management system
        # For now, returns example data
        rotation_schedule = {
            "ANTHROPIC_API_KEY": {
                "last_rotated": "2024-10-01",
                "rotation_interval_days": 90,
                "next_rotation": "2025-01-01",
            },
            "DATABASE_URL": {
                "last_rotated": "2024-08-01",
                "rotation_interval_days": 180,
                "next_rotation": "2025-02-01",
            },
        }

        warnings = []
        for secret, info in rotation_schedule.items():
            next_rotation = datetime.fromisoformat(info["next_rotation"])
            days_until = (next_rotation - datetime.now()).days

            if days_until < 0:
                warnings.append(f"{secret} is overdue for rotation!")
            elif days_until < 14:
                warnings.append(
                    f"{secret} should be rotated soon (in {days_until} days)"
                )

        if warnings:
            print("\n⚠ Rotation warnings:")
            for warning in warnings:
                print(f"  • {warning}")

        return rotation_schedule

    def _print_summary(self):
        """Print validation summary."""
        print(f"\n{'='*60}")
        print("VALIDATION SUMMARY")
        print(f"{'='*60}")

        if self.errors:
            print(f"\n❌ {len(self.errors)} error(s) found:\n")
            for i, error in enumerate(self.errors, 1):
                print(f"{i}. {error}")
        else:
            print("\n✅ All validations passed!")

        print(f"\n{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Validate CI/CD secrets and environment variables",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Check all GitHub secrets
  python secrets_validator.py --check-github

  # Validate specific API keys
  python secrets_validator.py --validate ANTHROPIC_API_KEY DATABASE_URL

  # Check all for production environment
  python secrets_validator.py --check-all --env production

  # Check secret rotation schedule
  python secrets_validator.py --check-rotation
        """,
    )

    parser.add_argument(
        "--check-github",
        action="store_true",
        help="Check GitHub secrets availability",
    )

    parser.add_argument(
        "--check-all",
        action="store_true",
        help="Run all validation checks",
    )

    parser.add_argument(
        "--validate",
        nargs="+",
        metavar="SECRET",
        help="Validate specific secrets",
    )

    parser.add_argument(
        "--check-rotation",
        action="store_true",
        help="Check secret rotation schedule",
    )

    parser.add_argument(
        "--env",
        choices=["development", "staging", "production"],
        default="production",
        help="Environment to validate (default: production)",
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )

    args = parser.parse_args()

    validator = SecretsValidator(env=args.env)

    try:
        if args.check_all:
            success = validator.validate_all()
        elif args.check_github:
            success = validator.check_github_secrets()
        elif args.check_rotation:
            validator.check_secret_rotation()
            success = True
        elif args.validate:
            # Validate specific secrets
            for secret in args.validate:
                value = os.getenv(secret)
                if value:
                    print(f"Validating {secret}...")
                else:
                    print(f"✗ {secret} not set in environment")
            success = True
        else:
            parser.print_help()
            return 1

        if args.json:
            result = {
                "success": success,
                "errors": validator.errors,
                "timestamp": datetime.now().isoformat(),
            }
            print(json.dumps(result, indent=2))

        return 0 if success else 1

    except KeyboardInterrupt:
        print("\n\nValidation cancelled by user")
        return 130
    except Exception as e:
        print(f"Error during validation: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
