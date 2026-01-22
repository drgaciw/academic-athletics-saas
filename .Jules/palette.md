## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2026-01-22 - Component Verification with Auth
**Learning:** Verifying UI components in an app secured by Clerk (Middleware + Provider) is challenging because the dev environment enforces auth. Simply modifying middleware isn't enough if `ClerkProvider` is expecting auth context.
**Action:** For UI verification, consider creating a dedicated test route that bypasses auth completely (both middleware and Provider), or use a component playground if available.

## 2026-01-22 - Legacy Styling in Components
**Learning:** Some UI components (`Textarea`) used hardcoded Tailwind colors (e.g., `border-gray-300`) instead of semantic tokens (`border-input`), causing inconsistency with updated components (`Input`) and potential dark mode issues.
**Action:** Always check `packages/ui` components for hardcoded values and refactor to use the project's semantic tokens (`border-input`, `ring-ring`, `bg-background`, etc.) for consistency and theme support.
