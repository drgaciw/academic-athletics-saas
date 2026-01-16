## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-05-18 - Broken Avatar Fallbacks
**Learning:** The `Avatar` component's `onError` handler simply hid the broken image, leaving an empty circle because the fallback logic relied solely on `!src`. This created a "ghost" state for users with invalid image URLs.
**Action:** Use state (`useState`) to track image load errors and explicitly render the fallback when an error occurs, not just when `src` is missing.
