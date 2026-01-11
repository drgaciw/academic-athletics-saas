## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-27 - Hardcoded ARIA Roles in Alerts
**Learning:** The `Alert` component was hardcoding `role="alert"`, causing all variants (even "info" or "success") to be treated as assertive live regions by screen readers. This disrupts users unnecessarily.
**Action:** Use `role="alert"` only for error/critical states. For others, use `role="status"` or standard static markup.
