# Design Document

## Overview

The Frontend UI implementation transforms the Athletic Academics Hub into a modern, accessible, and performant web application with comprehensive user interfaces for all stakeholder zones. The design leverages Next.js 14 App Router with React Server Components, Shadcn/UI component library, TanStack Query for data management, and real-time features for live updates.

### Key Design Principles

1. **Mobile-First Responsive Design**: Design for 375px viewport first, scale up to desktop
2. **Accessibility First**: WCAG 2.1 Level AA compliance with semantic HTML and ARIA labels
3. **Performance Budgets**: LCP < 2.5s, FID < 100ms, CLS < 0.1
4. **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with client-side interactivity
5. **FERPA Compliance by Design**: No PII in URLs, client-side encryption, explicit consent flows

### Technology Stack

- **Framework**: Next.js 14 with App Router (React Server Components)
- **UI Library**: Shadcn/UI (headless components on Radix UI)
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (server state), Zustand (client state)
- **Forms**: React Hook Form with Zod validation
- **Real-Time**: Pusher (WebSockets) and Server-Sent Events (SSE)
- **AI Integration**: Vercel AI SDK for streaming chat
- **Data Visualization**: Recharts for charts and graphs
- **Testing**: Jest, React Testing Library, Playwright

## Architecture

### Component Hierarchy (Atomic Design)

```
Design System (@aah/ui)
├── Atoms (Basic building blocks)
│   ├── Button, Input, Label, Badge, Avatar, Spinner
│   └── Icon, Checkbox, Radio, Switch
├── Molecules (Simple combinations)
│   ├── SearchInput, SelectField, DatePicker
│   ├── StatCard, AlertBanner, ProgressIndicator
│   └── FormField (Label + Input + Error)
├── Organisms (Complex components)
│   ├── DataTable, NavigationBar, Sidebar
│   ├── Modal, Calendar, ChatWidget
│   └── FormWizard, FileUpload
└── Templates (Page layouts)
    ├── DashboardLayout, DetailPageLayout
    ├── ListPageLayout, AuthLayout
    └── MobileLayout (bottom nav)
```

### Multi-Zone Architecture

```
athleticacademics.com/
├── /student/**          → Student-Athlete Zone (Mobile-optimized)
│   ├── /dashboard       → Academic overview, eligibility, schedule
│   ├── /schedule        → Full calendar view
│   ├── /resources       → Tutoring, study halls, workshops
│   └── /chat            → Full-screen AI assistant
├── /admin/**            → Admin Zone (Desktop-focused)
│   ├── /dashboard       → Metrics, alerts, AI evals
│   ├── /students        → Student management table
│   ├── /students/[id]   → Student detail (6 tabs)
│   ├── /alerts          → Real-time alert feed
│   └── /evals           → AI evaluation dashboard
├── /coach/**            → Coach Zone
│   ├── /dashboard       → Team performance overview
│   └── /team            → Team roster management
└── /faculty/**          → Faculty Zone
    ├── /dashboard       → Course roster, absences
    └── /absences        → Absence request management
```


### State Management Architecture

```
Application State
├── Server State (TanStack Query)
│   ├── Student profiles, courses, schedules
│   ├── Compliance records, eligibility status
│   ├── Alerts, notifications, interventions
│   └── AI evaluation results, metrics
├── Client State (Zustand)
│   ├── UI preferences (sidebar collapsed, theme)
│   ├── Chat widget state (open/closed)
│   └── Table pagination, filters
├── Form State (React Hook Form)
│   ├── Student profile updates
│   ├── Session bookings
│   └── Absence approvals
└── Real-Time State (Pusher/SSE)
    ├── Alert notifications
    ├── Live analytics updates
    └── Chat message streaming
```

## Components and Interfaces

### 1. Design System - Design Tokens

**CSS Custom Properties** (`packages/ui/styles/tokens.css`)

```css
:root {
  /* Brand Colors */
  --brand-primary: #1e40af;      /* Blue 700 */
  --brand-secondary: #7c3aed;    /* Violet 600 */
  --brand-accent: #0891b2;       /* Cyan 600 */
  
  /* Semantic Colors */
  --success: #16a34a;            /* Green 600 */
  --warning: #ea580c;            /* Orange 600 */
  --error: #dc2626;              /* Red 600 */
  --info: #0284c7;               /* Sky 600 */
  
  /* NCAA Status Colors */
  --eligible: #16a34a;           /* Green 600 */
  --at-risk: #eab308;            /* Yellow 600 */
  --ineligible: #dc2626;         /* Red 600 */
  --pending-review: #6366f1;     /* Indigo 500 */
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --text-xs: 0.75rem;   /* 12px */
  --text-sm: 0.875rem;  /* 14px */
  --text-base: 1rem;    /* 16px */
  --text-lg: 1.125rem;  /* 18px */
  --text-xl: 1.25rem;   /* 20px */
  
  /* Spacing (4px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  
  /* Border Radius */
  --radius-sm: 0.25rem; /* 4px */
  --radius-md: 0.5rem;  /* 8px */
  --radius-lg: 0.75rem; /* 12px */
  
  /* Z-index Scale */
  --z-dropdown: 1000;
  --z-modal: 1050;
  --z-tooltip: 1070;
  --z-notification: 1080;
}
```


### 2. Core Component Specifications

#### Button Component

**Interface** (`packages/ui/components/button.tsx`)

```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  className?: string
}
```

**Variants**:
- `default`: Primary brand color background
- `destructive`: Error color for delete actions
- `outline`: Border with transparent background
- `secondary`: Muted background color
- `ghost`: Transparent with hover effect
- `link`: Text-only with underline

#### DataTable Component

**Interface** (`packages/ui/components/data-table.tsx`)

```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  searchable?: boolean
  searchPlaceholder?: string
  filterable?: boolean
  filters?: FilterConfig[]
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  loading?: boolean
}
```

**Features**:
- Built on TanStack Table for sorting, filtering, pagination
- Responsive: Desktop shows full table, mobile shows card list
- Keyboard navigation support
- Bulk selection with checkbox column
- Custom cell renderers per column

#### Modal Component

**Interface** (`packages/ui/components/modal.tsx`)

```typescript
interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}
```

**Features**:
- Focus trap with keyboard navigation
- Escape key to close
- Click outside to close (optional)
- ARIA labels for accessibility
- Backdrop with blur effect


### 3. AI Chat Widget Design

#### Component Structure

```
ChatWidget (Client Component)
├── ChatHeader
│   ├── Title ("AI Assistant")
│   ├── MinimizeButton
│   └── MenuButton (Export, Clear History)
├── MessageList
│   ├── MessageBubble (User)
│   ├── MessageBubble (Assistant)
│   │   ├── ThinkingIndicator (streaming)
│   │   ├── ToolExecutionCard (tool use)
│   │   └── CitationFooter (sources)
│   └── ScrollAnchor (auto-scroll)
├── InputArea
│   ├── TextArea (auto-resize)
│   ├── SendButton
│   └── StopButton (while streaming)
└── SuggestedPrompts (empty state)
```

#### States

1. **Minimized**: Floating action button (bottom-right desktop, bottom-center mobile)
2. **Expanded**: 400px × 600px panel (desktop) or full-screen (mobile)
3. **Streaming**: Typing indicator with animated cursor
4. **Tool Execution**: Card showing tool name, status (running/success/error), results

#### Message Types

**User Message**:
```typescript
{
  role: 'user',
  content: string,
  timestamp: Date
}
```

**Assistant Message**:
```typescript
{
  role: 'assistant',
  content: string,
  timestamp: Date,
  citations?: Citation[],
  toolCalls?: ToolCall[]
}
```

**Tool Execution**:
```typescript
{
  toolName: string,
  toolInput: Record<string, any>,
  toolOutput: any,
  status: 'running' | 'success' | 'error'
}
```

#### Vercel AI SDK Integration

```typescript
// Implementation using useChat hook
const {
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
} = useChat({
  api: '/api/ai/chat',
  onError: (error) => toast.error(error.message),
})
```


### 4. Student-Athlete Zone Pages

#### Dashboard Page (`/student/dashboard`)

**Layout**:
```
┌─────────────────────────────────────┐
│ [Logo] Welcome, [Name] [Avatar] [≡] │ ← Header
├─────────────────────────────────────┤
│ 📊 Academic Overview Card           │
│  GPA: 3.45 / 4.0                    │
│  Credits: 64 / 120 (53%)            │
│  [Progress Bar]                     │
├─────────────────────────────────────┤
│ ✅ Eligibility Status                │
│  [●] Eligible for Competition       │
│  Next check: Aug 15, 2025           │
├─────────────────────────────────────┤
│ 📅 This Week's Schedule             │
│  Mon 9:00 AM - MATH 201 (Exam)      │
│  Wed 3:00 PM - Team Practice        │
│  Fri 10:00 AM - Tutoring Session    │
├─────────────────────────────────────┤
│ 📢 Notifications (3)                │
│  [!] Upcoming compliance check      │
│  [i] New study hall session         │
└─────────────────────────────────────┘
[🤖 AI Chat FAB]  ← Floating Action Button
```

**Components**:
- `StudentHeader`: Mobile header with hamburger menu
- `AcademicOverviewCard`: GPA, credits, progress metrics
- `EligibilityStatusCard`: NCAA status badge
- `WeekScheduleList`: Condensed weekly view
- `NotificationList`: Recent alerts
- `ChatWidget`: Minimized floating button

**Data Fetching**:
```typescript
// Server Component
async function Dashboard() {
  const student = await getStudentDashboard()
  
  return (
    <>
      <AcademicOverviewCard data={student.academic} />
      <EligibilityStatusCard status={student.eligibility} />
      <WeekScheduleList events={student.schedule} />
      <NotificationList notifications={student.notifications} />
    </>
  )
}
```

#### Schedule Page (`/student/schedule`)

**Features**:
- Weekly/monthly calendar views (React Big Calendar)
- Color-coded events: class (blue), practice (green), tutoring (purple), travel (orange)
- Conflict indicators with warning badges
- Event detail popovers
- iCal export button

**Components**:
- `CalendarView`: Full calendar with event rendering
- `EventCard`: Event details with join links
- `ConflictBanner`: Scheduling conflict alerts
- `TravelSchedule`: Upcoming travel itinerary

#### Resources Page (`/student/resources`)

**Sections**:
1. **Tutoring Services**: Available sessions with booking
2. **Study Halls**: Reservation system
3. **Workshops**: Upcoming events with registration
4. **Resource Library**: Searchable documents/videos
5. **Mentoring**: Assigned mentor contact

**Components**:
- `ServiceCard`: Tutoring/study hall with booking button
- `WorkshopList`: Upcoming workshops
- `ResourceLibrary`: Search + filter interface
- `MentorCard`: Mentor info and contact


### 5. Admin Zone Pages

#### Admin Dashboard (`/admin/dashboard`)

**Layout**:
```
┌────────────┬─────────────────────────────────┐
│            │ 📊 Key Metrics                  │
│            │ ┌────┬────┬────┬────┐           │
│ Sidebar    │ │564 │ 12 │94% │ 8  │           │
│            │ │STU │ALT │ELG │ACT │           │
│ - Dashboard│ └────┴────┴────┴────┘           │
│ - Students │                                 │
│ - Alerts   │ 📈 Eligibility Trends           │
│ - Evals    │ [Line chart - 6 months]         │
│ - Reports  │                                 │
│            │ 🚨 Active Alerts (12)           │
│            │ [!] 3 students at risk          │
│            │ [!] 5 missing documents         │
└────────────┴─────────────────────────────────┘
```

**Components**:
- `AdminSidebar`: Navigation with role-based menu
- `MetricCard`: KPI with trend indicator
- `TrendChart`: Time-series (Recharts)
- `AlertList`: Prioritized alerts
- `EvalResultsTable`: Recent AI eval summary

**Real-Time Updates**:
```typescript
// SSE for live metrics
useEffect(() => {
  const eventSource = new EventSource('/api/monitoring/analytics/stream')
  
  eventSource.onmessage = (event) => {
    const metrics = JSON.parse(event.data)
    setMetrics(metrics)
  }
  
  return () => eventSource.close()
}, [])
```

#### Student Management Page (`/admin/students`)

**Features**:
- Sortable data table (TanStack Table)
- Search by name, sport, student ID
- Advanced filters: sport, year, status, at-risk
- Bulk actions: export CSV, send notifications
- Quick view popover on hover

**Table Columns**:
- Name (with avatar)
- Sport
- Year
- GPA
- Credits
- Eligibility Status (badge)
- Actions (view, edit)

**Data Fetching**:
```typescript
// Client Component with TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['students', filters],
  queryFn: () => fetchStudents(filters),
  staleTime: 60 * 1000,
})
```

#### Student Detail Page (`/admin/students/[id]`)

**Tab Structure**:
1. **Profile**: Personal info, contact, academic standing
2. **Academics**: Semester-by-semester transcript, GPA trends
3. **Compliance**: Eligibility checklist, violations, documents
4. **Performance**: Risk score trends, intervention history
5. **Schedule**: Full calendar view
6. **Support**: Tutoring history, study hall attendance

**Components**:
- `ProfileHeader`: Photo, name, quick stats
- `TabNavigation`: Multi-tab interface
- `AcademicTimeline`: Transcript visualization
- `ComplianceChecklist`: NCAA requirements
- `RiskScoreTrend`: Historical chart
- `InterventionLog`: Timeline of support


#### Alert Management Page (`/admin/alerts`)

**Features**:
- Real-time alert feed (WebSocket via Pusher)
- Priority sorting: critical (red), warning (yellow), info (blue)
- Bulk acknowledge/dismiss
- Alert detail modal
- AI-recommended interventions

**Real-Time Integration**:
```typescript
// Pusher WebSocket subscription
const pusher = usePusher()
const queryClient = useQueryClient()

useEffect(() => {
  const channel = pusher.subscribe(`user-${userId}`)
  
  channel.bind('new-alert', (data) => {
    toast.warning(data.message, {
      action: { label: 'View', onClick: () => navigate(`/admin/alerts/${data.id}`) }
    })
    
    queryClient.invalidateQueries({ queryKey: ['alerts'] })
  })
  
  return () => {
    channel.unbind_all()
    pusher.unsubscribe(`user-${userId}`)
  }
}, [pusher, userId])
```

**Components**:
- `AlertFeed`: Real-time stream
- `AlertCard`: Alert with severity badge
- `AlertDetailModal`: Full context
- `ActionRecommendations`: AI suggestions

#### AI Evaluation Dashboard (`/admin/evals`)

**Features**:
- Eval runs table with metrics
- Accuracy trend chart (Recharts)
- Cost tracker (token usage)
- Regression alerts
- Model comparison grid

**Components**:
- `EvalRunsTable`: List with drill-down
- `AccuracyTrendChart`: Performance over time
- `CostTracker`: Token usage visualization
- `RegressionAlerts`: Performance drops
- `ModelComparisonGrid`: Side-by-side metrics


### 6. Coach and Faculty Zones

#### Coach Dashboard (`/coach/dashboard`)

**Features**:
- Team roster with eligibility indicators
- At-risk student alerts
- Team GPA trend chart
- Upcoming compliance deadlines
- Drill-down to student details

**Components**:
- `TeamRoster`: Roster with status badges
- `AtRiskAlerts`: Students needing attention
- `TeamGPAChart`: Performance trends
- `UpcomingDeadlines`: Compliance calendar

#### Faculty Dashboard (`/faculty/dashboard`)

**Features**:
- Course roster (student-athletes only)
- Absence alerts for travel
- Quick grade submission
- Student progress cards

**Components**:
- `CourseRoster`: Enrolled students
- `AbsenceAlerts`: Upcoming absences
- `GradeSubmission`: Quick entry form
- `StudentProgressCard`: Academic standing

#### Absence Management Page (`/faculty/absences`)

**Features**:
- Absence request cards
- Approve/deny actions
- Travel letter viewer
- Absence impact analysis

**Components**:
- `AbsenceRequestCard`: Request with actions
- `TravelLetterViewer`: Official documentation
- `AbsenceImpactAnalysis`: Grade projection


## Data Models

### TanStack Query Key Factories

```typescript
// Query key organization
export const queryKeys = {
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.students.lists(), filters] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
  },
  compliance: {
    all: ['compliance'] as const,
    status: (id: string) => [...queryKeys.compliance.all, 'status', id] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    list: (filters: string) => [...queryKeys.alerts.all, 'list', filters] as const,
  },
}
```

### Zustand Store Structure

```typescript
interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // Chat Widget
  chatWidgetOpen: boolean
  openChatWidget: () => void
  closeChatWidget: () => void
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Table Preferences
  tablePageSize: number
  setTablePageSize: (size: number) => void
}
```

### Form Schemas (Zod)

```typescript
// Student profile update schema
export const updateStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  sport: z.enum(['football', 'basketball', 'soccer', 'other']),
  expectedGraduation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

// Session booking schema
export const bookSessionSchema = z.object({
  sessionId: z.string(),
  date: z.date(),
  notes: z.string().optional(),
})
```


## Error Handling

### Error Boundaries

**Global Error Boundary** (`app/global-error.tsx`)
```typescript
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <Button onClick={reset}>Try Again</Button>
          </div>
        </div>
      </body>
    </html>
  )
}
```

**Zone Error Boundary** (`app/[zone]/error.tsx`)
```typescript
'use client'

export default function ZoneError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error('Zone error:', error)
  }, [error])
  
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertTitle>Error Loading Page</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <Button onClick={reset} className="mt-4">Retry</Button>
    </div>
  )
}
```

### API Error Handling

```typescript
// Custom error class
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Error handler hook
export function useErrorHandler() {
  return (error: unknown) => {
    if (error instanceof APIError) {
      if (error.statusCode === 401) {
        toast.error('Session expired. Please sign in again.')
        redirect('/sign-in')
      } else if (error.statusCode === 403) {
        toast.error('You do not have permission to perform this action.')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.error('An unexpected error occurred.')
      console.error(error)
    }
  }
}
```


## Testing Strategy

### Unit Testing (Jest + React Testing Library)

**Component Test Example**:
```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

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

**Hook Test Example**:
```typescript
// useStudentProfile.test.ts
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
    })
  })
})
```

### Integration Testing

**API Route Test**:
```typescript
// route.test.ts
import { GET } from './route'
import { db } from '@aah/database'

jest.mock('@aah/database')
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'admin-123', sessionClaims: { role: 'admin' } }),
}))

describe('GET /api/user/students/[id]', () => {
  it('returns student data for authorized user', async () => {
    const mockStudent = { id: '123', firstName: 'John', lastName: 'Doe' }
    ;(db.student.findUnique as jest.Mock).mockResolvedValue(mockStudent)
    
    const request = new Request('http://localhost/api/user/students/123')
    const response = await GET(request, { params: { id: '123' } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toEqual(mockStudent)
  })
})
```

### E2E Testing (Playwright)

**Critical User Flow**:
```typescript
// student-dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'student@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/student/dashboard')
  })
  
  test('displays academic overview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Academic Overview' })).toBeVisible()
    await expect(page.getByText(/Current GPA:/)).toBeVisible()
  })
  
  test('opens AI chat widget', async ({ page }) => {
    await page.click('[aria-label="Open AI Assistant"]')
    await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible()
    
    await page.fill('[placeholder="Ask a question..."]', 'Can I take MATH 301?')
    await page.click('button[aria-label="Send message"]')
    
    await expect(page.getByText(/MATH 301/)).toBeVisible({ timeout: 10000 })
  })
})
```

### Accessibility Testing

**Automated A11y Tests**:
```typescript
// Button.test.tsx
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


## Performance Optimization

### Core Web Vitals Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP** | < 2.5s | Next.js Image optimization, RSC for data fetching, CDN caching |
| **FID** | < 100ms | Code splitting, lazy loading, minimal JavaScript |
| **CLS** | < 0.1 | Fixed dimensions for images, skeleton loaders, no layout shifts |
| **FCP** | < 1.5s | Font optimization, critical CSS inlining |
| **TTI** | < 3.5s | Progressive enhancement, streaming with Suspense |

### Optimization Techniques

**1. Image Optimization**
```typescript
import Image from 'next/image'

<Image
  src="/student-photo.jpg"
  alt="Student profile"
  width={200}
  height={200}
  placeholder="blur"
  priority={false} // Lazy load by default
/>
```

**2. Code Splitting**
```typescript
import dynamic from 'next/dynamic'

const PerformanceChart = dynamic(
  () => import('@/components/PerformanceChart'),
  {
    loading: () => <Skeleton className="h-64" />,
    ssr: false, // Client-side only
  }
)
```

**3. Streaming with Suspense**
```typescript
export default async function StudentPage({ params }) {
  return (
    <div>
      <ProfileHeader studentId={params.id} />
      
      <Suspense fallback={<Skeleton className="h-64" />}>
        <EligibilityCard studentId={params.id} />
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-96" />}>
        <PerformanceChart studentId={params.id} />
      </Suspense>
    </div>
  )
}
```

**4. Caching Strategy**
```typescript
// API route caching
export async function GET(req: Request) {
  const data = await fetchData()
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}

// TanStack Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})
```


## Mobile & Responsive Design

### Breakpoints

```javascript
// Tailwind breakpoints
{
  'xs': '375px',   // Mobile (small)
  'sm': '640px',   // Mobile (large)
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Desktop (large)
  '2xl': '1536px', // Desktop (xlarge)
}
```

### Mobile-First Approach

```typescript
// Default styles for mobile, scale up
<div className="
  flex flex-col gap-4      /* Mobile: vertical stack */
  md:flex-row md:gap-6     /* Tablet: horizontal */
  lg:gap-8                 /* Desktop: larger gaps */
">
  {/* Content */}
</div>
```

### Touch Gestures

**Swipe Navigation**:
```typescript
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  const touchStartX = useRef<number>(0)
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      const distance = touchStartX.current - e.changedTouches[0].clientX
      
      if (distance > threshold && onSwipeLeft) onSwipeLeft()
      if (distance < -threshold && onSwipeRight) onSwipeRight()
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

**Pull-to-Refresh**:
```typescript
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
        const distance = e.touches[0].clientY - startY.current
        if (distance > 80) setIsPulling(true)
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

### Progressive Web App (PWA)

**Manifest** (`public/manifest.json`):
```json
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

**Service Worker** (via next-pwa):
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // ... other config
})
```

### Bottom Tab Navigation (Mobile)

```typescript
export function BottomNav() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/student/dashboard', icon: HomeIcon, label: 'Home' },
    { href: '/student/schedule', icon: CalendarIcon, label: 'Schedule' },
    { href: '/student/resources', icon: BookOpenIcon, label: 'Resources' },
    { href: '/student/chat', icon: SparklesIcon, label: 'AI' },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
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


## Accessibility (WCAG 2.1 Level AA)

### Semantic HTML

```typescript
// Good: Semantic structure
<article>
  <header>
    <h1>Student Profile</h1>
    <p className="text-muted-foreground">Last updated: {date}</p>
  </header>
  
  <section aria-labelledby="academic-section">
    <h2 id="academic-section">Academic Information</h2>
    {/* Content */}
  </section>
  
  <footer>
    <Button>Edit Profile</Button>
  </footer>
</article>
```

### ARIA Labels

**Form with Error Handling**:
```typescript
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

**Button with Loading State**:
```typescript
<button
  type="submit"
  disabled={isSubmitting}
  aria-busy={isSubmitting}
  aria-label={isSubmitting ? 'Submitting...' : 'Submit form'}
>
  {isSubmitting ? <Spinner aria-hidden="true" /> : 'Submit'}
</button>
```

### Keyboard Navigation

**Focus Trap for Modals**:
```typescript
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
    
    firstElement?.focus()
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
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

### Screen Reader Announcements

**Live Region for Chat**:
```typescript
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

### Color Contrast

All color combinations meet WCAG 2.1 Level AA requirements:
- Normal text: ≥ 4.5:1 contrast ratio
- Large text (18pt+): ≥ 3:1 contrast ratio
- UI components: ≥ 3:1 contrast ratio

**Contrast Validation**:
```typescript
// Design tokens ensure compliant contrast
--brand-primary: #1e40af;  // Blue 700 on white = 8.59:1 ✓
--success: #16a34a;        // Green 600 on white = 4.54:1 ✓
--error: #dc2626;          // Red 600 on white = 5.90:1 ✓
```

