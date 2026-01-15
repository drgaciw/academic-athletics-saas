## 2025-12-27 - Missing Skip-to-Content Pattern

**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2024-05-22 - Alert Role Misuse
**Learning:** The `Alert` component was universally using `role="alert"`, which is intrusive for non-urgent messages (success, info). Only errors/critical issues should interrupt screen readers.
**Action:** Use `role="status"` for non-critical alerts and `role="alert"` only for errors.
