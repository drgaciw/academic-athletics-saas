## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-02-15 - Avatar Fallback Pattern
**Learning:** The `Avatar` component's `onError` handler just hid the image using `display: none` without triggering the fallback UI, leaving a blank space. Standard `img` error handling in React requires state to switch rendering to the fallback.
**Action:** When implementing image components with fallbacks, always use a client-side `hasError` state and `useEffect` to reset it on `src` change.
## 2026-01-27 - Resilient Avatar Fallbacks
**Learning:** The `Avatar` component failed silently when an image source was provided but failed to load (404), rendering nothing instead of the fallback initials. This is a common pattern where "unhappy paths" for images are overlooked.
**Action:** Always implement `onError` handling for user-provided images to gracefully degrade to fallbacks, ensuring identity is always represented.
## 2024-05-23 - Missing Shared Tailwind Configuration
**Learning:** The `apps/main` application does not extend the shared Tailwind configuration from `packages/config`. This means shared semantic tokens (like `error`) are not available as utility classes (e.g., `border-error` does not work).
**Action:** When working in shared UI components (`packages/ui`), prefer standard Tailwind colors (e.g., `border-red-600`) over semantic tokens unless you are certain the consuming app has the token defined, or update the consuming app's configuration.
## 2025-10-26 - Form Accessibility and Feedback Gaps
**Learning:** The custom `SignIn` component in `packages/ui` lacked basic association between `Label` and `Input` (missing `htmlFor` and `id`), rendering it inaccessible to screen readers. It also lacked visual feedback for errors (console log only) and loading states.
**Action:** When auditing forms, check for explicit `id`/`htmlFor` pairings, especially in custom components. Always implement loading states and user-visible error handling for async actions.
## 2026-01-30 - Client-Side Image Fallbacks
**Learning:** The `Avatar` component failed to show fallbacks for broken image URLs because it relied solely on the presence of the `src` prop, not the loading status. This pattern required converting to a Client Component to track `onError` state.
**Action:** When implementing image components, always verify how `onError` interacts with fallback visibility. Use state to track loading failures.
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

## 2026-01-31 - Overuse of Role="alert"
**Learning:** The `Alert` and `AlertBanner` components were using `role="alert"` (assertive) for all variants, including success and info. This causes screen readers to interrupt users unnecessarily for non-critical updates.
**Action:** Use `role="alert"` only for error messages. For success, info, and warning messages, use `role="status"` which maps to `aria-live="polite"`.
## 2025-05-23 - Collapsed Navigation Accessibility
**Learning:** Collapsed sidebars often rely on `title` attributes for tooltips, which are inaccessible to screen reader users. The `Sidebar` component used `title` but lacked `aria-label`, making navigation links "unnamed" in collapsed state.
**Action:** Always pair `aria-label` with `title` (or custom tooltip) for icon-only buttons/links. Ensure the inner icon is marked `aria-hidden="true"` when the container has an accessible name.
## 2026-02-06 - Dynamic Aria Roles for Alerts
**Learning:** Using `role="alert"` for all notifications interrupts screen reader users unnecessarily. Only critical errors should be assertive (`alert`). Success, info, and warning messages should be polite (`status`).
**Action:** When implementing notification components, dynamically set the role based on severity: `role="alert"` for errors, `role="status"` for others.
## 2025-05-24 - Icon-Only Link Accessibility
**Learning:** Icon-only links (like social media icons in footers) are often missing `aria-label`s, making them inaccessible to screen readers. This pattern is easy to miss visually but critical for WCAG compliance.
**Action:** Always check icon-only links for `aria-label` or visually hidden text. Use Playwright to verify `aria-label` presence even if there is no visual change.
