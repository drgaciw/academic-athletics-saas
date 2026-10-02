#!/usr/bin/env python3
"""
Athletic Academics Hub - Synthetic Data Generator
Generates realistic, FERPA-compliant mock datasets for testing and local development.
"""

import sys
import json
import random
import argparse
from pathlib import Path
from typing import List, Dict, Any

FIRST_NAMES = [
    "Marcus", "Elena", "Jordan", "Tyler", "Brianna", "Devon", "Chloe", "Mateo",
    "Aaliyah", "Lucas", "Sienna", "Darius", "Kayla", "Zion", "Maya", "Tariq",
    "Emma", "Andre", "Sophia", "Jaden", "Hannah", "Caleb", "Leila", "Xavier"
]

LAST_NAMES = [
    "Vance", "Rostova", "Hayes", "Brooks", "Washington", "Chen", "O'Connor", "Morales",
    "Johnson", "Silva", "Kowalski", "Patel", "Campbell", "Adebayo", "Larson", "Kim",
    "Taylor", "Dubois", "Santos", "Wright", "Nakamura", "Alvarez", "Murphy", "Diallo"
]

SPORTS = [
    {"name": "Men's Basketball", "gender": "M", "season": "WINTER", "roster_size": 15},
    {"name": "Women's Soccer", "gender": "F", "season": "FALL", "roster_size": 24},
    {"name": "Men's Track & Field", "gender": "M", "season": "SPRING", "roster_size": 28},
    {"name": "Women's Volleyball", "gender": "F", "season": "FALL", "roster_size": 16}
]

MAJORS = [
    {"name": "Kinesiology & Exercise Science", "dept": "KIN", "total_credits": 120},
    {"name": "Business Administration", "dept": "BUS", "total_credits": 120},
    {"name": "Communications", "dept": "COMM", "total_credits": 120},
    {"name": "Biological Sciences", "dept": "BIOL", "total_credits": 124},
    {"name": "Computer Science", "dept": "CS", "total_credits": 128},
    {"name": "Psychology", "dept": "PSYC", "total_credits": 120}
]

COURSES = [
    ("KIN 101", "Introduction to Kinesiology", 3),
    ("KIN 240", "Human Anatomy for Athletes", 4),
    ("BUS 100", "Principles of Management", 3),
    ("BUS 210", "Financial Accounting", 3),
    ("COMM 105", "Public Speaking", 3),
    ("COMM 220", "Sports Media & Public Relations", 3),
    ("BIOL 110", "General Biology I", 4),
    ("CS 101", "Introduction to Programming", 3),
    ("PSYC 101", "General Psychology", 3),
    ("MATH 115", "College Algebra", 3),
    ("ENG 101", "College Writing & Rhetoric", 3),
    ("HIST 130", "American History", 3)
]

def generate_student(index: int, sport: Dict[str, Any], term_level: int) -> Dict[str, Any]:
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    student_id = f"ATH-2026-{1000 + index}"
    email = f"{first.lower()}.{last.lower()}@athletics.edu"
    major_obj = random.choice(MAJORS)
    major_declared = term_level >= 5
    major_name = major_obj["name"] if major_declared else "Exploratory / Undeclared"

    # Terms and credits
    total_degree_req = major_obj["total_credits"]
    
    # Calculate realistic credits based on class year
    if term_level <= 2: # Freshman
        cum_credits = random.randint(12, 28)
        cum_gpa = round(random.uniform(2.1, 3.8), 2)
        enrolled = random.randint(13, 16)
        term_passed = cum_credits
        acad_year = cum_credits
    elif term_level <= 4: # Sophomore
        cum_credits = random.randint(28, 58)
        cum_gpa = round(random.uniform(1.9, 3.9), 2)
        enrolled = random.randint(12, 16)
        term_passed = random.randint(12, 15)
        acad_year = random.randint(24, 30)
    elif term_level <= 6: # Junior
        cum_credits = random.randint(58, 88)
        cum_gpa = round(random.uniform(2.0, 3.9), 2)
        enrolled = random.randint(12, 16)
        term_passed = random.randint(12, 16)
        acad_year = random.randint(24, 32)
    else: # Senior
        cum_credits = random.randint(88, 118)
        cum_gpa = round(random.uniform(2.2, 4.0), 2)
        enrolled = random.randint(12, 15)
        term_passed = random.randint(12, 15)
        acad_year = random.randint(24, 30)

    # Inject deliberate compliance variations for testing
    variant = random.random()
    status = "ELIGIBLE"
    risk_level = "LOW"
    
    if variant < 0.08:
        # At risk PTD
        if term_level >= 5:
            cum_credits = int(total_degree_req * 0.38) # Deficient PTD
            status = "INELIGIBLE"
            risk_level = "CRITICAL"
    elif variant < 0.15:
        # Low GPA risk
        cum_gpa = round(random.uniform(1.72, 1.88), 2)
        status = "AT_RISK" if cum_gpa >= 1.80 else "INELIGIBLE"
        risk_level = "HIGH"
    elif variant < 0.20:
        # Enrolled credit risk (dropping to 11)
        enrolled = 11
        status = "INELIGIBLE"
        risk_level = "CRITICAL"

    ptd_pct = round((cum_credits / total_degree_req) * 100.0, 1)

    # Current enrolled courses
    num_courses = max(3, enrolled // 3)
    enrolled_courses = random.sample(COURSES, min(num_courses, len(COURSES)))

    return {
        "id": student_id,
        "name": f"{first} {last}",
        "email": email,
        "sport": sport["name"],
        "season": sport["season"],
        "currentTermNumber": term_level,
        "classStanding": "Freshman" if term_level <= 2 else ("Sophomore" if term_level <= 4 else ("Junior" if term_level <= 6 else "Senior")),
        "major": major_name,
        "majorDeclared": major_declared,
        "enrolledCredits": enrolled,
        "lastTermPassedCredits": term_passed,
        "academicYearCredits": acad_year,
        "cumulativeDegreeCredits": cum_credits,
        "totalDegreeCreditsRequired": total_degree_req,
        "ptdPercentage": ptd_pct,
        "cumulativeGpa": cum_gpa,
        "eligibilityStatus": status,
        "academicRiskLevel": risk_level,
        "studyHallHoursCompleted": random.randint(2, 10),
        "studyHallHoursRequired": 8 if (cum_gpa < 2.5 or term_level <= 2) else 4,
        "enrolledCourses": [{"code": c[0], "title": c[1], "credits": c[2]} for c in enrolled_courses]
    }

def generate_dataset(num_athletes: int = 30) -> Dict[str, Any]:
    random.seed(42)
    athletes = []
    
    for i in range(num_athletes):
        sport = SPORTS[i % len(SPORTS)]
        term = random.choice([1, 2, 3, 4, 5, 6, 7, 8])
        athletes.append(generate_student(i + 1, sport, term))

    return {
        "institution": "State University Athletic Department (NCAA Division I)",
        "generatedAt": "2026-10-02T00:00:00Z",
        "totalAthletes": len(athletes),
        "summary": {
            "eligibleCount": sum(1 for a in athletes if a["eligibilityStatus"] == "ELIGIBLE"),
            "atRiskCount": sum(1 for a in athletes if a["eligibilityStatus"] == "AT_RISK"),
            "ineligibleCount": sum(1 for a in athletes if a["eligibilityStatus"] == "INELIGIBLE")
        },
        "studentAthletes": athletes
    }

def to_sql(dataset: Dict[str, Any]) -> str:
    lines = [
        "-- Athletic Academics Hub Synthetic Seed Data",
        f"-- Generated {dataset['generatedAt']}",
        "-- FERPA Compliant: All names, IDs, and records are fully synthetic\n"
    ]
    
    for a in dataset["studentAthletes"]:
        name_esc = a["name"].replace("'", "''")
        sport_esc = a["sport"].replace("'", "''")
        major_esc = a["major"].replace("'", "''")
        sql = (
            f"INSERT INTO student_athletes (id, name, email, sport, current_term, class_standing, "
            f"major, major_declared, enrolled_credits, cum_degree_credits, gpa, eligibility_status, risk_level) "
            f"VALUES ('{a['id']}', '{name_esc}', '{a['email']}', '{sport_esc}', {a['currentTermNumber']}, "
            f"'{a['classStanding']}', '{major_esc}', {'TRUE' if a['majorDeclared'] else 'FALSE'}, "
            f"{a['enrolledCredits']}, {a['cumulativeDegreeCredits']}, {a['cumulativeGpa']}, "
            f"'{a['eligibilityStatus']}', '{a['academicRiskLevel']}');"
        )
        lines.append(sql)

    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Synthetic Athletic Academic Dataset Generator")
    parser.add_argument("--count", type=int, default=25, help="Number of student-athletes to generate")
    parser.add_argument("--format", choices=["json", "sql"], default="json", help="Output format (json or sql)")
    parser.add_argument("--output", type=str, help="Output file path (optional)")
    args = parser.parse_args()

    data = generate_dataset(args.count)

    if args.format == "sql":
        output_content = to_sql(data)
    else:
        output_content = json.dumps(data, indent=2)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(output_content)
        print(f"Generated {args.count} synthetic athlete records in {args.output}")
    else:
        print(output_content)

if __name__ == "__main__":
    main()
