## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-28 - Calendar Accessibility Pattern
**Learning:** The `Calendar` component was rendering day numbers (1-31) without context, making it confusing for screen reader users ("button 1", "button 2").
**Action:** Always provide full date context in `aria-label` (e.g., "January 1st, 2024") and explicitly mark selected states with `aria-selected`. Navigation icons must also be hidden or labeled.
