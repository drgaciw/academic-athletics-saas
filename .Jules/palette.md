## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2026-01-27 - Resilient Avatar Fallbacks
**Learning:** The `Avatar` component failed silently when an image source was provided but failed to load (404), rendering nothing instead of the fallback initials. This is a common pattern where "unhappy paths" for images are overlooked.
**Action:** Always implement `onError` handling for user-provided images to gracefully degrade to fallbacks, ensuring identity is always represented.
