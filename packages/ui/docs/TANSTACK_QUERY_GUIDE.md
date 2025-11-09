# TanStack Query Setup Guide

## Overview

This package provides a complete TanStack Query (formerly React Query) setup with:
- Pre-configured QueryClient with optimal defaults
- Query key factories for consistent cache management
- Custom hooks for common data fetching patterns
- Mutation hooks with optimistic updates
- TypeScript types for all queries and mutations

## Configuration

### QueryClient Settings

The QueryClient is configured with the following defaults:

```typescript
{
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 60 seconds - data is fresh for 1 minute
      gcTime: 5 * 60 * 1000,       // 5 minutes - unused data kept in cache
      retry: 1,                     // Retry failed requests once
      refetchOnWindowFocus: false,  // Don't refetch on window focus
    },
  },
}
```

### Provider Setup

The `QueryProvider` is already integrated in both apps:

```tsx
import { QueryProvider } from '@aah/ui'

export default function RootLayout({ children }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  )
}
```

## Query Key Factories

Query keys are organized using factories for consistent cache management:

```typescript
import { queryKeys } from '@aah/ui'

// Student queries
queryKeys.students.all              // ['students']
queryKeys.students.lists()          // ['students', 'list']
queryKeys.students.list(filters)    // ['students', 'list', { filters }]
queryKeys.students.detail(id)       // ['students', 'detail', id]
queryKeys.students.profile(id)      // ['students', 'detail', id, 'profile']

// Compliance queries
queryKeys.compliance.status(id)     // ['compliance', 'status', id]
queryKeys.compliance.eligibility(id) // ['compliance', 'eligibility', id]

// Alert queries
queryKeys.alerts.all                // ['alerts']
queryKeys.alerts.list(filters)      // ['alerts', 'list', { filters }]

// And more...
```

## Custom Hooks

### Query Hooks

#### useStudentProfile

Fetch a student's profile data:

```tsx
import { useStudentProfile } from '@aah/ui'

function StudentProfile({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useStudentProfile(studentId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{data.firstName} {data.lastName}</h1>
      <p>GPA: {data.gpa}</p>
      <p>Status: {data.eligibilityStatus}</p>
    </div>
  )
}
```

#### useEligibilityStatus

Fetch NCAA eligibility status:

```tsx
import { useEligibilityStatus } from '@aah/ui'

function EligibilityCard({ studentId }: { studentId: string }) {
  const { data, isLoading } = useEligibilityStatus(studentId)

  if (isLoading) return <Skeleton />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eligibility Status</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant={data.status}>{data.status}</Badge>
        <p>GPA: {data.gpa}</p>
        <p>Credits: {data.creditsEarned} / {data.creditsRequired}</p>
      </CardContent>
    </Card>
  )
}
```

#### useStudentsList

Fetch and filter students list:

```tsx
import { useStudentsList } from '@aah/ui'
import { useState } from 'react'

function StudentsList() {
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    page: 1,
    pageSize: 20,
  })

  const { data, isLoading } = useStudentsList(filters)

  return (
    <div>
      <SearchInput
        value={filters.search}
        onChange={(value) => setFilters({ ...filters, search: value })}
      />
      
      {isLoading ? (
        <Skeleton />
      ) : (
        <DataTable
          data={data.students}
          columns={columns}
          pagination={{
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
          }}
        />
      )}
    </div>
  )
}
```

#### useAlerts

Fetch alerts with filtering:

```tsx
import { useAlerts } from '@aah/ui'

function AlertsList() {
  const { data: alerts, isLoading } = useAlerts({
    type: 'critical',
    acknowledged: false,
  })

  if (isLoading) return <Skeleton />

  return (
    <div>
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  )
}
```

#### useAnalyticsSummary

Fetch dashboard analytics (auto-refreshes every 30 seconds):

```tsx
import { useAnalyticsSummary } from '@aah/ui'

function DashboardMetrics() {
  const { data, isLoading } = useAnalyticsSummary()

  if (isLoading) return <Skeleton />

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        label="Total Students"
        value={data.totalStudents}
        trend={data.trends.studentsChange}
      />
      <StatCard
        label="Active Alerts"
        value={data.activeAlerts}
        trend={data.trends.alertsChange}
      />
      <StatCard
        label="Eligibility %"
        value={`${data.eligibilityPercentage}%`}
        trend={data.trends.eligibilityChange}
      />
      <StatCard
        label="Interventions"
        value={data.activeInterventions}
      />
    </div>
  )
}
```

### Mutation Hooks

#### useUpdateStudent

Update student data with optimistic updates:

```tsx
import { useUpdateStudent } from '@aah/ui'
import { toast } from 'sonner'

function EditStudentForm({ studentId }: { studentId: string }) {
  const updateStudent = useUpdateStudent({
    onSuccess: () => {
      toast.success('Student updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`)
    },
  })

  const handleSubmit = (data: UpdateStudentData) => {
    updateStudent.mutate({ id: studentId, data })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={updateStudent.isPending}>
        {updateStudent.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
```

#### useAcknowledgeAlert

Acknowledge alerts:

```tsx
import { useAcknowledgeAlert } from '@aah/ui'

function AlertCard({ alert }: { alert: Alert }) {
  const acknowledgeAlert = useAcknowledgeAlert()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{alert.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{alert.message}</p>
        {!alert.acknowledged && (
          <Button
            onClick={() => acknowledgeAlert.mutate(alert.id)}
            disabled={acknowledgeAlert.isPending}
          >
            Acknowledge
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

## Advanced Patterns

### Manual Cache Updates

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@aah/ui'

function MyComponent() {
  const queryClient = useQueryClient()

  const handleAction = () => {
    // Invalidate specific queries
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.students.all 
    })

    // Set query data manually
    queryClient.setQueryData(
      queryKeys.students.profile('123'),
      newData
    )

    // Refetch specific query
    queryClient.refetchQueries({ 
      queryKey: queryKeys.alerts.all 
    })
  }
}
```

### Dependent Queries

```tsx
function StudentDetails({ studentId }: { studentId: string }) {
  // First query
  const { data: profile } = useStudentProfile(studentId)

  // Second query depends on first
  const { data: eligibility } = useEligibilityStatus(studentId, {
    enabled: !!profile, // Only run when profile is loaded
  })

  return <div>{/* Render data */}</div>
}
```

### Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@aah/ui'

function StudentListItem({ student }: { student: Student }) {
  const queryClient = useQueryClient()

  const prefetchProfile = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.students.profile(student.id),
      queryFn: () => fetch(`/api/user/students/${student.id}`).then(r => r.json()),
    })
  }

  return (
    <div onMouseEnter={prefetchProfile}>
      {student.firstName} {student.lastName}
    </div>
  )
}
```

### Infinite Queries

For paginated data that loads more on scroll:

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '@aah/ui'

function InfiniteStudentsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.students.lists(),
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/user/students?page=${pageParam}`).then(r => r.json()),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1,
  })

  return (
    <div>
      {data?.pages.map((page) =>
        page.students.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))
      )}
      
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  )
}
```

## Best Practices

1. **Use Query Keys Consistently**: Always use the query key factories from `queryKeys`
2. **Enable Queries Conditionally**: Use `enabled` option when data depends on other queries
3. **Implement Optimistic Updates**: For better UX in mutations
4. **Handle Loading and Error States**: Always provide feedback to users
5. **Invalidate Related Queries**: After mutations, invalidate affected queries
6. **Set Appropriate Stale Times**: Balance freshness vs. network requests
7. **Use TypeScript**: Leverage type safety for queries and mutations

## Troubleshooting

### Query Not Refetching

Check if `staleTime` is too high or if `refetchOnWindowFocus` is disabled.

### Cache Not Invalidating

Ensure you're using the correct query key from `queryKeys` and calling `invalidateQueries` after mutations.

### Type Errors

Make sure to import types from the hooks:
```tsx
import type { StudentProfile } from '@aah/ui'
```

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Query Key Factories](https://tkdodo.eu/blog/effective-react-query-keys)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)