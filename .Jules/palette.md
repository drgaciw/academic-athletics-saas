## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-02-15 - Avatar Fallback Pattern
**Learning:** The `Avatar` component's `onError` handler just hid the image using `display: none` without triggering the fallback UI, leaving a blank space. Standard `img` error handling in React requires state to switch rendering to the fallback.
**Action:** When implementing image components with fallbacks, always use a client-side `hasError` state and `useEffect` to reset it on `src` change.
