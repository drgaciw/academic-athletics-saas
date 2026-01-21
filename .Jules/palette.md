## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-27 - Form Loading & Feedback
**Learning:** The custom `SignIn` component in `packages/ui` lacked loading states and visual error feedback, relying only on console logs. This leaves users unsure if their interaction succeeded or failed.
**Action:** Always wrap async form actions in a `try/catch/finally` block that manages `isLoading` and `error` state. Use existing UI components like `Alert` and `Button`'s `loading` prop to communicate status.
