---
name: athletic-data-seeder
description: >-
  Generates realistic, FERPA-compliant synthetic datasets for NCAA Division I athletic academic platforms.
  Use when seeding local databases, generating test fixtures for unit/integration/E2E testing, mocking student-athlete
  rosters across sports, creating multi-term transcripts, CARA practice hours, and academic risk scenarios.
  WHEN: "seed data", "mock student athletes", "generate roster", "athletic test data", "seed database",
  "mock transcripts", "create sample athletes", "ferpa test data", "seed soccer", "seed basketball".
---

# Athletic Academic Data Seeder Skill

This skill provides utilities to generate realistic, FERPA-compliant synthetic datasets tailored specifically for collegiate athletic academic support platforms. All records are completely fictitious, protecting real student privacy while providing realistic edge cases (such as PTD deficiencies, GPA probation, CARA practice conflicts, and drop-to-ineligible scenarios).

---

## 1. Capabilities & Supported Sports

- **Multi-Sport Rosters**: Men's Basketball, Women's Soccer, Men's Track & Field, Women's Volleyball.
- **Academic Class Standings**: Freshman, Sophomore, Junior, Senior, and 5th-Year cohorts.
- **NCAA Compliance Variations**:
  - Fully eligible athletes on graduation track.
  - Athletes within 5% of PTD probation (Bylaw 14.4.3.2.1).
  - Athletes failing full-time enrollment (dropped to 11 credits, Bylaw 14.1.2).
  - Athletes with sub-threshold cumulative GPAs (Bylaw 14.4.3.3.1).
- **Academic Attributes**: Majors, declared status, enrolled semester courses, study hall completed vs required hours.

---

## 2. Generating Datasets

The bundled Python CLI tool in `scripts/generate_fixtures.py` produces either JSON datasets or SQL migration/seed inserts.

### Generate JSON Fixtures

```bash
python .agents/skills/athletic-data-seeder/scripts/generate_fixtures.py --count 50 --output test_roster.json
```

### Generate Direct SQL Inserts for PostgreSQL / Prisma

```bash
python .agents/skills/athletic-data-seeder/scripts/generate_fixtures.py --count 50 --format sql --output seed_athletes.sql
```

### Pre-Bundled Example

A pre-generated sample of 10 student-athletes is available at:
`examples/sample_roster.json`

---

## 3. FERPA Privacy Standards for Test Data

- **No Real Names or Real Student IDs**: Always use the synthetic generator rather than copying real university student records.
- **Deterministic Seeding**: For automated regression tests, the generator utilizes a fixed seed (`seed(42)`) to ensure repeatable test runs.
