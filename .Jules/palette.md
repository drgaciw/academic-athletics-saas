## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-27 - Missing Form Label Associations
**Learning:** The `SignIn` component was completely missing label-input association (`htmlFor`/`id`), which is a fundamental accessibility requirement often overlooked in custom auth forms.
**Action:** When auditing forms, specifically check that clicking the label focuses the input.
