## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-29 - Overuse of `role="alert"`
**Learning:** The `Alert` component was using `role="alert"` for all variants (success, info, warning, error). This causes unnecessary interruptions for screen reader users, as `role="alert"` implies `aria-live="assertive"`.
**Action:** Use `role="alert"` only for critical errors. Use `role="status"` (which implies `aria-live="polite"`) for success, info, and warning messages to announce updates without aggressive interruption.
