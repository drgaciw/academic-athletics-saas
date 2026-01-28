## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2024-05-23 - Missing Shared Tailwind Configuration
**Learning:** The `apps/main` application does not extend the shared Tailwind configuration from `packages/config`. This means shared semantic tokens (like `error`) are not available as utility classes (e.g., `border-error` does not work).
**Action:** When working in shared UI components (`packages/ui`), prefer standard Tailwind colors (e.g., `border-red-600`) over semantic tokens unless you are certain the consuming app has the token defined, or update the consuming app's configuration.
