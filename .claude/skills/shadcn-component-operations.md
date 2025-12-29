# Shadcn Component Operations Skill

Add, customize, and manage Shadcn/UI components in the monorepo.

## Usage

When a user needs to add or customize Shadcn components, use this skill to:
1. Add new Shadcn primitives to the UI package
2. Create custom components based on Shadcn
3. Export components properly for workspace consumption
4. Rebuild and verify across apps

## Adding Shadcn Primitives

### Step 1: Navigate to UI Package

```bash
cd packages/ui
```

### Step 2: Add Component with Shadcn CLI

```bash
# Add single component
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert

# Add multiple components at once
npx shadcn-ui@latest add button card dialog input
```

Components will be added to `packages/ui/src/components/ui/`

### Step 3: Export from Index

Edit `packages/ui/src/index.ts`:

```typescript
// Add new exports
export { Button } from './components/ui/button';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/ui/card';
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
```

### Step 4: Rebuild UI Package

```bash
cd packages/ui
pnpm run build
```

### Step 5: Use in Apps

```typescript
// In any app: apps/main/app/page.tsx
import { Button } from '@aah/ui/button';
import { Card, CardHeader, CardContent } from '@aah/ui/card';

export default function Page() {
  return (
    <Card>
      <CardHeader>Title</CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Creating Custom Components

### Domain-Specific Components

Create custom components in `packages/ui/src/components/custom/`:

```typescript
// packages/ui/src/components/custom/student-card.tsx
import * as React from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface StudentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  sport: string;
  status: "ELIGIBLE" | "INELIGIBLE" | "PENDING";
  gpa?: number;
}

export function StudentCard({
  name,
  sport,
  status,
  gpa,
  className,
  ...props
}: StudentCardProps) {
  const statusColors = {
    ELIGIBLE: "bg-green-500",
    INELIGIBLE: "bg-red-500",
    PENDING: "bg-yellow-500",
  };

  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{name}</h3>
          <Badge className={statusColors[status]}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Sport: {sport}</p>
        {gpa && <p className="text-sm">GPA: {gpa.toFixed(2)}</p>}
      </CardContent>
    </Card>
  );
}
```

Export from index:

```typescript
// packages/ui/src/index.ts
export { StudentCard } from './components/custom/student-card';
```

### Compound Components

```typescript
// packages/ui/src/components/custom/data-table.tsx
import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Button } from "../ui/button";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  cell?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, i) => (
            <TableHead key={i}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
          >
            {columns.map((column, i) => {
              const value = typeof column.accessor === 'function'
                ? column.accessor(row)
                : row[column.accessor];

              return (
                <TableCell key={i}>
                  {column.cell ? column.cell(value) : value}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Customizing Existing Components

### Extending with Variants

```typescript
// packages/ui/src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        // Add custom variant
        success: "bg-green-500 text-white hover:bg-green-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Add custom size
        xl: "h-14 rounded-md px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Theme Customization

Edit `packages/ui/src/styles/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --secondary: 210 40% 96.1%;
    --accent: 210 40% 96.1%;
    --destructive: 0 84.2% 60.2%;
    /* Add custom colors */
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    /* Dark mode variants */
  }
}
```

## Common Shadcn Components to Add

### Forms & Inputs
```bash
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add date-picker
```

### Data Display
```bash
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
```

### Feedback
```bash
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add alert-dialog
```

### Overlay
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add sheet
```

### Navigation
```bash
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add menubar
npx shadcn-ui@latest add breadcrumb
npx shadcn-ui@latest add pagination
```

## Form Pattern with Shadcn

```typescript
// Example: Login form
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@aah/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@aah/ui/form";
import { Input } from "@aah/ui/input";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## Rebuild Workflow

After adding/modifying components:

```bash
# 1. Rebuild UI package
pnpm run build --filter @aah/ui

# 2. Type check
pnpm run type-check

# 3. Test in app
pnpm run dev:main

# 4. Verify import works
# In app file:
import { NewComponent } from '@aah/ui/new-component';
```

## Checklist

After adding Shadcn components:

- [ ] Component added to `packages/ui/src/components/ui/`
- [ ] Component exported from `packages/ui/src/index.ts`
- [ ] UI package rebuilt
- [ ] Component imports work in apps
- [ ] Type checking passes
- [ ] Component renders correctly
- [ ] Dark mode works (if applicable)
- [ ] Responsive on mobile
- [ ] Accessibility tested

Remember: All Shadcn components go in the `@aah/ui` package and are shared across all 3 apps!
