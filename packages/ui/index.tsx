// Atomic Components
export { Button, type ButtonProps } from './components/button';
export { Input, type InputProps } from './components/input';
export { Label, type LabelProps } from './components/label';
export { Badge, type BadgeProps, type BadgeVariant } from './components/badge';
export { Avatar, type AvatarProps } from './components/avatar';
export { Spinner, type SpinnerProps } from './components/spinner';

// Molecule Components
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/card';
export { Alert, AlertTitle, AlertDescription, type AlertVariant } from './components/alert';
export { Textarea } from './components/textarea';
export { Select } from './components/select';
export { SearchInput, type SearchInputProps } from './components/search-input';
export { StatCard, type StatCardProps } from './components/stat-card';
export { ProgressIndicator, type ProgressIndicatorProps } from './components/progress-indicator';
export { FormField, type FormFieldProps } from './components/form-field';
export { 
  SelectField, 
  SelectGroup, 
  SelectValue, 
  SelectTrigger, 
  SelectContent, 
  SelectLabel, 
  SelectItem, 
  SelectSeparator 
} from './components/select-field';
export { DatePicker, Popover, PopoverTrigger, PopoverContent, Calendar } from './components/date-picker';
export { AlertBanner } from './components/alert-banner';

// Organism Components
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from './components/table';
export { DataTable, type DataTableProps } from './components/data-table';
export { Modal, ModalFooter, type ModalProps, type ModalFooterProps } from './components/modal';
export { Sidebar, type SidebarProps, type SidebarItem } from './components/sidebar';
export { NavigationBar, type NavigationBarProps } from './components/navigation-bar';
export { CalendarView, type CalendarEvent } from './components/calendar-view';

// Chat Components
export {
  ChatWidget,
  ChatHeader,
  MessageList,
  MessageBubble,
  ChatInput,
  ThinkingIndicator,
  ToolExecutionCard,
  CitationFooter,
  type Message,
} from './components/chat';

// Special Components
export { CrossZoneLink } from './components/cross-zone-link';
export { ZoneErrorBoundary } from './components/zone-error-boundary';

// Providers
export { QueryProvider } from './providers/query-provider';
export { ToastProvider } from './providers/toast-provider';

// Query utilities
export { queryKeys, getInvalidationKeys } from './lib/query-keys';

// Custom hooks
export {
  useStudentProfile,
  useEligibilityStatus,
  useStudentsList,
  useAlerts,
  useAnalyticsSummary,
  useUpdateStudent,
  useAcknowledgeAlert,
  type StudentProfile,
  type EligibilityStatus,
  type Student,
  type StudentsListFilters,
  type StudentsListResponse,
  type Alert as AlertType,
  type AlertsFilters,
  type AnalyticsSummary,
  type UpdateStudentData,
} from './hooks';

// Stores
export { useUIStore, type UIState } from './stores/ui-store';

// Utilities
export { cn } from './utils/cn';
