# @aah/ui - Athletic Academics Hub Design System

Comprehensive UI component library built with Shadcn/UI, Tailwind CSS, and React for the Athletic Academics Hub platform.

## Overview

This package provides a complete design system with:
- **Design Tokens**: CSS custom properties for colors, typography, spacing, shadows, and z-index
- **Atomic Components**: Button, Input, Label, Badge, Avatar, Spinner
- **Molecule Components**: SearchInput, SelectField, DatePicker, StatCard, AlertBanner
- **Organism Components**: DataTable, NavigationBar, Sidebar, Modal, Calendar
- **Accessibility**: WCAG 2.1 Level AA compliant components
- **Dark Mode**: Full dark mode support via CSS custom properties

## Installation

This package is part of the AAH monorepo and is consumed by apps via workspace dependencies:

```json
{
  "dependencies": {
    "@aah/ui": "workspace:*"
  }
}
```

## Usage

### Importing Components

```typescript
import { Button, Card, Badge } from '@aah/ui'

export function MyComponent() {
  return (
    <Card>
      <Badge variant="success">Eligible</Badge>
      <Button variant="default" size="lg">
        View Details
      </Button>
    </Card>
  )
}
```

### Importing Styles

In your app's root layout or _app file:

```typescript
import '@aah/ui/styles/globals.css'
```

### Using Design Tokens

Design tokens are available as CSS custom properties:

```css
.my-component {
  color: var(--brand-primary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

Or via Tailwind classes:

```tsx
<div className="text-brand-primary p-4 rounded-md shadow-md">
  Content
</div>
```

## Design Tokens

### Colors

- **Brand**: `--brand-primary`, `--brand-secondary`, `--brand-accent`
- **Semantic**: `--success`, `--warning`, `--error`, `--info`
- **NCAA Status**: `--eligible`, `--at-risk`, `--ineligible`, `--pending-review`

### Typography

- **Font Families**: `--font-sans`, `--font-mono`
- **Font Sizes**: `--text-xs` through `--text-4xl`

### Spacing

- **Scale**: `--space-1` (4px) through `--space-12` (48px)
- Based on 4px base unit

### Border Radius

- **Sizes**: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`

### Shadows

- **Elevations**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

### Z-Index

- **Layers**: `--z-dropdown`, `--z-modal`, `--z-tooltip`, `--z-notification`, etc.

## Component Variants

### Button

```tsx
<Button variant="default">Primary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="link">Link Style</Button>

<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Badge

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="success">Eligible</Badge>
<Badge variant="warning">At Risk</Badge>
<Badge variant="destructive">Ineligible</Badge>
<Badge variant="secondary">Pending</Badge>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader compatibility
- Color contrast ratios ≥ 4.5:1

## Dark Mode

Dark mode is supported via CSS custom properties. Components automatically adapt when the `dark` class is applied to the root element:

```tsx
<html className="dark">
  {/* All components will use dark mode colors */}
</html>
```

Or use system preference:

```tsx
<html className={systemTheme === 'dark' ? 'dark' : ''}>
  {/* Respects user's system preference */}
</html>
```

## Responsive Design

Components are mobile-first and responsive:

```tsx
<div className="
  flex flex-col gap-4      /* Mobile: vertical stack */
  md:flex-row md:gap-6     /* Tablet: horizontal */
  lg:gap-8                 /* Desktop: larger gaps */
">
  {/* Content */}
</div>
```

Breakpoints:
- `xs`: 375px (Mobile small)
- `sm`: 640px (Mobile large)
- `md`: 768px (Tablet)
- `lg`: 1024px (Desktop)
- `xl`: 1280px (Desktop large)
- `2xl`: 1536px (Desktop xlarge)

## Development

### Adding New Components

1. Create component file in `components/` directory
2. Export from `index.tsx`
3. Add Storybook story (if applicable)
4. Write unit tests
5. Update this README

### Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Building

```bash
# Build the package
pnpm build
```

## Contributing

See the main repository CONTRIBUTING.md for guidelines.

## License

Proprietary - Athletic Academics Hub
