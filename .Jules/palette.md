## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-28 - Focus Move vs Focus Trap in Modals
**Learning:** The `Modal` component used a "focus move" strategy (focusing the first element on mount) but lacked a true "focus trap". Users could tab out of the modal into the background content, violating accessibility standards and causing confusion.
**Action:** Implement a robust `keydown` listener for the `Tab` key that cycles focus between the first and last focusable elements when a modal is open.
