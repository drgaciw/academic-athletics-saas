## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-28 - Avatar Image Error State Handling
**Learning:** The `Avatar` component relied on `src` prop existence to decide whether to show the fallback, but failed to account for image loading errors (404, etc). It simply hid the broken image, leaving an empty circle.
**Action:** When implementing media components, always use state to track loading errors and revert to fallbacks, rather than just relying on prop existence.
