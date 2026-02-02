## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-12-27 - Inline Details vs Modal for Complex Data
**Learning:** Displaying complex data like diff views (via `ReactDiffViewer`) inline below a long table causes users to lose context and miss the feedback.
**Action:** Use a `Modal` for detailed views of complex objects linked from a table row, ensuring focus is managed and context is preserved.
