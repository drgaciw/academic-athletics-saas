## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2026-01-30 - Client-Side Image Fallbacks
**Learning:** The `Avatar` component failed to show fallbacks for broken image URLs because it relied solely on the presence of the `src` prop, not the loading status. This pattern required converting to a Client Component to track `onError` state.
**Action:** When implementing image components, always verify how `onError` interacts with fallback visibility. Use state to track loading failures.
