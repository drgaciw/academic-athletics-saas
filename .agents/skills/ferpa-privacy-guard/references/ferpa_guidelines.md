# FERPA Privacy & Student Data Protection Guidelines

_(Family Educational Rights and Privacy Act — 34 CFR Part 99)_

## 1. What Constitutes an Education Record?

Under FERPA, **education records** are records directly related to a student and maintained by an educational agency or institution or by a party acting for the agency/institution.

In Athletic Academic systems, this strictly includes:

- **Academic Transcripts & Grades**: Course grades, term GPA, cumulative GPA, credits attempted/earned.
- **Degree Progress & Advising Notes**: Graduation audits, major declaration forms, advisor evaluation notes.
- **Learning Accommodations**: Disability service notes, ADHD accommodations, modified exam proctoring records.
- **NCAA Eligibility Certifications**: Progress-toward-degree audit forms, APR documentation, eligibility violation records.
- **Attendance & Study Hall Logs**: Swipe-in/swipe-out timestamps, missed class reports, tutor appointment logs.

> [!CAUTION]
> Education records are **strictly confidential**. They cannot be disclosed without prior written parental/student consent, unless covered by a specific statutory exception.

---

## 2. The "School Official" Exception for AI Agents

When AI assistants, LLMs, or automated microservices process student-athlete records, the system must qualify under the **School Official Exception (34 CFR § 99.31(a)(1))**:

1. **Legitimate Educational Interest**: The AI processing must perform an institutional service for which the university would otherwise use employees (e.g. academic advising, compliance monitoring).
2. **Direct Control**: The institution must maintain direct control over the use and maintenance of education records.
3. **No Secondary Use or Model Training**: LLM providers (e.g. OpenAI, Anthropic, Google Vertex AI) **MUST NOT** use student educational records to train or fine-tune public models. Zero-data-retention (ZDR) contracts must be enforced.
4. **Access Scoping / Tenant Isolation**: An advisor or coach may only access student records for athletes over whom they have official supervisory responsibility.

---

## 3. Engineering Guardrails for Codebases

### Rule 1: No Unredacted PII in Application Logs

- **Prohibited**:
  ```typescript
  // VIOLATION: Exposes student record in plain text server logs (ferpa-ignore)
  console.log(
    `Auditing eligibility for student ${student.id}: GPA ${student.gpa}`,
  );
  ```
- **Required**:
  ```typescript
  // COMPLIANT: Use masked or hashed identifiers
  logger.info("Auditing eligibility", {
    studentHash: hashId(student.id),
    term: student.term,
  });
  ```

### Rule 2: Strict Tenant & Role-Based Access Control (RBAC)

- Every endpoint retrieving student academic or compliance records must verify:
  1. Valid authentication token (JWT / session).
  2. Role check (`ADVISOR`, `COMPLIANCE_OFFICER`, `STUDENT_ATHLETE`).
  3. Ownership check: If `STUDENT_ATHLETE`, `req.auth.userId === targetStudent.userId`.

### Rule 3: LLM Prompt Sanitization

- Never send real social security numbers, full student institutional IDs, or off-field disciplinary records to AI models.
- Use ephemeral pseudonyms (e.g., `Student_Alpha`, `Athlete_441`) in prompt contexts where possible, mapping back to internal IDs within the trusted backend server boundary.
