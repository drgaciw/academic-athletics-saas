# Student-Athlete Transfer Reporting Page Prompts

> Status: Planned UI/prompt artifact.
>
> The transfer reporting page described below is not currently implemented in this repository. This document should be treated as future-scope planning material.

This document contains prompts for generating the UI and logic for the NCAA Transfer Reporting Page, as specified in [transfer-credits-prd.md](transfer-credits-prd.md).

## 1. UI Component: Transfer Eligibility Dashboard
**Goal**: Create a high-level summary dashboard for the student-athlete.

**Prompt**:
```text
Act as a Senior Frontend Developer specializing in data-heavy SaaS dashboards. 
Design a 'Transfer Eligibility Dashboard' component for student-athletes.

REQUIRED SECTIONS:
1. ELIGIBILITY STATUS: A prominent badge (Eligible, Conditional, Ineligible) with a hover-over explaining the '6/18/24' rule status.
2. GPA PROGRESS: A circular progress bar showing the NCAA-calculated GPA (min 2.0 required).
3. CREDIT BREAKDOWN: A bar chart comparing 'Total Credits Taken' vs 'NCAA Transferable Credits' (filtered for grades >= C).
4. BYLAW CITATIONS: A section listing specific Article 14 rules applied to the student's record.

TECHNICAL REQUIREMENTS:
- Use Tailwind CSS for styling.
- Ensure FERPA-compliant data masking for sensitive fields.
- Include an 'Export to PDF' button (referencing FR-R2).
```

---

## 2. 'What-If' Degree Audit Tool
**Goal**: Implement the student-athlete user story: "I want to see how my credits transfer into different degree plans."

**Prompt**:
```text
Act as an Academic Advising UX Specialist. 
Generate the prompt for an AI agent that handles 'What-If' degree scenarios for transfer students.

INPUTS:
- Current mapped credits (from the Equivalency Agent).
- Target Degree Program (e.g., BS in Sports Management, BA in Communications).

LOGIC:
- Apply 'General Education Block Waivers' (FR-E2) if the student has an AA/AS degree.
- Map transferable courses to specific major requirements.
- Calculate 'Remaining Credits to Graduation' and 'Progress-Toward-Degree (PTD) %' (FR-C3).

OUTPUT:
- A side-by-side comparison of how the student's existing credits apply to two different degree tracks.
- Highlighting courses that did NOT transfer to the specific major but count as general electives.
```

---

## 3. Eligibility Assessment Report (PDF/NCAA Portal)
**Goal**: Generate the detailed technical report required by FR-R1 and FR-R2.

**Prompt**:
```text
Act as a Compliance Document Architect. 
Design the structure and generation prompt for the 'Official NCAA Eligibility Assessment Report'.

STRUCTURE:
1. HEADER: Student Name, NCAA ID, Source Institution, Target Institution.
2. ACADEMIC SUMMARY: Total Semester Hours (converted if necessary per FR-D7), Cumulative NCAA GPA.
3. COMPLIANCE CHECKLIST: 
   - [ ] 6-hour rule (Last Term)
   - [ ] 18-hour rule (Academic Year)
   - [ ] 24-hour rule (Initial Year)
   - [ ] 40/60/80% PTD (Years 3/4/5)
4. DETAILED EQUIVALENCIES: Table showing Transfer Course -> Host Course -> Status (Verified/HITL) -> Grade.
5. LEGAL FOOTER: Specific NCAA Bylaw citations (Article 14) for every 'Met/Not Met' determination.

EXPORT LOGIC:
- Generate JSON schema compatible with the NCAA Transfer Portal.
- Generate a password-protected PDF for the student and Compliance Officer.
```

---

## 4. HITL Review Notification (Registrar View)
**Goal**: Prompt for the interface where a Registrar reviews low-confidence mappings (FR-E4).

**Prompt**:
```text
Design a 'Registrar Review Queue' interface prompt. 
When the Equivalency Agent flags a course with < 85% confidence, it appears here.

FEATURES:
- Compare View: Show Transfer Course Description vs. Host Course Description side-by-side.
- Override Controls: Buttons for 'Approve Mapping', 'Reject/Mark as Elective', or 'Request Syllabus'.
- Learning Hook: When a registrar manually maps a course, trigger a prompt to update the 'Golden Source' database for future automated mapping.
```