# Product Requirements Document (PRD): NCAA Transfer Credit Agentic System

> Status: Planned / not yet implemented in this repository.
>
> This document describes proposed future functionality. The transfer-credit workflow, transfer-specific agents, OCR ingestion pipeline, registrar HITL queue, and transfer reporting surfaces described below are not currently implemented end-to-end in the codebase.

## 1. Introduction/Overview
*   **Goal**: To develop an autonomous multi-agent system to process and validate NCAA Division I transfer student-athlete academic eligibility, with a primary focus on automated course equivalency mapping.
*   **Background**: Manual evaluation of transfer credits is the largest bottleneck in student-athlete recruitment. Current processes rely on static equivalency tables that are often outdated. This system leverages LLMs to perform semantic mapping between diverse course catalogs.
*   **Target Audience**: NCAA Compliance Officers, University Registrars, Academic Advisors, and Student-Athletes.

## 2. Goals & Objectives
*   **Business Objectives**:
    *   Reduce average time for transfer credit evaluation from days to under 10 minutes.
    *   Achieve 99% accuracy in eligibility determinations compared to official manual evaluations.
    *   Increase consistency in course mapping across different evaluators and academic departments.
*   **Product Goals**:
    *   **Semantic Mapping**: Use LLM reasoning to map courses based on descriptions/syllabi when exact course codes don't match, particularly for non-accredited or vocational coursework.
    *   **Policy Enforcement**: Automate institutional rules (e.g., minimum 'C' grade, accreditation-based acceptance).
    *   **Human-in-the-Loop (HITL)**: Flag low-confidence mappings or "Petition to Transfer" scenarios for manual registrar review.
    *   **Auditability**: Every determination must link back to a specific NCAA Bylaw (e.g., Article 14) and institutional policy.

## 3. User Stories
*   **Compliance Officer**: "As a compliance officer, I want the system to automatically flag if a transfer student meets the 24/36/48 hour requirements so I can focus on edge cases."
*   **Registrar**: "As a registrar, I want to review and 'verify' suggested course equivalencies so the agent learns our specific institutional standards."
*   **Student-Athlete**: "As a student-athlete, I want to see a 'what-if' report showing how my credits transfer into different degree plans at this university."

## 4. Functional Requirements
### `FR-DATA`: Data Ingestion & Validation
*   **FR-D1**: Support PDF and OCR-based transcript ingestion, extracting course codes, titles, grades, and credit hours.
*   **FR-D2**: Ingest university course catalogs and accreditation databases (e.g., CHEA).
*   **FR-D3**: **Grade Filtering**: Automatically exclude courses with grades below "C" from eligibility calculations.
*   **FR-D4**: **Accreditation Check**: Flag courses from non-accredited institutions for individual evaluation/petition.
*   **FR-D5**: **International Transcript Support**:
    *   Ingest evaluations from third-party services (e.g., WES, ECE, InCred).
    *   Support OCR and translation for non-English transcripts (integrated with translation LLMs).
    *   Apply NCAA International Academic Standards for grading scale conversions.
*   **FR-D6**: **Non-Traditional Credits (AP/CLEP/Military)**:
    *   Ingest AP/CLEP scores and map to university-specific credit awards.
    *   Process Joint Services Transcripts (JST) for military credit evaluation.
    *   Validate credits against NCAA Bylaw 14.4.3.5 (Non-traditional courses).
*   **FR-D7**: **Credit System Conversion**:
    *   Automatically detect and convert "Quarter Hours" to "Semester Hours" (1.0 Quarter Hour = 0.667 Semester Hour) for standardized calculation.
    *   Ensure all NCAA calculations (6/18/24) use the converted semester-hour standard.
*   **FR-D8**: **Repeated Course Logic**:
    *   Detect duplicate course entries across multiple semesters.
    *   Apply NCAA Bylaw 14.4.3.3.6: Only count the first instance of a passing grade toward credit hour requirements, unless institutional policy allows otherwise for specific courses (e.g., performance ensembles).

### `FR-EQUIV`: Course Equivalency Engine
*   **FR-E1**: The system must perform semantic matching of course descriptions to determine transferability, especially for "Technical/Vocational" or "Liberal Arts" classification.
*   **FR-E2**: **Degree Block Waiver**: Identify students with completed AA/AS/BA degrees and apply general education block waivers (e.g., 37-hour waiver) where applicable.
*   **FR-E3**: The system must assign a "Confidence Score" (0-100%) to every mapping.
*   **FR-E4**: Mappings below 85% confidence or those requiring a "Petition to Transfer" MUST be routed to the HITL Review Queue.

### `FR-COMP`: NCAA Compliance Validation
*   **FR-C1**: Calculate GPA according to NCAA Division I standards (Article 14.5).
*   **FR-C2**: Validate credit hour accumulation (6/18/24 rules).
*   **FR-C3**: Check Progress-Toward-Degree (PTD) percentages (40/60/80%).

### `FR-REP`: Reporting
*   **FR-R1**: Generate an Eligibility Assessment Report with specific bylaw citations.
*   **FR-R2**: Export reports in PDF and NCAA Transfer Portal-compatible formats.

## 5. The Agentic Workflow
The system utilizes a specialized multi-agent architecture:

1.  **Data Aggregation Agent**: Parses transcripts and cleans raw data.
2.  **Equivalency Agent**: Performs RAG-based searches against the target university's catalog to suggest course matches.
3.  **Compliance Agent**: Applies NCAA Bylaws to the mapped credits to determine eligibility.
4.  **Revision Agent**: Cross-references the final report against known "Golden Source" equivalencies to ensure zero regression.

## 6. Technical Considerations
*   **Knowledge Base**: A vector database (RAG) containing the latest NCAA Division I Manual and historical equivalency decisions.
*   **Security**: Data encryption at rest and in transit; FERPA compliance for student records.
*   **Integration**: Hook into existing SIS (Student Information Systems) like Banner or PeopleSoft.

## 7. Success Metrics
*   **Mapping Coverage**: % of transfer courses automatically mapped with high confidence.
*   **Review Cycle Time**: Time between transcript upload and final compliance sign-off.
*   **Accuracy**: Discrepancy rate between agent determination and final human audit.