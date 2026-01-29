## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-10-26 - Form Accessibility and Feedback Gaps
**Learning:** The custom `SignIn` component in `packages/ui` lacked basic association between `Label` and `Input` (missing `htmlFor` and `id`), rendering it inaccessible to screen readers. It also lacked visual feedback for errors (console log only) and loading states.
**Action:** When auditing forms, check for explicit `id`/`htmlFor` pairings, especially in custom components. Always implement loading states and user-visible error handling for async actions.
