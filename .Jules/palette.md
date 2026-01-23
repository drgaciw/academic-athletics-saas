## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-28 - Inconsistent Form Component States
**Learning:** The `Textarea` component relied on hardcoded Tailwind colors instead of design tokens and lacked the `error` state support present in `Input`. This led to visual drift and missing `aria-invalid` attributes for accessible validation.
**Action:** When auditing UI libraries, cross-reference similar components (e.g., inputs, textareas, selects) to ensure they share the same prop API (like `error`) and consume the same design tokens.
