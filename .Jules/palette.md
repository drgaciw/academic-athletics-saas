## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-27 - Alert Role Overuse
**Learning:** The `Alert` component was using `role="alert"` for all variants. `role="alert"` invokes an assertive live region that interrupts the user immediately, which is too aggressive for non-critical information like success messages or general info.
**Action:** Use `role="alert"` only for critical errors. Use `role="status"` (which is polite) for success, info, and other non-critical updates.
