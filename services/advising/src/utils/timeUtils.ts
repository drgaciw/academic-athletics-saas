// ============================================================================
// TIME UTILITIES
// ============================================================================

import type { TimeSlot, TimeRange, DayOfWeek } from '../types'

/**
 * Parse time string in HH:MM format to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)

  return start1Min < end2Min && start2Min < end1Min
}

/**
 * Check if two time slots overlap (same day and overlapping times)
 */
export function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) {
    return false
  }
  return timeRangesOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)
}

/**
 * Check if any time slots in two arrays overlap
 */
export function hasTimeSlotOverlap(slots1: TimeSlot[], slots2: TimeSlot[]): boolean {
  for (const slot1 of slots1) {
    for (const slot2 of slots2) {
      if (timeSlotsOverlap(slot1, slot2)) {
        return true
      }
    }
  }
  return false
}

/**
 * Find all overlapping time slots between two arrays
 */
export function findOverlappingTimeSlots(
  slots1: TimeSlot[],
  slots2: TimeSlot[]
): Array<{ slot1: TimeSlot; slot2: TimeSlot }> {
  const overlaps: Array<{ slot1: TimeSlot; slot2: TimeSlot }> = []

  for (const slot1 of slots1) {
    for (const slot2 of slots2) {
      if (timeSlotsOverlap(slot1, slot2)) {
        overlaps.push({ slot1, slot2 })
      }
    }
  }

  return overlaps
}

/**
 * Convert course section days and times to time slots
 */
export function sectionToTimeSlots(
  days: string[],
  startTime: string,
  endTime: string
): TimeSlot[] {
  return days.map(day => ({
    day: day.toUpperCase(),
    startTime,
    endTime
  }))
}

/**
 * Check if a time is within a time range
 */
export function isTimeInRange(time: string, range: TimeRange): boolean {
  const timeMin = timeToMinutes(time)
  const startMin = timeToMinutes(range.start)
  const endMin = timeToMinutes(range.end)
  return timeMin >= startMin && timeMin <= endMin
}

/**
 * Calculate the duration between two times in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

/**
 * Check if two time slots are back-to-back (no gap between them)
 */
export function areBackToBack(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) {
    return false
  }

  const end1 = timeToMinutes(slot1.endTime)
  const start2 = timeToMinutes(slot2.startTime)
  const start1 = timeToMinutes(slot1.startTime)
  const end2 = timeToMinutes(slot2.endTime)

  // Check both directions
  return end1 === start2 || end2 === start1
}

/**
 * Calculate total contact hours per week for a set of time slots
 */
export function calculateWeeklyHours(slots: TimeSlot[]): number {
  let totalMinutes = 0
  for (const slot of slots) {
    totalMinutes += calculateDuration(slot.startTime, slot.endTime)
  }
  return totalMinutes / 60
}

/**
 * Group time slots by day
 */
export function groupSlotsByDay(slots: TimeSlot[]): Map<string, TimeSlot[]> {
  const grouped = new Map<string, TimeSlot[]>()

  for (const slot of slots) {
    const daySlots = grouped.get(slot.day) || []
    daySlots.push(slot)
    grouped.set(slot.day, daySlots)
  }

  return grouped
}

/**
 * Calculate the gap (in minutes) between two time slots on the same day
 */
export function calculateGap(slot1: TimeSlot, slot2: TimeSlot): number {
  if (slot1.day !== slot2.day) {
    return -1
  }

  const end1 = timeToMinutes(slot1.endTime)
  const start2 = timeToMinutes(slot2.startTime)

  return start2 - end1
}

/**
 * Find the earliest start time among time slots
 */
export function findEarliestStart(slots: TimeSlot[]): string | null {
  if (slots.length === 0) return null

  let earliest = timeToMinutes(slots[0].startTime)
  for (const slot of slots) {
    const start = timeToMinutes(slot.startTime)
    if (start < earliest) {
      earliest = start
    }
  }

  return minutesToTime(earliest)
}

/**
 * Find the latest end time among time slots
 */
export function findLatestEnd(slots: TimeSlot[]): string | null {
  if (slots.length === 0) return null

  let latest = timeToMinutes(slots[0].endTime)
  for (const slot of slots) {
    const end = timeToMinutes(slot.endTime)
    if (end > latest) {
      latest = end
    }
  }

  return minutesToTime(latest)
}

/**
 * Check if a day has common days with another array of days
 */
export function hasCommonDays(days1: string[], days2: string[]): boolean {
  const set1 = new Set(days1.map(d => d.toUpperCase()))
  const set2 = new Set(days2.map(d => d.toUpperCase()))

  for (const day of set1) {
    if (set2.has(day)) {
      return true
    }
  }

  return false
}

/**
 * Format time slots for display
 */
export function formatTimeSlot(slot: TimeSlot): string {
  return `${slot.day} ${slot.startTime}-${slot.endTime}`
}

/**
 * Format multiple time slots for display
 */
export function formatTimeSlots(slots: TimeSlot[]): string {
  const grouped = groupSlotsByDay(slots)
  const parts: string[] = []

  for (const [day, daySlots] of grouped.entries()) {
    const times = daySlots.map(s => `${s.startTime}-${s.endTime}`).join(', ')
    parts.push(`${day}: ${times}`)
  }

  return parts.join('; ')
}
