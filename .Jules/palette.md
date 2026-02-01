## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-28 - Inconsistent Textarea State Patterns
**Learning:** The `Textarea` component lacked the `error` state prop and design tokens used by `Input`, leading to inconsistent validation feedback. Forms using `react-hook-form` were passing `error` props that were ignored.
**Action:** When auditing form components, ensure all inputs (`Textarea`, `Select`, etc.) support the standard `error` prop and mapping to `aria-invalid` to ensure consistent accessibility and visual feedback.
