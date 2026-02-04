## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-28 - Design System Inconsistency in Textarea
**Learning:** The `Textarea` component was using hardcoded Tailwind colors (e.g., `border-gray-300`) while its sibling `Input` component used semantic design tokens (e.g., `border-input`). This causes inconsistencies in theming (dark mode) and error state handling.
**Action:** When auditing UI components, cross-reference implementation with similar form controls (`Input`, `Select`) to ensure consistent token usage and state handling (error, focus).
