#!/usr/bin/env python3
"""
Cross-Repo Contract & Schema Synchronizer
Compares and validates Prisma schemas and data models across the 4 athletic-academics subprojects.
"""

import re
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Set

ROOT_DIR = Path(__file__).resolve().parents[4]

SCHEMAS = {
    "gcp": ROOT_DIR / "athletic-academics-hub-gcp" / "backend" / "prisma" / "schema.prisma",
    "glm": ROOT_DIR / "academic-compliance-hub-glm" / "packages" / "database" / "prisma" / "schema.prisma",
    "kiro": ROOT_DIR / "academic-athletics-saas-kiro" / "packages" / "database" / "prisma" / "schema.prisma",
    "gemini": ROOT_DIR / "academic-athletics-saas-gemini" / "packages" / "database" / "prisma" / "schema.prisma"
}

def parse_prisma_schema(schema_path: Path) -> Dict[str, Dict[str, str]]:
    """
    Parses a Prisma schema file and returns { model_name: { field_name: field_type } }
    """
    if not schema_path.exists():
        return {}

    models: Dict[str, Dict[str, str]] = {}
    current_model = None

    with open(schema_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("//"):
                continue

            # Model declaration
            model_match = re.match(r'^model\s+([A-Za-z0-9_]+)\s*\{', line)
            if model_match:
                current_model = model_match.group(1)
                models[current_model] = {}
                continue

            # Closing brace
            if line.startswith("}") and current_model:
                current_model = None
                continue

            # Field declaration within a model
            if current_model and not line.startswith("@@"):
                parts = line.split()
                if len(parts) >= 2:
                    field_name = parts[0]
                    field_type = parts[1]
                    models[current_model][field_name] = field_type

    return models

def analyze_schemas() -> Dict[str, Any]:
    parsed: Dict[str, Dict[str, Dict[str, str]]] = {}
    all_models: Set[str] = set()

    for proj, path in SCHEMAS.items():
        m = parse_prisma_schema(path)
        parsed[proj] = m
        all_models.update(m.keys())

    sorted_models = sorted(list(all_models))
    matrix = []

    for model in sorted_models:
        row = {
            "model": model,
            "presence": {proj: (model in parsed[proj]) for proj in SCHEMAS},
            "divergence": {}
        }

        # Check field consistency across projects where model exists
        projs_with_model = [p for p in SCHEMAS if model in parsed[p]]
        if len(projs_with_model) > 1:
            baseline_proj = projs_with_model[0]
            baseline_fields = parsed[baseline_proj][model]
            
            diffs = {}
            for other_proj in projs_with_model[1:]:
                other_fields = parsed[other_proj][model]
                missing_in_other = set(baseline_fields.keys()) - set(other_fields.keys())
                extra_in_other = set(other_fields.keys()) - set(baseline_fields.keys())
                
                type_mismatches = []
                for f_name in set(baseline_fields.keys()) & set(other_fields.keys()):
                    if baseline_fields[f_name] != other_fields[f_name]:
                        type_mismatches.append(f"{f_name}: {baseline_fields[f_name]} vs {other_fields[f_name]}")

                if missing_in_other or extra_in_other or type_mismatches:
                    diffs[f"{baseline_proj}_vs_{other_proj}"] = {
                        "missing": list(missing_in_other),
                        "extra": list(extra_in_other),
                        "typeMismatches": type_mismatches
                    }
            row["divergence"] = diffs

        matrix.append(row)

    return {
        "projects": list(SCHEMAS.keys()),
        "modelCount": {p: len(parsed[p]) for p in SCHEMAS},
        "totalUniqueModels": len(sorted_models),
        "matrix": matrix,
        "models": sorted_models,
        "parsedDetails": parsed
    }

def print_summary(analysis: Dict[str, Any]):
    print("=================================================================")
    print("CROSS-SUBPROJECT PRISMA SCHEMA SYNC REPORT")
    print("=================================================================\n")
    print("Subproject Schema Model Counts:")
    for proj, count in analysis["modelCount"].items():
        status = "[FOUND]" if SCHEMAS[proj].exists() else "[MISSING FILE]"
        print(f"  - {proj.upper():<7}: {count:>3} models  {status} ({SCHEMAS[proj].relative_to(ROOT_DIR)})")
    
    print(f"\nTotal Unique Models across workspace: {analysis['totalUniqueModels']}\n")

    # Models present in all 4
    universal = [r["model"] for r in analysis["matrix"] if all(r["presence"].values())]
    partial = [r for r in analysis["matrix"] if not all(r["presence"].values())]

    print(f"Universal Models ({len(universal)} present in ALL 4 projects):")
    print("  " + ", ".join(universal[:15]) + ("..." if len(universal) > 15 else ""))

    print(f"\nDivergent / Partially Available Models ({len(partial)}):")
    for r in partial[:12]:
        p = r["presence"]
        status_str = f"gcp:{'Y' if p['gcp'] else '-'} | glm:{'Y' if p['glm'] else '-'} | kiro:{'Y' if p['kiro'] else '-'} | gemini:{'Y' if p['gemini'] else '-'}"
        print(f"  - {r['model']:<28} [{status_str}]")
    if len(partial) > 12:
        print(f"  ... and {len(partial) - 12} more.")

def main():
    parser = argparse.ArgumentParser(description="Cross-repo Prisma schema contract synchronizer")
    parser.add_argument("--json", action="store_true", help="Output raw JSON analysis")
    parser.add_argument("--models", action="store_true", help="List all models with subproject presence")
    parser.add_argument("--diff", type=str, help="Show field differences for a specific model")
    args = parser.parse_args()

    analysis = analyze_schemas()

    if args.json:
        print(json.dumps(analysis, indent=2))
        return

    if args.diff:
        target = args.diff.strip()
        matched = [r for r in analysis["matrix"] if r["model"].lower() == target.lower()]
        if not matched:
            print(f"[FAIL] Model '{target}' not found in any subproject schema.")
            return
        row = matched[0]
        print(f"Field-Level Diff for model '{row['model']}':")
        print(f"Presence: {row['presence']}")
        if row["divergence"]:
            print(json.dumps(row["divergence"], indent=2))
        else:
            print("[OK] All present projects have identical field definitions.")
        return

    if args.models:
        print(f"{'Model Name':<32} {'GCP':<6} {'GLM':<6} {'KIRO':<6} {'GEMINI':<6}")
        print("-" * 60)
        for r in analysis["matrix"]:
            p = r["presence"]
            print(f"{r['model']:<32} {'[OK]' if p['gcp'] else '-':<6} {'[OK]' if p['glm'] else '-':<6} {'[OK]' if p['kiro'] else '-':<6} {'[OK]' if p['gemini'] else '-':<6}")
        return

    print_summary(analysis)

if __name__ == "__main__":
    main()
