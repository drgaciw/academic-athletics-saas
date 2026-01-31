## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2026-01-31 - Overuse of Role="alert"
**Learning:** The `Alert` and `AlertBanner` components were using `role="alert"` (assertive) for all variants, including success and info. This causes screen readers to interrupt users unnecessarily for non-critical updates.
**Action:** Use `role="alert"` only for error messages. For success, info, and warning messages, use `role="status"` which maps to `aria-live="polite"`.
