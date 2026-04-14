## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-28 - Inconsistent Textarea State Patterns
**Learning:** The `Textarea` component lacked the `error` state prop and design tokens used by `Input`, leading to inconsistent validation feedback. Forms using `react-hook-form` were passing `error` props that were ignored.
**Action:** When auditing form components, ensure all inputs (`Textarea`, `Select`, etc.) support the standard `error` prop and mapping to `aria-invalid` to ensure consistent accessibility and visual feedback.
## 2025-12-27 - Inline Details vs Modal for Complex Data
**Learning:** Displaying complex data like diff views (via `ReactDiffViewer`) inline below a long table causes users to lose context and miss the feedback.
**Action:** Use a `Modal` for detailed views of complex objects linked from a table row, ensuring focus is managed and context is preserved.
## 2025-12-28 - Design System Inconsistency in Textarea
**Learning:** The `Textarea` component was using hardcoded Tailwind colors (e.g., `border-gray-300`) while its sibling `Input` component used semantic design tokens (e.g., `border-input`). This causes inconsistencies in theming (dark mode) and error state handling.
**Action:** When auditing UI components, cross-reference implementation with similar form controls (`Input`, `Select`) to ensure consistent token usage and state handling (error, focus).
## 2025-05-22 - Consistent Form Error States
**Learning:** The design system tokens for form states (e.g., 'border-error') were implemented in `Input` but missing in `Textarea`, causing visual inconsistency and accessibility gaps (missing `aria-invalid`). `Textarea` was using hardcoded colors instead of semantic tokens.
**Action:** When working on form components, always check sibling components (e.g., Input vs Textarea) to ensure feature parity (like `error` props) and design token usage consistency.

## 2025-05-23 - Collapsed Navigation Accessibility
**Learning:** Collapsed sidebars often rely on `title` attributes for tooltips, which are inaccessible to screen reader users. The `Sidebar` component used `title` but lacked `aria-label`, making navigation links "unnamed" in collapsed state.
**Action:** Always pair `aria-label` with `title` (or custom tooltip) for icon-only buttons/links. Ensure the inner icon is marked `aria-hidden="true"` when the container has an accessible name.
## 2026-02-06 - Dynamic Aria Roles for Alerts
**Learning:** Using `role="alert"` for all notifications interrupts screen reader users unnecessarily. Only critical errors should be assertive (`alert`). Success, info, and warning messages should be polite (`status`).
**Action:** When implementing notification components, dynamically set the role based on severity: `role="alert"` for errors, `role="status"` for others.
## 2025-05-24 - Icon-Only Link Accessibility
**Learning:** Icon-only links (like social media icons in footers) are often missing `aria-label`s, making them inaccessible to screen readers. This pattern is easy to miss visually but critical for WCAG compliance.
**Action:** Always check icon-only links for `aria-label` or visually hidden text. Use Playwright to verify `aria-label` presence even if there is no visual change.
