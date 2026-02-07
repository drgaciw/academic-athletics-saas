## 2025-12-27 - Missing Skip-to-Content Pattern
**Learning:** The `apps/main` layout was missing a standard "Skip to content" link, which is a critical WCAG 2.4.1 requirement. This forces keyboard users to navigate through the entire header on every page load.
**Action:** Always verify global layouts for skip links. When adding them, ensure the target (`<main id="main-content">`) exists and wraps the page content properly.

## 2025-05-22 - Consistent Form Error States
**Learning:** The design system tokens for form states (e.g., 'border-error') were implemented in `Input` but missing in `Textarea`, causing visual inconsistency and accessibility gaps (missing `aria-invalid`). `Textarea` was using hardcoded colors instead of semantic tokens.
**Action:** When working on form components, always check sibling components (e.g., Input vs Textarea) to ensure feature parity (like `error` props) and design token usage consistency.

## 2025-12-28 - Accessible Collapsed Sidebar
**Learning:** Collapsed navigation sidebars often render icon-only links. Without explicit `aria-label` attributes, these links become inaccessible to screen reader users as the visual text label is removed.
**Action:** When implementing collapsible sidebars, ensure the link component receives an `aria-label` (typically the item label) when collapsed, and mark the accompanying icon as `aria-hidden="true"` to prevent redundant announcements.
