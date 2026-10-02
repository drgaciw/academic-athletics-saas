#!/usr/bin/env python3
"""
FERPA Privacy Guard Scanner
Scans source code, configs, and logs for student educational record leaks and security anti-patterns.
"""

import os
import re
import sys
import argparse
from pathlib import Path
from typing import List, Dict, Any

# Pattern definitions for FERPA & PII violations
PATTERNS = [
    {
        "id": "FERPA-001",
        "severity": "CRITICAL",
        "name": "Social Security Number Exposure",
        "regex": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
        "description": "Found literal Social Security Number pattern in code or data."
    },
    {
        "id": "FERPA-002",
        "severity": "HIGH",
        "name": "Unsafe Logging of Student Academic Records",
        "regex": re.compile(r'(?:console\.(?:log|info|debug|warn)|logger\.(?:info|debug|warn))\([^)]*?\b(?:gpa|transcript|grades|cumulative_gpa|disability|accommodation)\b[^)]*?\)', re.IGNORECASE),
        "description": "Student educational records/grades logged to stdout or logger without masking."
    },
    {
        "id": "FERPA-003",
        "severity": "HIGH",
        "name": "Hardcoded Student PII / Real Email",
        "regex": re.compile(r'["\'](?:[a-zA-Z0-9_.+-]+@(?:[a-zA-Z0-9-]+\.)+(?:edu|org))["\']', re.IGNORECASE),
        "filter": lambda match: not any(mock in match.lower() for mock in ["test", "example", "mock", "athletics.edu", "university.edu", "sample"]),
        "description": "Possible real institutional student email address hardcoded in code."
    },
    {
        "id": "FERPA-004",
        "severity": "MEDIUM",
        "name": "Unredacted Raw Student ID in LLM Prompt",
        "regex": re.compile(r'prompt\s*[:=]\s*`[^`]*?\b(?:student\.id|studentId|bannerId|cwid)\b[^`]*?`', re.IGNORECASE),
        "description": "Direct student identifier interpolated into AI prompt without tenant masking."
    }
]

IGNORE_DIRS = {
    "node_modules", ".git", ".next", "dist", "build", "coverage", ".turbo",
    ".cache", "__pycache__", ".vscode", ".idea", ".pnpm-store"
}

IGNORE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".zip", ".tar", ".gz",
    ".lock", ".map", ".woff", ".woff2", ".ttf", ".eot"
}

def scan_file(file_path: Path) -> List[Dict[str, Any]]:
    findings = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
    except Exception:
        return findings

    for line_num, line in enumerate(lines, start=1):
        if "ferpa-ignore" in line or (line_num > 1 and "ferpa-ignore" in lines[line_num - 2]):
            continue
        for rule in PATTERNS:
            match = rule["regex"].search(line)
            if match:
                # Check optional filter
                if "filter" in rule and not rule["filter"](match.group(0)):
                    continue

                findings.append({
                    "ruleId": rule["id"],
                    "severity": rule["severity"],
                    "ruleName": rule["name"],
                    "file": str(file_path),
                    "line": line_num,
                    "matchedText": line.strip()[:100],
                    "description": rule["description"]
                })
    return findings

def scan_directory(target_dir: Path) -> List[Dict[str, Any]]:
    all_findings = []
    for root, dirs, files in os.walk(target_dir):
        # Prune ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            file_path = Path(root) / file
            if file_path.suffix.lower() in IGNORE_EXTENSIONS:
                continue
            findings = scan_file(file_path)
            all_findings.extend(findings)
    return all_findings

def main():
    parser = argparse.ArgumentParser(description="FERPA Privacy & Student Data Protection Scanner")
    parser.add_argument("path", nargs="?", default=".", help="Directory or file path to scan")
    parser.add_argument("--fail-on-critical", action="store_true", help="Exit with code 1 if critical/high violations found")
    args = parser.parse_args()

    target = Path(args.path)
    if not target.exists():
        print(f"[FAIL] Target path does not exist: {target}")
        sys.exit(1)

    print("=================================================================")
    print("FERPA PRIVACY & STUDENT DATA SECURITY AUDIT")
    print(f"Target: {target.resolve()}")
    print("=================================================================\n")

    if target.is_file():
        findings = scan_file(target)
    else:
        findings = scan_directory(target)

    critical_count = sum(1 for f in findings if f["severity"] == "CRITICAL")
    high_count = sum(1 for f in findings if f["severity"] == "HIGH")
    med_count = sum(1 for f in findings if f["severity"] == "MEDIUM")

    if not findings:
        print("[OK] Zero FERPA or student PII privacy violations detected! Codebase is clean.\n")
        sys.exit(0)

    print(f"Found {len(findings)} potential privacy concern(s):")
    print(f"  - Critical: {critical_count}")
    print(f"  - High:     {high_count}")
    print(f"  - Medium:   {med_count}\n")

    for f in findings[:25]: # limit output to first 25
        print(f"[{f['severity']}] {f['ruleId']}: {f['ruleName']}")
        print(f"       File: {f['file']}:{f['line']}")
        print(f"       Code: {f['matchedText']}")
        print(f"       Fix:  {f['description']}")
        print("-" * 65)

    if len(findings) > 25:
        print(f"... and {len(findings) - 25} more items omitted.")

    if args.fail_on_critical and (critical_count > 0 or high_count > 0):
        print("\n[FAIL] Audit failed due to critical or high severity violations.")
        sys.exit(1)

if __name__ == "__main__":
    main()
