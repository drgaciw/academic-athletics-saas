#!/bin/bash

# Safety Implementation Verification Script
# Verifies that Tasks 10.1, 10.2, and 10.3 are properly implemented

echo "========================================="
echo "Safety Implementation Verification"
echo "Tasks 10.1, 10.2, 10.3"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counters
total=0
passed=0

check_file() {
  total=$((total + 1))
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    passed=$((passed + 1))
  else
    echo -e "${RED}✗${NC} $2 (File not found: $1)"
  fi
}

check_dir() {
  total=$((total + 1))
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    passed=$((passed + 1))
  else
    echo -e "${RED}✗${NC} $2 (Directory not found: $1)"
  fi
}

echo "Task 10.1: Adversarial Test Dataset"
echo "-----------------------------------"
check_file "datasets/adversarial/prompt-injection.json" "Prompt injection dataset"
check_file "datasets/adversarial/data-exfiltration.json" "Data exfiltration dataset"
check_file "datasets/adversarial/jailbreak.json" "Jailbreak dataset"
check_file "datasets/adversarial/index.ts" "Dataset loader"
echo ""

echo "Task 10.2: PII Detection Scorer"
echo "-------------------------------"
check_file "src/safety/pii-detector.ts" "PII detector implementation"
check_file "src/safety/__tests__/pii-detector.test.ts" "PII detector tests"
echo ""

echo "Task 10.3: FERPA Compliance Checks"
echo "----------------------------------"
check_file "src/safety/ferpa-compliance.ts" "FERPA compliance checker"
echo ""

echo "Additional Implementation Files"
echo "-------------------------------"
check_file "src/safety/index.ts" "Safety module index"
check_file "src/safety/README.md" "Safety module documentation"
check_file "src/safety/examples.ts" "Usage examples"
check_dir "src/safety/__tests__" "Tests directory"
check_file "SAFETY_IMPLEMENTATION.md" "Implementation summary"
check_file "TASKS_10.1-10.3_COMPLETION.md" "Completion report"
echo ""

echo "Type Definitions"
echo "---------------"
check_file "src/types/index.ts" "Updated types with safety definitions"
echo ""

echo "========================================="
echo "Verification Results"
echo "========================================="
echo "Total checks: $total"
echo "Passed: $passed"
echo "Failed: $((total - passed))"
echo ""

if [ $passed -eq $total ]; then
  echo -e "${GREEN}✓ All checks passed! Implementation complete.${NC}"
  exit 0
else
  echo -e "${RED}✗ Some checks failed. Review the output above.${NC}"
  exit 1
fi
