#!/usr/bin/env python3
"""
NCAA Division I Academic Eligibility Validator CLI
Codifies NCAA Bylaw 14 rules and verifies student-athlete records.
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Tuple

BYLAWS_FILE = Path(__file__).parent.parent / "references" / "bylaw_reference.json"

def load_bylaw_reference() -> Dict[str, Any]:
    with open(BYLAWS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def validate_student_record(student: Dict[str, Any], institutional_min_gpa: float = 2.0) -> Dict[str, Any]:
    """
    Evaluates a student-athlete record against NCAA Division I Bylaw 14.
    """
    results: List[Dict[str, Any]] = []
    overall_status = "ELIGIBLE"
    reasons: List[str] = []

    current_term = student.get("currentTermNumber", 1)
    enrolled_credits = student.get("enrolledCredits", 0)
    term_credits_passed = student.get("lastTermPassedCredits", 0)
    academic_year_credits = student.get("academicYearCredits", 0)
    cumulative_degree_credits = student.get("cumulativeDegreeCredits", 0)
    total_degree_required_credits = student.get("totalDegreeCreditsRequired", 120)
    cumulative_gpa = student.get("cumulativeGpa", 0.0)
    is_graduating_senior = student.get("isGraduatingSenior", False)
    major_declared = student.get("majorDeclared", False)

    # 1. Bylaw 14.1.2 - Full-Time Enrollment (12 Credits)
    if is_graduating_senior:
        results.append({
            "bylaw": "14.1.2",
            "rule": "Full-Time Enrollment (Graduating Senior Exception)",
            "passed": True,
            "details": f"{enrolled_credits} credits enrolled under certified graduation term exception"
        })
    elif enrolled_credits >= 12:
        results.append({
            "bylaw": "14.1.2",
            "rule": "Full-Time Enrollment (>= 12 Credits)",
            "passed": True,
            "details": f"{enrolled_credits} credit hours enrolled"
        })
    else:
        results.append({
            "bylaw": "14.1.2",
            "rule": "Full-Time Enrollment (>= 12 Credits)",
            "passed": False,
            "details": f"{enrolled_credits} credits enrolled (Minimum 12 required for competition)"
        })
        overall_status = "INELIGIBLE"
        reasons.append("Bylaw 14.1.2: Enrolled in fewer than 12 credit hours without graduation waiver")

    # 2. Bylaw 14.4.3.1 - Six-Hour Term Requirement
    if current_term > 1:
        if term_credits_passed >= 6:
            results.append({
                "bylaw": "14.4.3.1",
                "rule": "Six-Hour Term Rule",
                "passed": True,
                "details": f"{term_credits_passed} credits passed in preceding regular term"
            })
        else:
            results.append({
                "bylaw": "14.4.3.1",
                "rule": "Six-Hour Term Rule",
                "passed": False,
                "details": f"Only {term_credits_passed} credits passed in preceding regular term (Min 6 required)"
            })
            overall_status = "INELIGIBLE"
            reasons.append("Bylaw 14.4.3.1: Failed to pass 6 degree-applicable credits in preceding term")

    # 3. Bylaw 14.4.3.2 - Eighteen-Hour Academic Year Requirement (Terms 3, 5, 7, 9)
    if current_term in [3, 5, 7, 9]:
        if academic_year_credits >= 18:
            results.append({
                "bylaw": "14.4.3.2",
                "rule": "Eighteen-Hour Academic Year Rule",
                "passed": True,
                "details": f"{academic_year_credits} credits earned during regular academic year (Fall+Spring)"
            })
        else:
            results.append({
                "bylaw": "14.4.3.2",
                "rule": "Eighteen-Hour Academic Year Rule",
                "passed": False,
                "details": f"{academic_year_credits} credits earned during regular academic year (Min 18 required, summer excluded)"
            })
            overall_status = "INELIGIBLE"
            reasons.append("Bylaw 14.4.3.2: Earned fewer than 18 credit hours during regular academic year")

    # 4. Bylaw 14.4.3.3 - Twenty-Four Hour Freshman Requirement (Entering Term 3)
    if current_term == 3:
        total_first_year = student.get("totalFirstYearCredits", cumulative_degree_credits)
        if total_first_year >= 24:
            results.append({
                "bylaw": "14.4.3.3",
                "rule": "Twenty-Four Hour Freshman Rule",
                "passed": True,
                "details": f"{total_first_year} credits earned prior to second year of enrollment"
            })
        else:
            results.append({
                "bylaw": "14.4.3.3",
                "rule": "Twenty-Four Hour Freshman Rule",
                "passed": False,
                "details": f"{total_first_year} credits earned before second year (Min 24 required)"
            })
            overall_status = "INELIGIBLE"
            reasons.append("Bylaw 14.4.3.3: Did not earn 24 credit hours prior to 2nd year")

    # 5. Bylaw 14.4.3.2.1 - Progress-Toward-Degree (PTD) Percentage
    actual_ptd_pct = round((cumulative_degree_credits / total_degree_required_credits) * 100.0, 2)
    req_ptd_pct = 0.0
    ptd_bylaw_ref = "N/A"

    if current_term >= 9:
        req_ptd_pct = 80.0
        ptd_bylaw_ref = "Bylaw 14.4.3.2.1 (80% Rule - Year 5)"
    elif current_term >= 7:
        req_ptd_pct = 60.0
        ptd_bylaw_ref = "Bylaw 14.4.3.2.1 (60% Rule - Year 4)"
    elif current_term >= 5:
        req_ptd_pct = 40.0
        ptd_bylaw_ref = "Bylaw 14.4.3.2.1 (40% Rule - Year 3)"

    if req_ptd_pct > 0.0:
        if not major_declared:
            results.append({
                "bylaw": "14.4.3.1.5",
                "rule": "Designation of Degree Program (Term 5+)",
                "passed": False,
                "details": "Major must be officially designated by beginning of third year (Term 5)"
            })
            overall_status = "INELIGIBLE"
            reasons.append("Bylaw 14.4.3.1.5: Major not declared by Term 5")

        ptd_passed = actual_ptd_pct >= req_ptd_pct
        results.append({
            "bylaw": "14.4.3.2.1",
            "rule": f"PTD Benchmark ({req_ptd_pct}% required)",
            "passed": ptd_passed,
            "details": f"{actual_ptd_pct}% achieved ({cumulative_degree_credits}/{total_degree_required_credits} credits)"
        })
        if not ptd_passed:
            overall_status = "INELIGIBLE"
            reasons.append(f"{ptd_bylaw_ref}: Deficient by {round(req_ptd_pct - actual_ptd_pct, 2)}% degree credits")
        elif actual_ptd_pct - req_ptd_pct < 5.0 and overall_status == "ELIGIBLE":
            overall_status = "AT_RISK"
            reasons.append(f"PTD warning: Within 5% buffer of minimum benchmark ({actual_ptd_pct}% vs {req_ptd_pct}%)")

    # 6. Bylaw 14.4.3.3.1 - Minimum GPA Requirements
    req_gpa = 0.0
    if current_term >= 7:
        req_gpa = round(institutional_min_gpa * 1.0, 3) # 100% -> 2.000
    elif current_term >= 5:
        req_gpa = round(institutional_min_gpa * 0.95, 3) # 95% -> 1.900
    elif current_term >= 3:
        req_gpa = round(institutional_min_gpa * 0.90, 3) # 90% -> 1.800

    if req_gpa > 0.0:
        gpa_passed = cumulative_gpa >= req_gpa
        results.append({
            "bylaw": "14.4.3.3.1",
            "rule": f"Minimum GPA ({req_gpa:.3f} required)",
            "passed": gpa_passed,
            "details": f"Cumulative GPA: {cumulative_gpa:.3f} vs required {req_gpa:.3f}"
        })
        if not gpa_passed:
            overall_status = "INELIGIBLE"
            reasons.append(f"Bylaw 14.4.3.3.1: GPA {cumulative_gpa:.3f} below required {req_gpa:.3f}")
        elif (cumulative_gpa - req_gpa) < 0.150 and overall_status == "ELIGIBLE":
            overall_status = "AT_RISK"
            reasons.append(f"Academic warning: GPA {cumulative_gpa:.3f} within 0.15 of probation threshold")

    return {
        "studentId": student.get("id", "UNKNOWN"),
        "studentName": student.get("name", "Student-Athlete"),
        "sport": student.get("sport", "General Athletics"),
        "currentTerm": current_term,
        "overallStatus": overall_status,
        "ptdPercentage": actual_ptd_pct,
        "gpa": cumulative_gpa,
        "findings": results,
        "actionItemsOrViolations": reasons
    }

def run_test_suite() -> None:
    test_cases = [
        {
            "id": "ATH-001",
            "name": "Marcus Vance",
            "sport": "Men's Basketball",
            "currentTermNumber": 5,
            "enrolledCredits": 15,
            "lastTermPassedCredits": 9,
            "academicYearCredits": 28,
            "cumulativeDegreeCredits": 52,
            "totalDegreeCreditsRequired": 120,
            "cumulativeGpa": 2.85,
            "majorDeclared": True
        },
        {
            "id": "ATH-002",
            "name": "Elena Rostova",
            "sport": "Women's Soccer",
            "currentTermNumber": 5,
            "enrolledCredits": 14,
            "lastTermPassedCredits": 12,
            "academicYearCredits": 24,
            "cumulativeDegreeCredits": 42, # 42/120 = 35% -> FAILS 40% rule
            "totalDegreeCreditsRequired": 120,
            "cumulativeGpa": 2.45,
            "majorDeclared": True
        },
        {
            "id": "ATH-003",
            "name": "Jordan Hayes",
            "sport": "Track & Field",
            "currentTermNumber": 3,
            "enrolledCredits": 11, # FAILS 12 credits full-time
            "lastTermPassedCredits": 12,
            "academicYearCredits": 24,
            "cumulativeDegreeCredits": 28,
            "totalDegreeCreditsRequired": 120,
            "cumulativeGpa": 1.72, # FAILS 1.800 min GPA
            "majorDeclared": False
        },
        {
            "id": "ATH-004",
            "name": "Tyler Brooks",
            "sport": "Baseball",
            "currentTermNumber": 7,
            "enrolledCredits": 9, # Graduating senior exception
            "isGraduatingSenior": True,
            "lastTermPassedCredits": 15,
            "academicYearCredits": 27,
            "cumulativeDegreeCredits": 111,
            "totalDegreeCreditsRequired": 120,
            "cumulativeGpa": 3.40,
            "majorDeclared": True
        }
    ]

    print("=================================================================")
    print("NCAA DIVISION I ACADEMIC ELIGIBILITY TEST SUITE")
    print("=================================================================\n")

    for student in test_cases:
        eval_res = validate_student_record(student)
        status_color = "PASS" if eval_res["overallStatus"] == "ELIGIBLE" else ("WARN" if eval_res["overallStatus"] == "AT_RISK" else "FAIL")
        print(f"[{status_color}] {eval_res['studentName']} ({eval_res['sport']}) - Term {eval_res['currentTerm']}")
        print(f"       Status: {eval_res['overallStatus']} | PTD: {eval_res['ptdPercentage']}% | GPA: {eval_res['gpa']}")
        for f in eval_res["findings"]:
            symbol = "[OK]" if f["passed"] else "[FAIL]"
            print(f"       {symbol} [{f['bylaw']}] {f['rule']}: {f['details']}")
        if eval_res["actionItemsOrViolations"]:
            print("       Violations/Warnings:")
            for v in eval_res["actionItemsOrViolations"]:
                print(f"         - {v}")
        print("-" * 65)

def main():
    parser = argparse.ArgumentParser(description="NCAA Division I Academic Eligibility Validator")
    parser.add_argument("--test", action="store_true", help="Run built-in NCAA test cases")
    parser.add_argument("--student-json", type=str, help="Path to student JSON file")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    args = parser.parse_args()

    if args.test:
        run_test_suite()
        return

    if args.student_json:
        with open(args.student_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        res = validate_student_record(data)
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"Evaluation for {res['studentName']} ({res['studentId']}): {res['overallStatus']}")
            for f in res["findings"]:
                print(f"[{'PASS' if f['passed'] else 'FAIL'}] {f['bylaw']}: {f['details']}")
        return

    parser.print_help()

if __name__ == "__main__":
    main()
