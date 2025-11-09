# Frontend UI Technical Specification

**Athletic Academics Hub (AAH) Platform**
**Version:** 1.0
**Last Updated:** 2025-11-08
**Status:** Living Document

---

## Table of Contents

1. [Architecture & Design Principles](#1-architecture--design-principles)
2. [Technology Stack](#2-technology-stack)
3. [Design System](#3-design-system)
4. [Component Library Organization](#4-component-library-organization)
5. [Page-Level Specifications](#5-page-level-specifications)
6. [AI Chat Widget Specification](#6-ai-chat-widget-specification)
7. [State Management Strategy](#7-state-management-strategy)
8. [Real-Time Features](#8-real-time-features)
9. [Mobile & Responsive Design](#9-mobile--responsive-design)
10. [Accessibility](#10-accessibility)
11. [Security & FERPA Compliance UI](#11-security--ferpa-compliance-ui)
12. [Performance Requirements](#12-performance-requirements)
13. [Testing Strategy](#13-testing-strategy)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Appendices](#15-appendices)

---

## 1. Architecture & Design Principles

### 1.1 Core Architecture

**Framework:** Next.js 14 with App Router (React Server Components)

**Key Architectural Patterns:**
- **Server Components First:** Default to RSC for data fetching and static content
- **Client Components:** Use `'use client'` directive only for interactivity (forms, real-time features, AI chat)
- **Multi-Zone Architecture:** Separate Next.js apps for different user zones:
  - `apps/main/` - Admin, Coach, Faculty zones
  - `apps/student/` - Student-Athlete zone (optimized for mobile)
- **API Gateway Pattern:** All microservice communication through Next.js API routes
- **Atomic Design:** Component hierarchy (atoms → molecules → organisms → templates → pages)

### 1.2 Design Principles

1. **Mobile-First Responsive Design**
   - Design for 375px viewport first, scale up to desktop
   - Student-athlete zone optimized for mobile use cases
   - Touch-friendly UI elements (minimum 44px tap targets)

2. **Progressive Enhancement**
   - Core functionality works without JavaScript
   - Enhanced features with client-side interactivity
   - Offline support with Service Workers (PWA)

3. **Accessibility First (WCAG 2.1 Level AA)**
   - Semantic HTML structure
   - ARIA labels for complex interactions
   - Keyboard navigation support
   - Screen reader compatibility

4. **Performance Budgets**
   - First Contentful Paint (FCP): < 1.5s
   - Largest Contentful Paint (LCP): < 2.5s
   - Time to Interactive (TTI): < 3.5s
   - Cumulative Layout Shift (CLS): < 0.1

5. **FERPA Compliance by Design**
   - No PII in URL parameters or localStorage
   - Client-side encryption for sensitive data in transit
   - Explicit user consent flows for data sharing
   - Audit trail for all data access

### 1.3 Routing Strategy

**Multi-Zone Routing:**
```
/admin/*          → apps/main (Admin Dashboard)
/coach/*          → apps/main (Coach Dashboard)
/faculty/*        → apps/main (Faculty Dashboard)
/student/*        → apps/student (Student-Athlete Dashboard)
/api/*            → apps/main (API Gateway)
```

**Route Protection:**
- Middleware-level authentication (Clerk)
- Role-based route guards (RBAC enforcement)
- Automatic redirects based on user role after sign-in

### 1.4 File Structure Convention

```
apps/
├── main/
│   ├── app/
│   │   ├── (auth)/           # Auth pages (sign-in, sign-up)
│   │   ├── admin/            # Admin zone pages
│   │   ├── coach/            # Coach zone pages
│   │   ├── faculty/          # Faculty zone pages
│   │   ├── api/              # API routes (gateway)
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── global-error.tsx  # Error boundary
│   │   └── not-found.tsx     # 404 page
│   ├── components/           # Zone-specific components
│   ├── lib/                  # Utilities and hooks
│   └── public/               # Static assets
│
└── student/
    ├── app/
    │   ├── dashboard/        # Student dashboard
    │   ├── schedule/         # Schedule & calendar
    │   ├── resources/        # Resources & support
    │   ├── layout.tsx        # Mobile-optimized layout
    │   └── error.tsx         # Error boundary
    ├── components/           # Mobile-first components
    └── lib/                  # Student-specific utilities
```

---

## 2. Technology Stack

### 2.1 Core Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | React framework with App Router |
| **React** | 18.x | UI library (Server & Client Components) |
| **TypeScript** | 5.x | Type-safe development |
| **Node.js** | 20.x LTS | Runtime environment |

### 2.2 UI & Styling

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Shadcn/UI** | Component library | Headless, accessible components |
| **Tailwind CSS** | Utility-first CSS | v3.4+ with custom design tokens |
| **Radix UI** | Primitive components | Headless UI components (via Shadcn) |
| **Lucide React** | Icon library | Consistent icon set |
| **clsx** | Class name utility | Conditional class merging |
| **tailwind-merge** | Class deduplication | Prevents Tailwind class conflicts |

### 2.3 State Management

| Technology | Use Case | Notes |
|------------|----------|-------|
| **TanStack Query** | Server state | Data fetching, caching, synchronization |
| **Zustand** | Client state | Lightweight global state (UI preferences) |
| **React Hook Form** | Form state | Performant form handling with validation |
| **Zod** | Schema validation | Runtime type validation for forms/API |

### 2.4 Real-Time & AI

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Vercel AI SDK** | AI streaming | `useChat` hook for chat interface |
| **Pusher** (or Supabase Realtime) | WebSockets | Real-time notifications, live updates |
| **EventSource (SSE)** | Server-sent events | Progress tracking, live analytics |

### 2.5 Data Visualization

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Recharts** | Charts & graphs | Responsive charts for analytics |
| **React Calendar** | Calendar UI | For schedule visualization |
| **React Big Calendar** | Full calendar view | Athletic schedule, academic calendar |

### 2.6 Authentication & Authorization

| Technology | Purpose | Notes |
|------------|---------|-------|
| **Clerk** | Authentication | SSO, MFA, user management |
| **@clerk/nextjs** | Next.js integration | Middleware, components, hooks |
| **Custom RBAC** | Authorization | Role-based access control via `@aah/auth` |

### 2.7 Developer Tools

| Technology | Purpose | Notes |
|------------|---------|-------|
| **ESLint** | Linting | Shared config via `@aah/config` |
| **Prettier** | Code formatting | Consistent code style |
| **Husky** | Git hooks | Pre-commit linting and type-checking |
| **TypeScript ESLint** | Type-aware linting | Enhanced TypeScript rules |

---

## 3. Design System

### 3.1 Design Tokens

**File:** `packages/ui/styles/tokens.css`

```css
:root {
  /* Colors - Brand */
  --brand-primary: #1e40af;      /* Blue 700 */
  --brand-secondary: #7c3aed;    /* Violet 600 */
  --brand-accent: #0891b2;       /* Cyan 600 */

  /* Colors - Semantic */
  --success: #16a34a;            /* Green 600 */
  --warning: #ea580c;            /* Orange 600 */
  --error: #dc2626;              /* Red 600 */
  --info: #0284c7;               /* Sky 600 */

  /* Colors - NCAA Status */
  --eligible: #16a34a;           /* Green 600 */
  --at-risk: #eab308;            /* Yellow 600 */
  --ineligible: #dc2626;         /* Red 600 */
  --pending-review: #6366f1;     /* Indigo 500 */

  /* Typography Scale */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', 'Courier New', monospace;

  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */

  /* Spacing Scale (4px base unit) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */

  /* Border Radius */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Z-index Scale */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-notification: 1080;
}

/* Dark Mode Overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --brand-primary: #60a5fa;      /* Blue 400 */
    --brand-secondary: #a78bfa;    /* Violet 400 */
    /* ... other dark mode colors ... */
  }
}
```

### 3.2 Typography System

**Font Loading:**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

**Text Styles:**
```typescript
// packages/ui/styles/typography.ts
export const textStyles = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-medium',
  h6: 'text-base font-medium',
  body: 'text-base',
  small: 'text-sm',
  xs: 'text-xs',
  caption: 'text-xs text-muted-foreground',
  label: 'text-sm font-medium',
  code: 'font-mono text-sm bg-muted px-1.5 py-0.5 rounded',
}
```

### 3.3 Color Palette

**Tailwind Config Extension:**
```javascript
// packages/config/tailwind/base.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
        status: {
          eligible: 'var(--eligible)',
          'at-risk': 'var(--at-risk)',
          ineligible: 'var(--ineligible)',
          'pending-review': 'var(--pending-review)',
        },
      },
    },
  },
}
```

### 3.4 Component Variants (Shadcn/UI)

**Button Variants:**
```typescript
// packages/ui/components/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-primary text-white hover:bg-brand-primary/90",
        destructive: "bg-error text-white hover:bg-error/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-brand-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

---

## 4. Component Library Organization

### 4.1 Atomic Design Structure

```
packages/ui/components/
├── atoms/                    # Basic building blocks
│   ├── button.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── badge.tsx
│   ├── avatar.tsx
│   ├── icon.tsx
│   └── spinner.tsx
│
├── molecules/                # Simple component combinations
│   ├── search-input.tsx
│   ├── select-field.tsx
│   ├── date-picker.tsx
│   ├── stat-card.tsx
│   ├── alert-banner.tsx
│   └── progress-indicator.tsx
│
├── organisms/                # Complex components
│   ├── data-table.tsx
│   ├── navigation-bar.tsx
│   ├── sidebar.tsx
│   ├── modal.tsx
│   ├── form-wizard.tsx
│   └── calendar-grid.tsx
│
├── templates/                # Page layouts
│   ├── dashboard-layout.tsx
│   ├── detail-page-layout.tsx
│   ├── list-page-layout.tsx
│   └── auth-layout.tsx
│
└── providers/                # Context providers
    ├── theme-provider.tsx
    ├── toast-provider.tsx
    └── modal-provider.tsx
```

### 4.2 Shared Component Library (`@aah/ui`)

**Core Components:**

1. **Data Display**
   - `DataTable` - Sortable, filterable, paginated tables (TanStack Table)
   - `Card` - Content containers with header, body, footer
   - `Badge` - Status indicators (eligible, at-risk, ineligible)
   - `Avatar` - User profile images with fallback
   - `StatCard` - Metric display cards with trend indicators

2. **Forms & Inputs**
   - `Input` - Text input with error states
   - `TextArea` - Multi-line text input
   - `Select` - Dropdown selection (native and custom)
   - `Checkbox` - Single checkbox with label
   - `RadioGroup` - Radio button group
   - `DatePicker` - Date selection with calendar popup
   - `TimePicker` - Time selection
   - `FileUpload` - File upload with drag-and-drop
   - `FormField` - Wrapper with label, input, error message

3. **Navigation**
   - `NavigationBar` - Top navigation with user menu
   - `Sidebar` - Side navigation with collapsible sections
   - `Breadcrumbs` - Hierarchical navigation trail
   - `Tabs` - Tabbed content switching
   - `Pagination` - Page navigation for lists

4. **Feedback**
   - `Alert` - Contextual alerts (success, warning, error, info)
   - `Toast` - Temporary notification popups
   - `Modal` - Dialog overlays
   - `ConfirmDialog` - Confirmation prompts
   - `Spinner` - Loading indicator
   - `ProgressBar` - Linear progress indicator
   - `Skeleton` - Loading placeholder

5. **Layout**
   - `Container` - Content width container
   - `Stack` - Vertical/horizontal spacing
   - `Grid` - Responsive grid layout
   - `Divider` - Visual separator

### 4.3 Domain-Specific Components

**NCAA Compliance Components** (`apps/main/components/compliance/`)
- `EligibilityCard` - Student eligibility status summary
- `GPAProgressBar` - GPA tracking with threshold indicators
- `CreditProgressRing` - Credit hours completion visual
- `ComplianceTimeline` - Historical eligibility status
- `ViolationAlert` - Compliance violation warnings

**Advising Components** (`apps/main/components/advising/`)
- `CourseCard` - Course details with prerequisites
- `ScheduleGrid` - Weekly schedule visualization
- `ConflictIndicator` - Scheduling conflict warnings
- `DegreeProgressTree` - Degree completion roadmap
- `RecommendationList` - AI-suggested courses

**Analytics Components** (`apps/main/components/analytics/`)
- `PerformanceChart` - Student performance trends (Recharts)
- `RiskGauge` - Risk score visualization
- `ComparisonChart` - Cohort comparison
- `InterventionTimeline` - Support intervention history

**AI Chat Components** (`apps/main/components/ai/`)
- `ChatWidget` - Full AI chat interface (detailed in Section 6)
- `MessageBubble` - Individual chat message
- `ToolExecutionCard` - Tool use visualization
- `ThinkingIndicator` - AI processing animation
- `CitationPopover` - Source citation display

### 4.4 Component API Design Pattern

**Standard Props Interface:**
```typescript
// Base component props
interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

// Example: Button component
interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  asChild?: boolean  // Composition via Radix Slot
}

// Usage with composition
<Button variant="outline" size="lg" asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

### 4.5 Component Documentation

**Storybook Integration:**
```typescript
// packages/ui/components/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: 'Click me',
    variant: 'default',
  },
}

export const Loading: Story = {
  args: {
    children: 'Submitting...',
    loading: true,
  },
}
```

---

## 5. Page-Level Specifications

### 5.1 Student-Athlete Zone (`apps/student/`)

#### 5.1.1 Dashboard (`/student/dashboard`)

**Purpose:** Central hub for student-athletes to access key information and tasks.

**Layout:**
```
┌─────────────────────────────────────────┐
│ [Logo]  Welcome, [Name]  [Avatar] [≡]  │ <- Header
├─────────────────────────────────────────┤
│ 📊 Academic Overview Card               │
│  ├── Current GPA: 3.45 / 4.0            │
│  ├── Credits Earned: 64 / 120           │
│  └── Progress: 53% toward degree        │
├─────────────────────────────────────────┤
│ ✅ Eligibility Status                   │
│  [●] Eligible for Competition           │
│  Next check: Aug 15, 2025               │
├─────────────────────────────────────────┤
│ 📅 This Week's Schedule                 │
│  ├── Mon 9:00 AM - MATH 201 (Exam)      │
│  ├── Wed 3:00 PM - Team Practice        │
│  └── Fri 10:00 AM - Tutoring Session    │
├─────────────────────────────────────────┤
│ 🤖 AI Assistant                         │
│  [Chat widget - minimized state]        │
├─────────────────────────────────────────┤
│ 📢 Recent Notifications (3)             │
│  ├── [!] Upcoming compliance check      │
│  └── [i] New study hall session posted  │
└─────────────────────────────────────────┘
```

**Components:**
- `StudentHeader` - Mobile-optimized header with hamburger menu
- `AcademicOverviewCard` - GPA, credits, progress metrics
- `EligibilityStatusCard` - NCAA eligibility status badge
- `WeekScheduleList` - Condensed weekly view
- `ChatWidget` - AI assistant (floating action button)
- `NotificationList` - Recent alerts and updates

**Data Sources:**
- `GET /api/user/profile` - User profile and academic data
- `GET /api/compliance/status` - Current eligibility status
- `GET /api/advising/schedule` - Weekly schedule
- `GET /api/monitoring/notifications` - Recent notifications

**Mobile-First Optimizations:**
- Bottom tab navigation for main sections
- Swipeable cards for quick navigation
- Pull-to-refresh for real-time updates
- Offline support for viewing cached schedule

#### 5.1.2 Schedule & Calendar (`/student/schedule`)

**Purpose:** View and manage academic, athletic, and support schedules.

**Features:**
- Weekly/monthly calendar views
- Color-coded event types (class, practice, tutoring, study hall)
- Conflict indicators
- Travel schedule integration
- Add to device calendar (iCal export)

**Components:**
- `CalendarView` - Full calendar with event popups
- `EventCard` - Event details with join links
- `ConflictBanner` - Scheduling conflict alerts
- `TravelSchedule` - Upcoming travel itinerary

**Data Sources:**
- `GET /api/advising/schedule` - Academic schedule
- `GET /api/integration/calendar` - Athletic calendar
- `GET /api/support/sessions` - Support sessions

#### 5.1.3 Resources & Support (`/student/resources`)

**Purpose:** Access tutoring, study halls, workshops, and academic resources.

**Features:**
- Browse available tutoring sessions
- Book study hall reservations
- Register for workshops
- Access learning resources (documents, videos)
- View mentoring relationship

**Components:**
- `ServiceCard` - Tutoring/study hall card with booking
- `WorkshopList` - Upcoming workshops with registration
- `ResourceLibrary` - Searchable resource collection
- `MentorCard` - Assigned mentor contact info

**Data Sources:**
- `GET /api/support/tutoring` - Available tutoring
- `GET /api/support/studyHall` - Study hall availability
- `GET /api/support/workshops` - Workshop listings
- `GET /api/support/mentoring` - Mentoring assignments

#### 5.1.4 AI Academic Assistant (`/student/chat`)

**Purpose:** Full-screen AI chat interface for academic support.

**Features:**
- Conversational AI chat with streaming responses
- Tool execution visualization (course search, compliance checks)
- Source citations for NCAA policy questions
- Conversation history
- Export conversation (PDF/email)

**Components:**
- `ChatInterface` - Full chat UI (see Section 6)
- `ConversationHistory` - Past conversations list
- `ExportDialog` - Export conversation options

**Data Sources:**
- `POST /api/ai/chat` - AI chat streaming endpoint
- `GET /api/ai/conversations` - Conversation history

---

### 5.2 Admin Zone (`apps/main/admin/`)

#### 5.2.1 Admin Dashboard (`/admin/dashboard`)

**Purpose:** High-level overview of system metrics and alerts.

**Layout:**
```
┌──────────────────────────────────────────────┐
│ [Logo] Admin Dashboard [Search] [🔔][Avatar] │
├────────────┬─────────────────────────────────┤
│            │ 📊 Key Metrics                  │
│            │ ┌────┬────┬────┬────┐           │
│ Sidebar    │ │564 │ 12 │94% │ 8  │           │
│            │ │STU │ALT │ELG │ACT │           │
│            │ └────┴────┴────┴────┘           │
│ - Dashboard│                                 │
│ - Students │ 📈 Eligibility Trends           │
│ - Alerts   │ [Line chart - past 6 months]    │
│ - Evals    │                                 │
│ - Reports  │ 🚨 Active Alerts (12)           │
│ - Settings │ ├── [!] 3 students at risk      │
│            │ ├── [!] 5 missing documents     │
│            │ └── [!] 4 compliance reviews    │
│            │                                 │
│            │ 🎯 Recent AI Eval Results       │
│            │ [Metrics table with pass rates]  │
└────────────┴─────────────────────────────────┘
```

**Components:**
- `AdminSidebar` - Navigation with role-based menu items
- `MetricCard` - KPI display with trend indicators
- `TrendChart` - Time-series visualization (Recharts)
- `AlertList` - Prioritized alert queue
- `EvalResultsTable` - Recent AI eval summary

**Data Sources:**
- `GET /api/monitoring/analytics/summary` - System metrics
- `GET /api/monitoring/alerts` - Active alerts
- `GET /api/ai-evals/recent-runs` - AI eval results

#### 5.2.2 Student Management (`/admin/students`)

**Purpose:** Browse and manage student-athlete profiles.

**Features:**
- Searchable/filterable student list
- Bulk actions (export, send notifications)
- Quick status overview (eligibility, GPA, credits)
- Deep link to individual student detail page

**Components:**
- `StudentDataTable` - Sortable table with search/filters
- `FilterPanel` - Advanced filters (sport, year, status)
- `BulkActionBar` - Batch operations
- `StudentQuickView` - Hover preview of student data

**Data Sources:**
- `GET /api/user/students` - Student list with pagination
- `GET /api/compliance/bulk-status` - Eligibility status for all students

#### 5.2.3 Student Detail Page (`/admin/students/[id]`)

**Purpose:** Comprehensive view of individual student-athlete.

**Sections:**
- **Profile Tab:** Personal info, academic standing, contact
- **Academics Tab:** Courses, grades, degree progress
- **Compliance Tab:** Eligibility history, violations, documents
- **Performance Tab:** GPA trends, risk scores, interventions
- **Schedule Tab:** Full calendar view
- **Support Tab:** Tutoring history, study hall attendance

**Components:**
- `ProfileHeader` - Student name, photo, quick stats
- `TabNavigation` - Multi-tab interface
- `AcademicTimeline` - Semester-by-semester transcript
- `ComplianceChecklist` - Eligibility requirement checklist
- `RiskScoreTrend` - Historical risk score chart
- `InterventionLog` - Support intervention timeline

**Data Sources:**
- `GET /api/user/students/[id]` - Full student profile
- `GET /api/compliance/eligibility/[id]` - Eligibility details
- `GET /api/monitoring/risk/[id]` - Risk assessment data
- `GET /api/monitoring/interventions/[id]` - Intervention history

#### 5.2.4 Alert Management (`/admin/alerts`)

**Purpose:** Monitor and respond to system alerts.

**Features:**
- Real-time alert feed (via WebSocket)
- Priority-based sorting (critical, warning, info)
- Bulk acknowledge/dismiss actions
- Alert detail view with recommended actions
- Alert routing to responsible staff

**Components:**
- `AlertFeed` - Real-time alert stream
- `AlertCard` - Alert with severity badge and actions
- `AlertDetailModal` - Full alert context and history
- `ActionRecommendations` - AI-suggested interventions

**Data Sources:**
- `GET /api/monitoring/alerts` - Alert list (with SSE for updates)
- `POST /api/monitoring/alerts/acknowledge` - Acknowledge alerts
- `GET /api/monitoring/alerts/[id]` - Alert detail

#### 5.2.5 AI Evaluation Dashboard (`/admin/evals`)

**Purpose:** Monitor AI system performance and detect regressions.

**Features:**
- Recent eval run summaries
- Trend charts (accuracy, cost, latency over time)
- Regression alerts
- Drill-down into individual test cases
- Model comparison view

**Components:**
- `EvalRunsTable` - List of eval runs with metrics
- `AccuracyTrendChart` - Accuracy over time
- `CostTracker` - Token usage and cost trends
- `RegressionAlerts` - Active regression warnings
- `ModelComparisonGrid` - Side-by-side model metrics

**Data Sources:**
- `GET /api/ai-evals/runs` - Eval runs list
- `GET /api/ai-evals/runs/[id]` - Run details
- `GET /api/ai-evals/metrics` - Aggregated metrics

---

### 5.3 Coach Zone (`apps/main/coach/`)

#### 5.3.1 Coach Dashboard (`/coach/dashboard`)

**Purpose:** Overview of team academic performance and alerts.

**Features:**
- Team eligibility summary
- At-risk student alerts
- Upcoming compliance deadlines
- Team GPA trends
- Travel schedule

**Components:**
- `TeamRoster` - Roster with eligibility indicators
- `AtRiskAlerts` - Students requiring attention
- `TeamGPAChart` - Team GPA over time
- `UpcomingDeadlines` - Compliance calendar

**Data Sources:**
- `GET /api/user/team-roster` - Coach's team roster
- `GET /api/compliance/team-status` - Team eligibility
- `GET /api/monitoring/at-risk` - At-risk students

#### 5.3.2 Team Management (`/coach/team`)

**Purpose:** Manage team roster and view individual student progress.

**Features:**
- Searchable team roster
- Quick status indicators (eligible, at-risk, ineligible)
- Deep link to student detail view (admin-level access)
- Team-level analytics

**Components:**
- `TeamDataTable` - Roster with filters
- `StudentCard` - Individual student summary
- `TeamAnalytics` - Aggregate team metrics

**Data Sources:**
- `GET /api/user/team-roster` - Team roster
- `GET /api/monitoring/analytics/team/[teamId]` - Team analytics

---

### 5.4 Faculty Zone (`apps/main/faculty/`)

#### 5.4.1 Faculty Dashboard (`/faculty/dashboard`)

**Purpose:** View enrolled student-athletes and their academic performance.

**Features:**
- List of student-athletes in faculty's courses
- Absence notifications
- Grade submission reminders
- Student progress overview

**Components:**
- `CourseRoster` - Students in faculty's courses
- `AbsenceAlerts` - Upcoming absences (travel)
- `GradeSubmission` - Quick grade entry
- `StudentProgressCard` - Individual student academic standing

**Data Sources:**
- `GET /api/user/course-roster` - Enrolled student-athletes
- `GET /api/integration/absence` - Absence notifications
- `GET /api/monitoring/student-progress` - Student performance

#### 5.4.2 Absence Management (`/faculty/absences`)

**Purpose:** View and approve/deny absence requests for athletic travel.

**Features:**
- Upcoming travel schedule for enrolled students
- Approve/deny absence requests
- View travel letters
- Track absence impact on academic standing

**Components:**
- `AbsenceRequestCard` - Request with approve/deny actions
- `TravelLetterViewer` - Official travel documentation
- `AbsenceImpactAnalysis` - Projected grade impact

**Data Sources:**
- `GET /api/integration/absence` - Absence requests
- `GET /api/integration/travel-letter/[id]` - Travel letter
- `POST /api/integration/absence/approve` - Approve absence

---

## 6. AI Chat Widget Specification

### 6.1 Architecture

**Component Structure:**
```
ChatWidget (Client Component)
├── ChatHeader
│   ├── MinimizeButton
│   └── MenuButton (Export, Clear)
├── MessageList (Server Component wrapper)
│   ├── MessageBubble (User)
│   ├── MessageBubble (Assistant)
│   │   ├── ThinkingIndicator
│   │   ├── ToolExecutionCard
│   │   └── CitationFooter
│   └── StreamingMessage (Assistant - in progress)
├── InputArea (Client Component)
│   ├── TextArea (auto-resize)
│   ├── SendButton
│   └── StopButton (streaming)
└── SuggestedPrompts (empty state)
```

### 6.2 States

1. **Minimized State** (Floating Action Button)
   - Position: Fixed bottom-right (mobile: bottom-center)
   - Badge: Unread message count
   - Icon: Sparkle (✨) or chat bubble

2. **Expanded State** (Chat Interface)
   - Desktop: 400px wide × 600px tall (bottom-right)
   - Mobile: Full screen overlay
   - Resizable on desktop

3. **Full-Screen Mode** (`/student/chat` route)
   - Full page chat interface
   - Conversation history sidebar
   - Export and share options

### 6.3 Message Types

#### 6.3.1 User Message
```typescript
interface UserMessage {
  role: 'user'
  content: string
  timestamp: Date
}
```

**UI:**
```
┌────────────────────────────┐
│         [User Avatar] │ Me │
│ ┌──────────────────────────┤
│ │ Can I take MATH 301 next │
│ │ semester if I'm currently│
│ │ in MATH 201?              │
│ └──────────────────────────┤
│            10:32 AM         │
└────────────────────────────┘
```

#### 6.3.2 Assistant Message (Text)
```typescript
interface AssistantMessage {
  role: 'assistant'
  content: string
  timestamp: Date
  citations?: Citation[]
}
```

**UI:**
```
┌────────────────────────────┐
│ [AI Avatar] │ AI Assistant │
├────────────────────────────┤
│ Yes! MATH 301 has MATH 201 │
│ as a prerequisite, so you  │
│ can enroll once you pass   │
│ your current course.       │
│ [i] Source: Course Catalog │
├────────────────────────────┤
│            10:32 AM         │
└────────────────────────────┘
```

#### 6.3.3 Assistant Message (Tool Execution)
```typescript
interface ToolExecution {
  toolName: string
  toolInput: Record<string, any>
  toolOutput: any
  status: 'running' | 'success' | 'error'
}
```

**UI (Running):**
```
┌────────────────────────────┐
│ [AI Avatar] │ AI Assistant │
├────────────────────────────┤
│ 🔧 Searching courses...    │
│ [Spinner animation]        │
└────────────────────────────┘
```

**UI (Success):**
```
┌────────────────────────────┐
│ [AI Avatar] │ AI Assistant │
├────────────────────────────┤
│ ✅ Course Search Results   │
│ ┌──────────────────────────┤
│ │ MATH 301 - Calculus III  │
│ │ Credits: 4               │
│ │ Prerequisites: MATH 201  │
│ │ Next offering: Fall 2025 │
│ └──────────────────────────┤
└────────────────────────────┘
```

#### 6.3.4 Streaming Message
```typescript
interface StreamingMessage {
  role: 'assistant'
  content: string  // partial content
  isStreaming: true
}
```

**UI:**
```
┌────────────────────────────┐
│ [AI Avatar] │ AI Assistant │
├────────────────────────────┤
│ Based on your current GPA  │
│ and credits, you're on tra▋│
│ [Typing cursor]            │
└────────────────────────────┘
```

### 6.4 Implementation with Vercel AI SDK

**Chat Hook:**
```typescript
// apps/student/components/ChatWidget.tsx
'use client'

import { useChat } from 'ai/react'
import { MessageBubble } from './MessageBubble'
import { InputArea } from './InputArea'

export function ChatWidget() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
  } = useChat({
    api: '/api/ai/chat',
    initialMessages: [],
    onError: (error) => {
      toast.error('Chat error: ' + error.message)
    },
  })

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <InputArea
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
      />
    </div>
  )
}
```

**Streaming API Route:**
```typescript
// apps/main/app/api/ai/chat/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    system: 'You are an NCAA Division I academic assistant...',
    tools: {
      searchCourses: {
        description: 'Search for courses in the catalog',
        parameters: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => {
          // Call advising service
          const courses = await fetch('/api/advising/courses/search', {
            method: 'POST',
            body: JSON.stringify({ query }),
          })
          return courses.json()
        },
      },
      checkEligibility: {
        description: 'Check NCAA eligibility status',
        parameters: z.object({
          studentId: z.string(),
        }),
        execute: async ({ studentId }) => {
          // Call compliance service
          const status = await fetch(`/api/compliance/status/${studentId}`)
          return status.json()
        },
      },
    },
  })

  return result.toAIStreamResponse()
}
```

### 6.5 Tool Execution Visualization

**Component:**
```typescript
// components/ai/ToolExecutionCard.tsx
interface ToolExecutionCardProps {
  toolName: string
  toolInput: Record<string, any>
  toolOutput: any
  status: 'running' | 'success' | 'error'
}

export function ToolExecutionCard({
  toolName,
  toolInput,
  toolOutput,
  status,
}: ToolExecutionCardProps) {
  const toolConfig = {
    searchCourses: {
      icon: MagnifyingGlassIcon,
      label: 'Searching Courses',
      color: 'text-blue-600',
    },
    checkEligibility: {
      icon: CheckCircleIcon,
      label: 'Checking Eligibility',
      color: 'text-green-600',
    },
    // ... other tools
  }

  const config = toolConfig[toolName] || {
    icon: WrenchIcon,
    label: toolName,
    color: 'text-gray-600',
  }

  return (
    <Card className="my-2">
      <CardHeader className="flex flex-row items-center gap-2 py-3">
        <config.icon className={`h-4 w-4 ${config.color}`} />
        <span className="text-sm font-medium">{config.label}</span>
        {status === 'running' && <Spinner className="ml-auto h-4 w-4" />}
        {status === 'success' && <CheckIcon className="ml-auto h-4 w-4 text-green-600" />}
        {status === 'error' && <XIcon className="ml-auto h-4 w-4 text-red-600" />}
      </CardHeader>
      {status === 'success' && (
        <CardContent className="pt-0">
          {renderToolOutput(toolName, toolOutput)}
        </CardContent>
      )}
    </Card>
  )
}
```

### 6.6 Citation Display

**Component:**
```typescript
// components/ai/CitationFooter.tsx
interface Citation {
  source: string
  url?: string
  snippet?: string
}

export function CitationFooter({ citations }: { citations: Citation[] }) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          {citations.length} {citations.length === 1 ? 'source' : 'sources'}
        </summary>
        <ul className="mt-2 space-y-1 ml-4 list-disc">
          {citations.map((citation, i) => (
            <li key={i}>
              {citation.url ? (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-brand-primary"
                >
                  {citation.source}
                </a>
              ) : (
                <span>{citation.source}</span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
```

### 6.7 Accessibility Features

- **Keyboard Navigation:**
  - `Ctrl/Cmd + K` - Focus chat input
  - `Esc` - Minimize chat widget
  - `Enter` - Send message
  - `Shift + Enter` - New line

- **Screen Reader Support:**
  - ARIA live region for streaming messages
  - Alt text for all icons and avatars
  - Semantic HTML (section, article, etc.)

- **Focus Management:**
  - Trap focus within modal when expanded
  - Restore focus to trigger button on close
  - Clear focus indicators for keyboard users

### 6.8 Performance Optimizations

- **Virtualized Message List:** Use `react-virtual` for long conversations (>100 messages)
- **Debounced Input:** Prevent excessive API calls during typing
- **Optimistic UI:** Show user message immediately before API response
- **Streaming Chunks:** Process and render streaming chunks in batches (100ms intervals)
- **Message Caching:** Cache conversation history in IndexedDB for offline viewing

---

## 7. State Management Strategy

### 7.1 Server State (TanStack Query)

**Query Client Setup:**
```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Query Hooks Pattern:**
```typescript
// lib/hooks/useStudentProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Query key factory
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: string) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
}

// Fetch function
async function fetchStudentProfile(id: string) {
  const res = await fetch(`/api/user/students/${id}`)
  if (!res.ok) throw new Error('Failed to fetch student profile')
  return res.json()
}

// Query hook
export function useStudentProfile(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => fetchStudentProfile(id),
    enabled: !!id, // Only run if id exists
  })
}

// Mutation hook
export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/user/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update student')
      return res.json()
    },
    onSuccess: (_, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    },
  })
}
```

**Usage in Component:**
```typescript
// components/StudentProfile.tsx
'use client'

import { useStudentProfile, useUpdateStudent } from '@/lib/hooks/useStudentProfile'

export function StudentProfile({ id }: { id: string }) {
  const { data: student, isLoading, error } = useStudentProfile(id)
  const updateStudent = useUpdateStudent()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorAlert error={error} />

  const handleUpdate = async (data: any) => {
    await updateStudent.mutateAsync({ id, data })
    toast.success('Profile updated')
  }

  return (
    <div>
      <h1>{student.name}</h1>
      {/* ... rest of component ... */}
    </div>
  )
}
```

### 7.2 Client State (Zustand)

**Store for UI Preferences:**
```typescript
// lib/stores/uiStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  chatWidgetOpen: boolean
  openChatWidget: () => void
  closeChatWidget: () => void

  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  tablePageSize: number
  setTablePageSize: (size: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      chatWidgetOpen: false,
      openChatWidget: () => set({ chatWidgetOpen: true }),
      closeChatWidget: () => set({ chatWidgetOpen: false }),

      theme: 'system',
      setTheme: (theme) => set({ theme }),

      tablePageSize: 20,
      setTablePageSize: (size) => set({ tablePageSize: size }),
    }),
    {
      name: 'aah-ui-preferences',
    }
  )
)
```

**Usage:**
```typescript
// components/Sidebar.tsx
'use client'

import { useUIStore } from '@/lib/stores/uiStore'

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside className={sidebarCollapsed ? 'w-16' : 'w-64'}>
      <button onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>
      {/* ... sidebar content ... */}
    </aside>
  )
}
```

### 7.3 Form State (React Hook Form + Zod)

**Form Schema:**
```typescript
// lib/schemas/studentSchema.ts
import { z } from 'zod'

export const updateStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  sport: z.enum(['football', 'basketball', 'soccer', 'other']),
  expectedGraduation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
```

**Form Component:**
```typescript
// components/forms/UpdateStudentForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateStudentSchema, type UpdateStudentInput } from '@/lib/schemas/studentSchema'
import { useUpdateStudent } from '@/lib/hooks/useStudentProfile'

export function UpdateStudentForm({ student }: { student: any }) {
  const updateStudent = useUpdateStudent()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      sport: student.sport,
      expectedGraduation: student.expectedGraduation,
    },
  })

  const onSubmit = async (data: UpdateStudentInput) => {
    await updateStudent.mutateAsync({ id: student.id, data })
    toast.success('Student updated successfully')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="First Name" error={errors.firstName?.message}>
        <Input {...register('firstName')} />
      </FormField>

      <FormField label="Last Name" error={errors.lastName?.message}>
        <Input {...register('lastName')} />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" {...register('email')} />
      </FormField>

      <FormField label="Sport" error={errors.sport?.message}>
        <Select {...register('sport')}>
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
          <option value="soccer">Soccer</option>
          <option value="other">Other</option>
        </Select>
      </FormField>

      <Button type="submit" loading={isSubmitting}>
        Save Changes
      </Button>
    </form>
  )
}
```

### 7.4 Real-Time State (WebSocket/SSE)

**WebSocket Provider (Pusher):**
```typescript
// lib/providers/PusherProvider.tsx
'use client'

import Pusher from 'pusher-js'
import { createContext, useContext, useEffect, useState } from 'react'

const PusherContext = createContext<Pusher | null>(null)

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const [pusher, setPusher] = useState<Pusher | null>(null)

  useEffect(() => {
    const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    })

    setPusher(pusherInstance)

    return () => {
      pusherInstance.disconnect()
    }
  }, [])

  return <PusherContext.Provider value={pusher}>{children}</PusherContext.Provider>
}

export function usePusher() {
  const context = useContext(PusherContext)
  if (!context) throw new Error('usePusher must be used within PusherProvider')
  return context
}
```

**Real-Time Hook:**
```typescript
// lib/hooks/useRealtimeAlerts.ts
import { useEffect } from 'react'
import { usePusher } from '@/lib/providers/PusherProvider'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useRealtimeAlerts(userId: string) {
  const pusher = usePusher()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!pusher) return

    const channel = pusher.subscribe(`user-${userId}`)

    channel.bind('new-alert', (data: any) => {
      // Show toast notification
      toast.warning(data.message, {
        action: {
          label: 'View',
          onClick: () => window.location.href = `/admin/alerts/${data.id}`,
        },
      })

      // Invalidate alerts query to refetch
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`user-${userId}`)
    }
  }, [pusher, userId, queryClient])
}
```

**Usage:**
```typescript
// app/admin/layout.tsx
'use client'

import { useUser } from '@clerk/nextjs'
import { useRealtimeAlerts } from '@/lib/hooks/useRealtimeAlerts'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser()

  // Subscribe to real-time alerts
  useRealtimeAlerts(user?.id || '')

  return <div>{children}</div>
}
```

---

## 8. Real-Time Features

### 8.1 Real-Time Alert Notifications

**Technology:** Pusher (WebSocket) or Supabase Realtime

**Use Cases:**
- New eligibility alerts
- Compliance violations
- At-risk student flags
- System notifications

**Implementation:**
```typescript
// API route that triggers notification
// app/api/monitoring/alerts/route.ts
import { db } from '@aah/database'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
})

export async function POST(req: Request) {
  const { studentId, alertType, message } = await req.json()

  // Create alert in database
  const alert = await db.alert.create({
    data: { studentId, alertType, message },
  })

  // Trigger real-time notification
  await pusher.trigger(`user-${studentId}`, 'new-alert', {
    id: alert.id,
    message: alert.message,
    type: alert.alertType,
  })

  return Response.json(alert)
}
```

### 8.2 Live Analytics Dashboard

**Technology:** Server-Sent Events (SSE)

**Use Cases:**
- Real-time metric updates (GPA, eligibility %)
- Live eval run progress
- System health monitoring

**Implementation:**
```typescript
// app/api/monitoring/analytics/stream/route.ts
export const runtime = 'edge'

export async function GET(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send updates every 5 seconds
      const interval = setInterval(async () => {
        const metrics = await fetchLatestMetrics()

        const data = `data: ${JSON.stringify(metrics)}\n\n`
        controller.enqueue(encoder.encode(data))
      }, 5000)

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

**Client-side consumption:**
```typescript
// components/LiveMetrics.tsx
'use client'

import { useEffect, useState } from 'react'

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    const eventSource = new EventSource('/api/monitoring/analytics/stream')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMetrics(data)
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [])

  if (!metrics) return <Skeleton />

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard label="Total Students" value={metrics.totalStudents} />
      <MetricCard label="Eligible" value={metrics.eligible} trend={metrics.eligibleTrend} />
      {/* ... more metrics ... */}
    </div>
  )
}
```

### 8.3 Collaborative Features

**Technology:** Yjs (CRDT) + Pusher (optional)

**Use Cases:**
- Shared note-taking during advising sessions
- Collaborative intervention planning
- Real-time commenting on student records

**Implementation:** (Future phase - not in MVP)

---

## 9. Mobile & Responsive Design

### 9.1 Breakpoints

**Tailwind Breakpoints:**
```javascript
// packages/config/tailwind/base.js
module.exports = {
  theme: {
    screens: {
      'xs': '375px',   // Mobile (small)
      'sm': '640px',   // Mobile (large)
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Desktop (large)
      '2xl': '1536px', // Desktop (xlarge)
    },
  },
}
```

**Usage Pattern:**
```typescript
// Mobile-first approach (default styles for mobile)
<div className="
  flex flex-col gap-4      /* Mobile: vertical stack */
  md:flex-row md:gap-6     /* Tablet: horizontal layout */
  lg:gap-8                 /* Desktop: larger gaps */
">
  {/* Content */}
</div>
```

### 9.2 Mobile-Specific Features

#### 9.2.1 Touch Gestures

**Swipe Navigation:**
```typescript
// lib/hooks/useSwipeGesture.ts
import { useEffect, useRef } from 'react'

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX
      handleSwipe()
    }

    const handleSwipe = () => {
      const distance = touchStartX.current - touchEndX.current

      if (distance > threshold && onSwipeLeft) {
        onSwipeLeft()
      }

      if (distance < -threshold && onSwipeRight) {
        onSwipeRight()
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, threshold])
}
```

**Usage:**
```typescript
// components/SwipeableCard.tsx
export function SwipeableCard() {
  useSwipeGesture(
    () => console.log('Swiped left'),
    () => console.log('Swiped right')
  )

  return <div>{/* Card content */}</div>
}
```

#### 9.2.2 Pull-to-Refresh

```typescript
// lib/hooks/usePullToRefresh.ts
import { useEffect, useState, useRef } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef<number>(0)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        const currentY = e.touches[0].clientY
        const distance = currentY - startY.current

        if (distance > 80) {
          setIsPulling(true)
        }
      }
    }

    const handleTouchEnd = async () => {
      if (isPulling) {
        await onRefresh()
        setIsPulling(false)
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, onRefresh])

  return { isPulling }
}
```

### 9.3 Progressive Web App (PWA)

**Manifest:**
```json
// public/manifest.json
{
  "name": "Athletic Academics Hub",
  "short_name": "AAH",
  "description": "NCAA Division I academic support platform",
  "start_url": "/student/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker (Next.js):**
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // ... other Next.js config
})
```

**Offline Support:**
```typescript
// app/layout.tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#1e40af',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AAH',
  },
}
```

### 9.4 Responsive Tables

**Mobile-Optimized Table:**
```typescript
// components/ResponsiveTable.tsx
export function ResponsiveTable({ data, columns }) {
  return (
    <>
      {/* Desktop: Traditional table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card list */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <Card key={row.id}>
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between py-2">
                <span className="font-medium text-sm">{col.label}:</span>
                <span className="text-sm">{row[col.key]}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </>
  )
}
```

### 9.5 Mobile Navigation Pattern

**Bottom Tab Navigation (Student Zone):**
```typescript
// apps/student/components/BottomNav.tsx
export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/student/dashboard', icon: HomeIcon, label: 'Home' },
    { href: '/student/schedule', icon: CalendarIcon, label: 'Schedule' },
    { href: '/student/resources', icon: BookOpenIcon, label: 'Resources' },
    { href: '/student/chat', icon: SparklesIcon, label: 'AI' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <ul className="flex justify-around">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex flex-col items-center py-2 px-3',
                pathname === item.href ? 'text-brand-primary' : 'text-gray-500'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

---

## 10. Accessibility

### 10.1 WCAG 2.1 Level AA Compliance

**Checklist:**
- [ ] All interactive elements have focus indicators
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text and UI components
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] ARIA landmarks are used (navigation, main, complementary)
- [ ] Tables have proper headers and captions
- [ ] Keyboard navigation works for all interactive elements

### 10.2 Semantic HTML

**Example:**
```tsx
// Good: Semantic structure
<article>
  <header>
    <h1>Student Profile</h1>
    <p className="text-muted-foreground">Last updated: {date}</p>
  </header>

  <section aria-labelledby="academic-section">
    <h2 id="academic-section">Academic Information</h2>
    {/* Academic content */}
  </section>

  <section aria-labelledby="eligibility-section">
    <h2 id="eligibility-section">Eligibility Status</h2>
    {/* Eligibility content */}
  </section>

  <footer>
    <Button>Edit Profile</Button>
  </footer>
</article>

// Bad: Div soup
<div>
  <div>
    <div>Student Profile</div>
    <div>Last updated: {date}</div>
  </div>
  <div>
    <div>Academic Information</div>
    {/* Content */}
  </div>
</div>
```

### 10.3 ARIA Labels

**Form Example:**
```tsx
<form aria-label="Update student profile">
  <div>
    <label htmlFor="first-name">First Name</label>
    <input
      id="first-name"
      type="text"
      aria-required="true"
      aria-invalid={!!errors.firstName}
      aria-describedby={errors.firstName ? 'first-name-error' : undefined}
    />
    {errors.firstName && (
      <span id="first-name-error" role="alert" className="text-error">
        {errors.firstName.message}
      </span>
    )}
  </div>
</form>
```

**Button with Loading State:**
```tsx
<button
  type="submit"
  disabled={isSubmitting}
  aria-busy={isSubmitting}
  aria-label={isSubmitting ? 'Submitting...' : 'Submit form'}
>
  {isSubmitting ? <Spinner aria-hidden="true" /> : 'Submit'}
</button>
```

### 10.4 Keyboard Navigation

**Modal Focus Trap:**
```typescript
// lib/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react'

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus first element
    firstElement?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTab)
    return () => container.removeEventListener('keydown', handleTab)
  }, [isActive])

  return containerRef
}
```

**Usage in Modal:**
```tsx
function Modal({ isOpen, onClose, children }) {
  const containerRef = useFocusTrap(isOpen)

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### 10.5 Screen Reader Announcements

**Live Region for Chat:**
```tsx
// components/ai/ChatWidget.tsx
export function ChatWidget() {
  const { messages, isLoading } = useChat()

  return (
    <div>
      {/* Screen reader live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading && 'AI is typing...'}
        {messages[messages.length - 1]?.role === 'assistant' &&
          `AI responded: ${messages[messages.length - 1]?.content}`
        }
      </div>

      {/* Visible chat interface */}
      <MessageList messages={messages} />
    </div>
  )
}
```

### 10.6 Color & Contrast

**Accessibility Utilities:**
```typescript
// lib/utils/a11y.ts
export function checkContrast(foreground: string, background: string): boolean {
  // Calculate WCAG contrast ratio
  // Return true if ratio >= 4.5:1
  // Implementation using color contrast libraries
}

export function getAccessibleColor(color: string, background: string): string {
  if (checkContrast(color, background)) {
    return color
  }
  // Return adjusted color that meets contrast requirements
}
```

---

## 11. Security & FERPA Compliance UI

### 11.1 Data Privacy Patterns

#### 11.1.1 No PII in URLs

**Bad:**
```
/admin/students/123?name=John+Doe&gpa=3.45
```

**Good:**
```
/admin/students/123
```

**Implementation:**
```typescript
// Always use opaque IDs in routes
// Fetch sensitive data server-side only
// app/admin/students/[id]/page.tsx
export default async function StudentPage({ params }: { params: { id: string } }) {
  const student = await fetchStudent(params.id) // Server-side only
  return <StudentProfile student={student} />
}
```

#### 11.1.2 Client-Side Data Encryption

**Encrypt before localStorage:**
```typescript
// lib/utils/secureStorage.ts
import { encrypt, decrypt } from '@/lib/crypto'

export const secureStorage = {
  setItem(key: string, value: any) {
    const encrypted = encrypt(JSON.stringify(value))
    localStorage.setItem(key, encrypted)
  },

  getItem(key: string) {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null

    const decrypted = decrypt(encrypted)
    return JSON.parse(decrypted)
  },

  removeItem(key: string) {
    localStorage.removeItem(key)
  },
}
```

#### 11.1.3 Redaction for Sensitive Fields

**Component:**
```typescript
// components/RedactedField.tsx
export function RedactedField({ value, canView }: { value: string; canView: boolean }) {
  if (!canView) {
    return <span className="text-muted-foreground">••••••••</span>
  }
  return <span>{value}</span>
}

// Usage
<RedactedField value={student.ssn} canView={hasPermission('view:ssn')} />
```

### 11.2 Consent & Authorization UI

#### 11.2.1 Data Sharing Consent

**Component:**
```typescript
// components/ConsentDialog.tsx
export function ConsentDialog({ onAccept, onDecline }: {
  onAccept: () => void
  onDecline: () => void
}) {
  const [agreed, setAgreed] = useState(false)

  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>Share Academic Data?</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p>
          You are about to share your academic transcript with Coach Smith.
          This will include:
        </p>
        <ul className="list-disc ml-6 my-4">
          <li>Current GPA</li>
          <li>Course schedule</li>
          <li>Eligibility status</li>
        </ul>
        <Checkbox
          id="consent"
          checked={agreed}
          onCheckedChange={setAgreed}
          label="I consent to sharing this information"
        />
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onDecline}>
          Decline
        </Button>
        <Button onClick={onAccept} disabled={!agreed}>
          Accept
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
```

#### 11.2.2 Access Control Indicators

**Permission Badge:**
```typescript
// components/PermissionBadge.tsx
export function PermissionBadge({ level }: { level: 'read' | 'write' | 'none' }) {
  const config = {
    read: { icon: EyeIcon, color: 'text-blue-600', label: 'View Only' },
    write: { icon: PencilIcon, color: 'text-green-600', label: 'Can Edit' },
    none: { icon: LockClosedIcon, color: 'text-gray-400', label: 'No Access' },
  }

  const { icon: Icon, color, label } = config[level]

  return (
    <Badge variant="outline" className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}
```

### 11.3 Audit Trail UI

**Access Log Table:**
```typescript
// components/AccessLog.tsx
export function AccessLog({ studentId }: { studentId: string }) {
  const { data: logs } = useQuery({
    queryKey: ['access-logs', studentId],
    queryFn: () => fetch(`/api/audit/access-logs/${studentId}`).then(r => r.json()),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access History</CardTitle>
        <CardDescription>
          FERPA-compliant audit trail of who accessed this student's record
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Field</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDate(log.timestamp)}</TableCell>
                <TableCell>{log.userName}</TableCell>
                <TableCell>
                  <Badge>{log.action}</Badge>
                </TableCell>
                <TableCell>{log.field || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### 11.4 Session Timeout Warning

**Component:**
```typescript
// components/SessionTimeout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function SessionTimeout({ timeoutMinutes = 30 }: { timeoutMinutes?: number }) {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const router = useRouter()

  useEffect(() => {
    const warningTime = (timeoutMinutes - 1) * 60 * 1000 // 1 min before timeout
    const timeoutTime = timeoutMinutes * 60 * 1000

    const warningTimer = setTimeout(() => {
      setShowWarning(true)
    }, warningTime)

    const timeoutTimer = setTimeout(() => {
      router.push('/sign-out?reason=timeout')
    }, timeoutTime)

    // Reset timers on user activity
    const resetTimers = () => {
      clearTimeout(warningTimer)
      clearTimeout(timeoutTimer)
      setShowWarning(false)
    }

    window.addEventListener('mousemove', resetTimers)
    window.addEventListener('keypress', resetTimers)

    return () => {
      clearTimeout(warningTimer)
      clearTimeout(timeoutTimer)
      window.removeEventListener('mousemove', resetTimers)
      window.removeEventListener('keypress', resetTimers)
    }
  }, [timeoutMinutes, router])

  useEffect(() => {
    if (!showWarning) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/sign-out?reason=timeout')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showWarning, router])

  if (!showWarning) return null

  return (
    <Alert variant="warning" className="fixed bottom-4 right-4 max-w-md">
      <AlertTitle>Session Expiring Soon</AlertTitle>
      <AlertDescription>
        Your session will expire in {countdown} seconds due to inactivity.
        Move your mouse or press any key to continue.
      </AlertDescription>
    </Alert>
  )
}
```

---

## 12. Performance Requirements

### 12.1 Core Web Vitals Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Time until largest content element is visible |
| **FID** (First Input Delay) | < 100ms | Time from first interaction to browser response |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability (layout shifts) |
| **FCP** (First Contentful Paint) | < 1.5s | Time until first content is painted |
| **TTI** (Time to Interactive) | < 3.5s | Time until page is fully interactive |
| **TBT** (Total Blocking Time) | < 300ms | Sum of blocking time between FCP and TTI |

### 12.2 Performance Optimization Techniques

#### 12.2.1 Image Optimization

**Next.js Image Component:**
```tsx
import Image from 'next/image'

// Automatic optimization, lazy loading, responsive images
<Image
  src="/student-photo.jpg"
  alt="Student profile photo"
  width={200}
  height={200}
  placeholder="blur"
  blurDataURL="/student-photo-blur.jpg"
  priority={false} // Lazy load by default
/>
```

**Image CDN Configuration:**
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
}
```

#### 12.2.2 Code Splitting

**Route-Based Code Splitting** (automatic with App Router):
```
app/
├── admin/
│   └── page.tsx       → Separate bundle
├── coach/
│   └── page.tsx       → Separate bundle
└── student/
    └── page.tsx       → Separate bundle
```

**Component-Based Code Splitting:**
```tsx
import dynamic from 'next/dynamic'

// Lazy load heavy chart component
const PerformanceChart = dynamic(
  () => import('@/components/PerformanceChart'),
  {
    loading: () => <Skeleton className="h-64" />,
    ssr: false, // Client-side only
  }
)

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <PerformanceChart /> {/* Loaded on demand */}
    </div>
  )
}
```

#### 12.2.3 Font Optimization

**Next.js Font Optimization:**
```tsx
// app/layout.tsx
import { Inter, Fira_Code } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap', // FOUT strategy
  preload: true,
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

#### 12.2.4 Data Fetching Optimization

**Parallel Data Fetching:**
```tsx
// app/admin/students/[id]/page.tsx
export default async function StudentPage({ params }: { params: { id: string } }) {
  // Fetch in parallel
  const [student, eligibility, performance] = await Promise.all([
    fetchStudent(params.id),
    fetchEligibility(params.id),
    fetchPerformance(params.id),
  ])

  return (
    <div>
      <ProfileHeader student={student} />
      <EligibilityCard eligibility={eligibility} />
      <PerformanceChart performance={performance} />
    </div>
  )
}
```

**Streaming with Suspense:**
```tsx
// app/admin/students/[id]/page.tsx
import { Suspense } from 'react'

export default async function StudentPage({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* Render immediately */}
      <ProfileHeader studentId={params.id} />

      {/* Stream in progressively */}
      <Suspense fallback={<Skeleton className="h-64" />}>
        <EligibilityCard studentId={params.id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <PerformanceChart studentId={params.id} />
      </Suspense>
    </div>
  )
}

// Components fetch their own data
async function EligibilityCard({ studentId }: { studentId: string }) {
  const eligibility = await fetchEligibility(studentId)
  return <Card>{/* ... */}</Card>
}
```

#### 12.2.5 Caching Strategy

**API Route Caching:**
```typescript
// app/api/user/students/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const student = await fetchStudent(params.id)

  return Response.json(student, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
```

**React Query Caching:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})
```

#### 12.2.6 Bundle Analysis

**Webpack Bundle Analyzer:**
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... other config
})
```

**Usage:**
```bash
ANALYZE=true pnpm build
```

### 12.3 Performance Monitoring

**Vercel Analytics Integration:**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

**Custom Performance Metrics:**
```typescript
// lib/analytics/performance.ts
export function measurePerformance(metricName: string) {
  if (typeof window === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Send to analytics
      console.log(`${metricName}: ${entry.duration}ms`)
    }
  })

  observer.observe({ entryTypes: ['measure'] })

  return {
    start: () => performance.mark(`${metricName}-start`),
    end: () => {
      performance.mark(`${metricName}-end`)
      performance.measure(metricName, `${metricName}-start`, `${metricName}-end`)
    },
  }
}

// Usage
const metric = measurePerformance('chat-response-time')
metric.start()
// ... AI chat interaction ...
metric.end()
```

---

## 13. Testing Strategy

### 13.1 Testing Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /----\     - Playwright
     /      \    - Critical user flows
    /--------\
   /          \  Integration Tests (30%)
  /------------\ - React Testing Library
 /              \- API route testing
/________________\
                  Unit Tests (60%)
                  - Jest + Vitest
                  - Component logic
                  - Utility functions
```

### 13.2 Unit Testing

**Component Test:**
```typescript
// components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await userEvent.click(screen.getByText('Click me'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Submitting</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })
})
```

**Hook Test:**
```typescript
// lib/hooks/useStudentProfile.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStudentProfile } from './useStudentProfile'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useStudentProfile', () => {
  it('fetches student profile', async () => {
    const { result } = renderHook(() => useStudentProfile('123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      id: '123',
      name: 'John Doe',
      // ... other fields
    })
  })
})
```

### 13.3 Integration Testing

**API Route Test:**
```typescript
// app/api/user/students/[id]/route.test.ts
import { GET } from './route'
import { db } from '@aah/database'

jest.mock('@aah/database')
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'admin-123', sessionClaims: { role: 'admin' } }),
}))

describe('GET /api/user/students/[id]', () => {
  it('returns student data for authorized user', async () => {
    const mockStudent = {
      id: '123',
      firstName: 'John',
      lastName: 'Doe',
    }

    ;(db.student.findUnique as jest.Mock).mockResolvedValue(mockStudent)

    const request = new Request('http://localhost/api/user/students/123')
    const response = await GET(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockStudent)
  })

  it('returns 403 for unauthorized user', async () => {
    jest.spyOn(require('@clerk/nextjs'), 'auth').mockReturnValue({
      userId: 'student-123',
      sessionClaims: { role: 'student' },
    })

    const request = new Request('http://localhost/api/user/students/123')
    const response = await GET(request, { params: { id: '456' } })

    expect(response.status).toBe(403)
  })
})
```

**Component Integration Test:**
```typescript
// components/StudentProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentProfile } from './StudentProfile'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('StudentProfile', () => {
  it('displays student data after loading', async () => {
    renderWithProviders(<StudentProfile id="123" />)

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    expect(screen.getByText('GPA: 3.45')).toBeInTheDocument()
    expect(screen.getByText('Eligible')).toBeInTheDocument()
  })

  it('allows editing profile', async () => {
    renderWithProviders(<StudentProfile id="123" />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Edit Profile'))

    const input = screen.getByLabelText('First Name')
    await userEvent.clear(input)
    await userEvent.type(input, 'Jane')

    await userEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
  })
})
```

### 13.4 End-to-End Testing

**Playwright Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**E2E Test Example:**
```typescript
// e2e/student-dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as student
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'student@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/student/dashboard')
  })

  test('displays academic overview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Academic Overview' })).toBeVisible()
    await expect(page.getByText(/Current GPA:/)).toBeVisible()
    await expect(page.getByText(/Credits Earned:/)).toBeVisible()
  })

  test('opens AI chat widget', async ({ page }) => {
    await page.click('[aria-label="Open AI Assistant"]')

    await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible()

    await page.fill('[placeholder="Ask a question..."]', 'Can I take MATH 301 next semester?')
    await page.click('button[aria-label="Send message"]')

    // Wait for streaming response
    await expect(page.getByText(/MATH 301/)).toBeVisible({ timeout: 10000 })
  })

  test('navigates to schedule page', async ({ page }) => {
    await page.click('[href="/student/schedule"]')
    await expect(page).toHaveURL('/student/schedule')
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible()
  })
})
```

**Critical User Flow Test:**
```typescript
// e2e/admin-student-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Admin: Student Management', () => {
  test('admin can view and update student eligibility', async ({ page }) => {
    // Sign in as admin
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Navigate to students page
    await page.goto('/admin/students')
    await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible()

    // Search for student
    await page.fill('[placeholder="Search students..."]', 'John Doe')
    await page.click('text=John Doe')

    // Verify student detail page
    await expect(page).toHaveURL(/\/admin\/students\/\d+/)
    await expect(page.getByRole('heading', { name: 'John Doe' })).toBeVisible()

    // Navigate to compliance tab
    await page.click('text=Compliance')
    await expect(page.getByText('Eligibility Status')).toBeVisible()

    // Update eligibility status (if allowed)
    const eligibilityBadge = page.getByTestId('eligibility-badge')
    await expect(eligibilityBadge).toHaveText(/Eligible|At Risk|Ineligible/)
  })
})
```

### 13.5 Visual Regression Testing

**Chromatic Configuration:**
```javascript
// .storybook/main.js
module.exports = {
  stories: ['../packages/ui/components/**/*.stories.tsx'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@chromatic-com/storybook'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
}
```

**GitHub Action:**
```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on: push

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install dependencies
        run: pnpm install

      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### 13.6 Accessibility Testing

**Automated A11y Tests:**
```typescript
// components/Button.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Button - Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

**Playwright Accessibility:**
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('student dashboard has no accessibility violations', async ({ page }) => {
    await page.goto('/student/dashboard')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

---

## 14. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Week 1-2: Setup & Infrastructure**
- [ ] Initialize monorepo with Turborepo
- [ ] Set up shared packages (`@aah/ui`, `@aah/auth`, `@aah/database`)
- [ ] Configure Tailwind CSS with design tokens
- [ ] Set up Shadcn/UI component library
- [ ] Implement authentication with Clerk
- [ ] Create design system documentation (Storybook)

**Week 3-4: Core Layouts & Navigation**
- [ ] Build main layout with sidebar navigation
- [ ] Implement mobile bottom tab navigation
- [ ] Create responsive header component
- [ ] Build route protection middleware
- [ ] Implement error boundaries (error.tsx, global-error.tsx)
- [ ] Set up loading states (loading.tsx)

**Deliverables:**
- Working Next.js 14 app with App Router
- Responsive layouts for desktop and mobile
- Authentication flow (sign-in, sign-up, sign-out)
- Shared component library with 20+ components
- Design system documentation

---

### Phase 2: Student-Athlete Zone (Weeks 5-8)

**Week 5: Dashboard & Profile**
- [ ] Build student dashboard page
- [ ] Create academic overview card
- [ ] Implement eligibility status card
- [ ] Build weekly schedule widget
- [ ] Create notification list component

**Week 6: Schedule & Calendar**
- [ ] Implement full calendar view
- [ ] Create event card component
- [ ] Build conflict indicator system
- [ ] Integrate travel schedule display
- [ ] Add iCal export functionality

**Week 7: Resources & Support**
- [ ] Build tutoring service browser
- [ ] Create study hall booking system
- [ ] Implement workshop registration
- [ ] Build resource library with search
- [ ] Create mentor card component

**Week 8: Mobile Optimization**
- [ ] Optimize all student pages for mobile
- [ ] Implement swipe gestures
- [ ] Add pull-to-refresh
- [ ] Configure PWA manifest and service worker
- [ ] Add offline support for schedule viewing

**Deliverables:**
- Complete student-athlete zone (4 pages)
- Mobile-first responsive design
- PWA with offline support
- TanStack Query integration for all data fetching

---

### Phase 3: AI Chat Interface (Weeks 9-10)

**Week 9: Core Chat UI**
- [ ] Build ChatWidget component with minimize/expand states
- [ ] Implement MessageBubble component (user + assistant)
- [ ] Create InputArea with auto-resize textarea
- [ ] Add ThinkingIndicator animation
- [ ] Integrate Vercel AI SDK `useChat` hook

**Week 10: Advanced Features**
- [ ] Build ToolExecutionCard component
- [ ] Implement CitationFooter for sources
- [ ] Add streaming message rendering
- [ ] Create suggested prompts UI
- [ ] Build full-screen chat page (`/student/chat`)
- [ ] Add conversation history sidebar
- [ ] Implement export conversation feature

**Deliverables:**
- Fully functional AI chat widget
- Streaming responses with tool execution visualization
- Citation display for NCAA policy questions
- Full-screen chat interface with history

---

### Phase 4: Admin Zone - Core (Weeks 11-14)

**Week 11: Admin Dashboard**
- [ ] Build admin dashboard layout
- [ ] Create metric cards (KPIs)
- [ ] Implement trend charts with Recharts
- [ ] Build active alerts list
- [ ] Add recent AI eval results table

**Week 12: Student Management**
- [ ] Build student list page with DataTable
- [ ] Implement advanced filters (sport, year, status)
- [ ] Create bulk action toolbar
- [ ] Build student quick view popover
- [ ] Add export to CSV functionality

**Week 13: Student Detail Page (Part 1)**
- [ ] Create student profile header
- [ ] Build tab navigation (Profile, Academics, Compliance)
- [ ] Implement academic timeline view
- [ ] Create compliance checklist component
- [ ] Build GPA trend chart

**Week 14: Student Detail Page (Part 2)**
- [ ] Create performance tab with risk score
- [ ] Build intervention log timeline
- [ ] Implement schedule tab with full calendar
- [ ] Create support tab with tutoring history
- [ ] Add edit profile modal

**Deliverables:**
- Admin dashboard with real-time metrics
- Student management with search/filter
- Comprehensive student detail page (6 tabs)
- Data visualization with Recharts

---

### Phase 5: Admin Zone - Advanced (Weeks 15-17)

**Week 15: Alert Management**
- [ ] Build alert feed with real-time updates (Pusher/SSE)
- [ ] Create alert card with severity indicators
- [ ] Implement bulk acknowledge/dismiss actions
- [ ] Build alert detail modal
- [ ] Add action recommendations component

**Week 16: AI Evaluation Dashboard**
- [ ] Create eval runs table
- [ ] Build accuracy trend chart
- [ ] Implement cost tracker visualization
- [ ] Create regression alerts component
- [ ] Build model comparison grid

**Week 17: Reporting & Analytics**
- [ ] Create custom report builder
- [ ] Implement data export (CSV, PDF)
- [ ] Build cohort comparison charts
- [ ] Create eligibility trends dashboard
- [ ] Add scheduled report generation

**Deliverables:**
- Real-time alert management system
- AI evaluation monitoring dashboard
- Custom reporting and analytics tools

---

### Phase 6: Coach & Faculty Zones (Weeks 18-19)

**Week 18: Coach Zone**
- [ ] Build coach dashboard
- [ ] Create team roster view
- [ ] Implement at-risk alerts for team
- [ ] Build team GPA trend chart
- [ ] Add travel schedule integration

**Week 19: Faculty Zone**
- [ ] Create faculty dashboard
- [ ] Build course roster view (student-athletes only)
- [ ] Implement absence notification system
- [ ] Create absence approval workflow
- [ ] Build travel letter viewer

**Deliverables:**
- Complete coach zone (2 pages)
- Complete faculty zone (2 pages)
- Role-based access control enforcement

---

### Phase 7: Real-Time & Polish (Week 20)

**Week 20: Final Integration**
- [ ] Set up Pusher/Supabase Realtime
- [ ] Implement real-time notification system
- [ ] Add SSE for live analytics
- [ ] Optimize performance (bundle analysis, image optimization)
- [ ] Accessibility audit and fixes
- [ ] Security review (FERPA compliance)
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Production deployment to Vercel

**Deliverables:**
- Real-time notifications across all zones
- Performance optimizations (Core Web Vitals passing)
- Accessibility compliance (WCAG 2.1 Level AA)
- Security hardening (FERPA compliant)
- Production-ready deployment

---

### Phase 8: Testing & Documentation (Ongoing)

**Continuous Throughout All Phases:**
- [ ] Write unit tests for all components (Jest + React Testing Library)
- [ ] Write integration tests for API routes
- [ ] Create E2E tests for critical user flows (Playwright)
- [ ] Set up visual regression testing (Chromatic)
- [ ] Document components in Storybook
- [ ] Write developer documentation
- [ ] Create user guides for each zone

**Coverage Targets:**
- Unit test coverage: > 80%
- Integration test coverage: > 70%
- E2E test coverage: 100% of critical flows
- Visual regression: 100% of component library

---

## 15. Appendices

### Appendix A: Component Checklist Template

For each new component, ensure the following:

- [ ] **TypeScript:** Component is fully typed with interfaces
- [ ] **Props:** Props interface documented with JSDoc comments
- [ ] **Accessibility:** ARIA labels, keyboard navigation, focus management
- [ ] **Responsive:** Works on mobile, tablet, desktop
- [ ] **Dark Mode:** Supports dark mode if applicable
- [ ] **Tests:** Unit tests with > 80% coverage
- [ ] **Storybook:** Stories for all variants and states
- [ ] **Documentation:** README with usage examples
- [ ] **Error States:** Handles loading, error, empty states
- [ ] **Performance:** Memoized if expensive, lazy loaded if heavy

### Appendix B: Code Review Checklist

**Before submitting PR:**

- [ ] All TypeScript errors resolved
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting applied
- [ ] Tests added and passing
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Mobile responsiveness verified
- [ ] Performance impact assessed (bundle size, render time)
- [ ] FERPA compliance reviewed (no PII in URLs, proper data handling)
- [ ] Documentation updated
- [ ] Storybook stories added (if new component)

### Appendix C: Glossary

| Term | Definition |
|------|------------|
| **RSC** | React Server Component (default in Next.js 14 App Router) |
| **SSR** | Server-Side Rendering |
| **SSG** | Static Site Generation |
| **ISR** | Incremental Static Regeneration |
| **SSE** | Server-Sent Events (one-way real-time communication) |
| **WebSocket** | Two-way real-time communication protocol |
| **RBAC** | Role-Based Access Control |
| **FERPA** | Family Educational Rights and Privacy Act |
| **NCAA** | National Collegiate Athletic Association |
| **PWA** | Progressive Web App |
| **WCAG** | Web Content Accessibility Guidelines |
| **LCP** | Largest Contentful Paint (Core Web Vital) |
| **FID** | First Input Delay (Core Web Vital) |
| **CLS** | Cumulative Layout Shift (Core Web Vital) |

### Appendix D: Useful Resources

**Official Documentation:**
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Shadcn/UI Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)
- [React Hook Form](https://react-hook-form.com/)
- [Clerk Authentication](https://clerk.com/docs)

**Tools:**
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Playwright](https://playwright.dev/)
- [Chromatic](https://www.chromatic.com/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)

### Appendix E: Design Decisions

**Why Next.js 14 App Router over Pages Router?**
- Server Components for better performance
- Streaming and Suspense for progressive rendering
- Improved routing with layouts and loading states
- Better data fetching patterns (no getServerSideProps boilerplate)

**Why TanStack Query over SWR?**
- More powerful caching and invalidation
- Better TypeScript support
- Optimistic updates and mutations
- DevTools for debugging

**Why Shadcn/UI over Material-UI?**
- Headless components (full style control)
- Copy-paste approach (no runtime dependency)
- Built on Radix UI primitives (accessibility by default)
- Smaller bundle size

**Why Pusher over Socket.io for WebSockets?**
- Managed service (no infrastructure to maintain)
- Built-in presence channels
- Better Vercel integration
- Automatic scaling

---

**End of Frontend UI Technical Specification**

This specification should serve as the single source of truth for all frontend development on the Athletic Academics Hub platform. For questions or clarifications, please refer to the [PRD](./prd.md) and [Technical Specification](./tech-spec.md).

**Version:** 1.0
**Last Updated:** 2025-11-08
**Status:** Living Document (will be updated as requirements evolve)
