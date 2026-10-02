---
name: ferpa-privacy-guard
description: >-
  Audits source code, API routes, logging pipelines, and AI prompt templates for FERPA compliance.
  Use when inspecting endpoints that handle student records, checking for unmasked PII/GPA logging,
  verifying role-based access control (RBAC), preventing leakage into LLM prompts, or running pre-commit privacy scans.
  WHEN: "ferpa audit", "privacy check", "student privacy", "pii leak", "audit student data",
  "ferpa compliance", "sanitize prompts", "student record security", "check privacy".
---

# FERPA Privacy Guard & Student Record Security Skill

This skill provides privacy enforcement guidelines and an automated static analysis scanner to ensure all code adhering to Family Educational Rights and Privacy Act (FERPA - 34 CFR Part 99) mandates.

---

## 1. Golden Rules for Student Data Privacy

1. **Never Log Student Educational Records**:
   - Prohibit logging cumulative GPA, grades, transcripts, disability accommodations, or full student IDs in application logs.
   - If debugging, log an opaque hash (`hashId(student.id)`) and term code only.
2. **Strict School Official Role-Based Access Control**:
   - All API routes returning student-athlete records must require authenticated session tokens with verified roles (`ADVISOR`, `COMPLIANCE_OFFICER`, `COACH`, `STUDENT_ATHLETE`).
   - Student-athletes may only access their own educational records (`req.auth.userId === targetStudent.userId`).
3. **AI Prompt Sanitization**:
   - LLMs used in advising and compliance must operate under zero-data-retention (ZDR) enterprise agreements.
   - Prompts must not interpolate raw Social Security Numbers or off-field disciplinary records.

---

## 2. Using the Automated Privacy Scanner

A bundled scanner script is available in `scripts/audit_privacy.py`.

### Scan a Subproject or Directory

```bash
python .agents/skills/ferpa-privacy-guard/scripts/audit_privacy.py athletic-academics-hub-gcp
```

### Run with CI/CD Enforcement (Fail on Critical/High)

```bash
python .agents/skills/ferpa-privacy-guard/scripts/audit_privacy.py . --fail-on-critical
```

### Suppressing Intentional Mock/Docs Examples

Add `// ferpa-ignore` (in code) or `# ferpa-ignore` (in scripts) on the offending line or preceding comment line to suppress known false positives.
