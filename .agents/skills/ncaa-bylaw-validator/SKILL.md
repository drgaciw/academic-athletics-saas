---
name: ncaa-bylaw-validator
description: >-
  Codified NCAA Division I academic eligibility reference and automated rule verification engine.
  Use when calculating or validating student-athlete eligibility, Progress-Toward-Degree (PTD 40/60/80%),
  credit hour thresholds (6-hour term, 18-hour annual, 24-hour freshman), GPA minimums (1.8/1.9/2.0),
  full-time enrollment waivers, transfer portal exceptions, or writing tests for compliance services.
  WHEN: "ncaa eligibility", "check ptd", "progress toward degree", "bylaw 14", "credit hour rule",
  "eligibility check", "gpa minimum ncaa", "full time waiver", "academic standing", "transfer portal".
---

# NCAA Division I Academic Eligibility & Bylaw Validator

This skill provides an authoritative reference and verification toolkit for NCAA Division I academic eligibility bylaws (specifically Article 14). Use it to write accurate compliance business logic, evaluate student-athlete records, verify edge-case test suites, and ensure database mutations adhere to regulatory standards.

---

## 1. Core NCAA Division I Bylaw Matrix

### 1.1 Full-Time Enrollment — Bylaw 14.1.2

- **Rule**: A student-athlete must be enrolled in a minimum of **12 semester or quarter hours** of academic work to practice or compete.
- **Exceptions**:
  - **Final Semester Prior to Graduation**: If a student requires fewer than 12 credits to complete degree requirements in their final term, they may compete if certified by the institution registrar.
  - **Graduate Students**: Graduate students carrying the institution's certified full-time graduate load (typically 6–9 credit hours).

### 1.2 Credit Hour Requirements — Bylaw 14.4.3

- **6-Hour Term Rule (Bylaw 14.4.3.1)**: Student-athletes must pass at least **6 degree-applicable credit hours** in the preceding regular academic term (excluding summer) to be eligible for competition in the following term.
- **18-Hour Academic Year Rule (Bylaw 14.4.3.2)**: Student-athletes must earn at least **18 degree-applicable credit hours** during the regular academic year (Fall and Spring semesters; summer credits cannot be used).
- **24-Hour Freshman Requirement (Bylaw 14.4.3.3)**: Freshmen must earn at least **24 semester hours** of academic credit prior to their second year of collegiate enrollment (up to 6 hours of summer credit may be counted).

### 1.3 Progress-Toward-Degree (PTD) Percentage Rules — Bylaw 14.4.3.2.1

Entering each academic year, student-athletes must have completed a designated percentage of the course requirements in their specific designated degree program:

| Entering Year | Entering Term (Semesters) | Minimum PTD Percentage              | Major Requirement                 |
| :------------ | :------------------------ | :---------------------------------- | :-------------------------------- |
| **Year 2**    | Term 3                    | **24 credit hours** (Freshman rule) | Exploratory / Pre-Major allowed   |
| **Year 3**    | Term 5                    | **40% of degree requirements**      | **Formal Major MUST be declared** |
| **Year 4**    | Term 7                    | **60% of degree requirements**      | Major requirements must apply     |
| **Year 5**    | Term 9                    | **80% of degree requirements**      | Major requirements must apply     |

_Note: For standard 120-credit degree programs: 40% = 48 credits, 60% = 72 credits, 80% = 96 credits._

### 1.4 Minimum GPA Benchmarks — Bylaw 14.4.3.3.1

Student-athletes must achieve a cumulative GPA based on the institution's minimum graduation requirement (standard baseline is 2.000):

| Entering Year | Entering Term | Minimum % of Institutional GPA | Standard 2.000 GPA Baseline |
| :------------ | :------------ | :----------------------------- | :-------------------------- |
| **Year 2**    | Term 3        | 90%                            | **1.800**                   |
| **Year 3**    | Term 5        | 95%                            | **1.900**                   |
| **Year 4+**   | Term 7+       | 100%                           | **2.000**                   |

---

## 2. Using the Automated Verification CLI

A bundled CLI tool is available in `scripts/validate_eligibility.py` for testing and verifying student records.

### Run Built-In Edge-Case Test Suite

```bash
python .agents/skills/ncaa-bylaw-validator/scripts/validate_eligibility.py --test
```

### Validate a Student JSON Record

```bash
python .agents/skills/ncaa-bylaw-validator/scripts/validate_eligibility.py --student-json path/to/student.json --json
```

### Student JSON Schema Format

```json
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
  "majorDeclared": true,
  "isGraduatingSenior": false
}
```

---

## 3. Developer Guidance When Building Compliance Services

1. **Precision & Rounding**:
   - PTD percentages are evaluated strictly against degree requirements (e.g. 47 degree credits on a 120 credit degree = 39.17%, which is an **immediate ineligibility** under the 40% rule). Never round up deficient credits.
2. **Degree Applicability**:
   - Once a student enters Term 5, credits earned outside the designated major program requirements (electives exceeding program allowances) **cannot** be counted toward the 40/60/80% benchmarks or the 6-hour/18-hour rules.
3. **Summer Credit Restrictions**:
   - Summer courses can be used to meet the 24-hour freshman rule (up to 6 credits) and PTD percentage requirements.
   - **Crucial exception**: Summer credits can **NEVER** be counted toward the 18-hour regular academic year requirement (Bylaw 14.4.3.2).
