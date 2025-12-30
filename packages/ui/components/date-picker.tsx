'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '../utils/cn'
import { Button } from './button'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-md border border-gray-200 bg-white p-4 text-gray-900 shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

// Simple calendar component for date selection
interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
}

function Calendar({ selected, onSelect, disabled, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  )

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  const handleDateClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    if (disabled && disabled(date)) return
    onSelect?.(date)
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isDisabled = (day: number) => {
    if (!disabled) return false
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    return disabled(date)
  }

  return (
    <div className={cn('p-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={previousMonth}
          className="p-1 hover:bg-gray-100 rounded"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
          )
          const isToday = new Date().toDateString() === date.toDateString()
          const selected = isSelected(day)

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={isDisabled(day)}
              aria-label={format(date, 'PPP')}
              aria-selected={selected}
              aria-current={isToday ? 'date' : undefined}
              className={cn(
                'h-9 w-9 text-sm rounded-md hover:bg-gray-100',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                selected &&
                  'bg-brand-primary text-white hover:bg-brand-primary'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface DatePickerProps {
  label?: string
  placeholder?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  error?: string
  className?: string
}

export function DatePicker({
  label,
  placeholder = 'Pick a date',
  value,
  onChange,
  disabled,
  error,
  className,
}: DatePickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-gray-500',
              error && 'border-error'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar selected={value} onSelect={onChange} disabled={disabled} />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}

export { Popover, PopoverTrigger, PopoverContent, Calendar }