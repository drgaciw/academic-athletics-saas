/**
 * Time Utilities Tests
 * Tests for time manipulation and comparison functions
 */

import {
  timeToMinutes,
  minutesToTime,
  timeRangesOverlap,
  timeSlotsOverlap,
  hasTimeSlotOverlap,
  findOverlappingTimeSlots,
  sectionToTimeSlots,
  isTimeInRange,
  calculateDuration,
  areBackToBack,
  calculateWeeklyHours,
  groupSlotsByDay,
  calculateGap,
  findEarliestStart,
  findLatestEnd,
  hasCommonDays,
  formatTimeSlot,
  formatTimeSlots,
} from '../utils/timeUtils'
import type { TimeSlot, TimeRange } from '../types'

describe('Time Utilities', () => {
  describe('timeToMinutes', () => {
    it('should convert midnight to 0', () => {
      expect(timeToMinutes('00:00')).toBe(0)
    })

    it('should convert 1:00 AM to 60', () => {
      expect(timeToMinutes('01:00')).toBe(60)
    })

    it('should convert 9:30 AM to 570', () => {
      expect(timeToMinutes('09:30')).toBe(570)
    })

    it('should convert noon to 720', () => {
      expect(timeToMinutes('12:00')).toBe(720)
    })

    it('should convert 11:59 PM to 1439', () => {
      expect(timeToMinutes('23:59')).toBe(1439)
    })

    it('should handle single-digit hours', () => {
      expect(timeToMinutes('9:00')).toBe(540)
    })
  })

  describe('minutesToTime', () => {
    it('should convert 0 to midnight', () => {
      expect(minutesToTime(0)).toBe('00:00')
    })

    it('should convert 60 to 1:00 AM', () => {
      expect(minutesToTime(60)).toBe('01:00')
    })

    it('should convert 570 to 9:30 AM', () => {
      expect(minutesToTime(570)).toBe('09:30')
    })

    it('should convert 720 to noon', () => {
      expect(minutesToTime(720)).toBe('12:00')
    })

    it('should convert 1439 to 11:59 PM', () => {
      expect(minutesToTime(1439)).toBe('23:59')
    })

    it('should pad single-digit hours and minutes', () => {
      expect(minutesToTime(65)).toBe('01:05')
    })
  })

  describe('timeRangesOverlap', () => {
    it('should detect overlapping ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true)
    })

    it('should not detect overlap for non-overlapping ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '10:30', '11:30')).toBe(false)
    })

    it('should not detect overlap for adjacent ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false)
    })

    it('should detect when one range contains another', () => {
      expect(timeRangesOverlap('08:00', '12:00', '09:00', '10:00')).toBe(true)
    })

    it('should detect when ranges are identical', () => {
      expect(timeRangesOverlap('09:00', '10:00', '09:00', '10:00')).toBe(true)
    })

    it('should detect partial overlap at start', () => {
      expect(timeRangesOverlap('09:00', '10:00', '08:30', '09:30')).toBe(true)
    })

    it('should detect partial overlap at end', () => {
      expect(timeRangesOverlap('09:00', '10:00', '09:45', '10:45')).toBe(true)
    })
  })

  describe('timeSlotsOverlap', () => {
    it('should detect overlap on same day', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'MONDAY', startTime: '09:30', endTime: '10:30' }
      expect(timeSlotsOverlap(slot1, slot2)).toBe(true)
    })

    it('should not detect overlap on different days', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'TUESDAY', startTime: '09:00', endTime: '10:00' }
      expect(timeSlotsOverlap(slot1, slot2)).toBe(false)
    })

    it('should not detect overlap for non-overlapping times on same day', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'MONDAY', startTime: '11:00', endTime: '12:00' }
      expect(timeSlotsOverlap(slot1, slot2)).toBe(false)
    })
  })

  describe('hasTimeSlotOverlap', () => {
    it('should detect any overlap between slot arrays', () => {
      const slots1: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
        { day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' },
      ]
      const slots2: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:30', endTime: '10:30' },
        { day: 'FRIDAY', startTime: '09:00', endTime: '10:00' },
      ]
      expect(hasTimeSlotOverlap(slots1, slots2)).toBe(true)
    })

    it('should not detect overlap when no slots overlap', () => {
      const slots1: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
      ]
      const slots2: TimeSlot[] = [
        { day: 'TUESDAY', startTime: '09:00', endTime: '10:00' },
      ]
      expect(hasTimeSlotOverlap(slots1, slots2)).toBe(false)
    })

    it('should handle empty arrays', () => {
      expect(hasTimeSlotOverlap([], [])).toBe(false)
      expect(hasTimeSlotOverlap([{ day: 'MONDAY', startTime: '09:00', endTime: '10:00' }], [])).toBe(false)
    })
  })

  describe('findOverlappingTimeSlots', () => {
    it('should find all overlapping slot pairs', () => {
      const slots1: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
        { day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' },
      ]
      const slots2: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:30', endTime: '10:30' },
        { day: 'WEDNESDAY', startTime: '09:30', endTime: '10:30' },
      ]

      const overlaps = findOverlappingTimeSlots(slots1, slots2)
      expect(overlaps).toHaveLength(2)
    })

    it('should return empty array when no overlaps', () => {
      const slots1: TimeSlot[] = [{ day: 'MONDAY', startTime: '09:00', endTime: '10:00' }]
      const slots2: TimeSlot[] = [{ day: 'TUESDAY', startTime: '09:00', endTime: '10:00' }]

      const overlaps = findOverlappingTimeSlots(slots1, slots2)
      expect(overlaps).toHaveLength(0)
    })
  })

  describe('sectionToTimeSlots', () => {
    it('should convert section days and times to time slots', () => {
      const days = ['MONDAY', 'WEDNESDAY', 'FRIDAY']
      const slots = sectionToTimeSlots(days, '09:00', '10:00')

      expect(slots).toHaveLength(3)
      expect(slots[0]).toEqual({ day: 'MONDAY', startTime: '09:00', endTime: '10:00' })
      expect(slots[1]).toEqual({ day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' })
      expect(slots[2]).toEqual({ day: 'FRIDAY', startTime: '09:00', endTime: '10:00' })
    })

    it('should uppercase day names', () => {
      const slots = sectionToTimeSlots(['monday'], '09:00', '10:00')
      expect(slots[0].day).toBe('MONDAY')
    })
  })

  describe('isTimeInRange', () => {
    const range: TimeRange = { start: '09:00', end: '17:00' }

    it('should return true for time within range', () => {
      expect(isTimeInRange('12:00', range)).toBe(true)
    })

    it('should return true for time at start of range', () => {
      expect(isTimeInRange('09:00', range)).toBe(true)
    })

    it('should return true for time at end of range', () => {
      expect(isTimeInRange('17:00', range)).toBe(true)
    })

    it('should return false for time before range', () => {
      expect(isTimeInRange('08:00', range)).toBe(false)
    })

    it('should return false for time after range', () => {
      expect(isTimeInRange('18:00', range)).toBe(false)
    })
  })

  describe('calculateDuration', () => {
    it('should calculate duration in minutes', () => {
      expect(calculateDuration('09:00', '10:30')).toBe(90)
    })

    it('should handle full hour durations', () => {
      expect(calculateDuration('09:00', '10:00')).toBe(60)
    })

    it('should handle multi-hour durations', () => {
      expect(calculateDuration('09:00', '12:00')).toBe(180)
    })
  })

  describe('areBackToBack', () => {
    it('should detect back-to-back slots', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'MONDAY', startTime: '10:00', endTime: '11:00' }
      expect(areBackToBack(slot1, slot2)).toBe(true)
    })

    it('should detect back-to-back in either order', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '10:00', endTime: '11:00' }
      const slot2: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      expect(areBackToBack(slot1, slot2)).toBe(true)
    })

    it('should not detect slots with gap as back-to-back', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'MONDAY', startTime: '10:30', endTime: '11:30' }
      expect(areBackToBack(slot1, slot2)).toBe(false)
    })

    it('should not detect different days as back-to-back', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'TUESDAY', startTime: '10:00', endTime: '11:00' }
      expect(areBackToBack(slot1, slot2)).toBe(false)
    })
  })

  describe('calculateWeeklyHours', () => {
    it('should calculate total weekly hours', () => {
      const slots: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
        { day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' },
        { day: 'FRIDAY', startTime: '09:00', endTime: '10:00' },
      ]
      expect(calculateWeeklyHours(slots)).toBe(3)
    })

    it('should handle mixed durations', () => {
      const slots: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:00', endTime: '10:30' }, // 90 min
        { day: 'WEDNESDAY', startTime: '14:00', endTime: '15:00' }, // 60 min
      ]
      expect(calculateWeeklyHours(slots)).toBe(2.5)
    })

    it('should return 0 for empty array', () => {
      expect(calculateWeeklyHours([])).toBe(0)
    })
  })

  describe('groupSlotsByDay', () => {
    it('should group slots by day', () => {
      const slots: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
        { day: 'MONDAY', startTime: '14:00', endTime: '15:00' },
        { day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' },
      ]

      const grouped = groupSlotsByDay(slots)

      expect(grouped.get('MONDAY')).toHaveLength(2)
      expect(grouped.get('WEDNESDAY')).toHaveLength(1)
      expect(grouped.has('TUESDAY')).toBe(false)
    })
  })

  describe('calculateGap', () => {
    it('should calculate gap between slots on same day', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'MONDAY', startTime: '10:30', endTime: '11:30' }
      expect(calculateGap(slot1, slot2)).toBe(30)
    })

    it('should return -1 for different days', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'TUESDAY', startTime: '10:30', endTime: '11:30' }
      expect(calculateGap(slot1, slot2)).toBe(-1)
    })

    it('should return 0 for back-to-back slots', () => {
      const slot1: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      const slot2: TimeSlot = { day: 'MONDAY', startTime: '10:00', endTime: '11:00' }
      expect(calculateGap(slot1, slot2)).toBe(0)
    })
  })

  describe('findEarliestStart', () => {
    it('should find earliest start time', () => {
      const slots: TimeSlot[] = [
        { day: 'MONDAY', startTime: '10:00', endTime: '11:00' },
        { day: 'WEDNESDAY', startTime: '08:00', endTime: '09:00' },
        { day: 'FRIDAY', startTime: '09:00', endTime: '10:00' },
      ]
      expect(findEarliestStart(slots)).toBe('08:00')
    })

    it('should return null for empty array', () => {
      expect(findEarliestStart([])).toBeNull()
    })
  })

  describe('findLatestEnd', () => {
    it('should find latest end time', () => {
      const slots: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
        { day: 'WEDNESDAY', startTime: '14:00', endTime: '17:00' },
        { day: 'FRIDAY', startTime: '09:00', endTime: '12:00' },
      ]
      expect(findLatestEnd(slots)).toBe('17:00')
    })

    it('should return null for empty array', () => {
      expect(findLatestEnd([])).toBeNull()
    })
  })

  describe('hasCommonDays', () => {
    it('should detect common days', () => {
      expect(hasCommonDays(['MONDAY', 'WEDNESDAY'], ['WEDNESDAY', 'FRIDAY'])).toBe(true)
    })

    it('should not detect common days when none exist', () => {
      expect(hasCommonDays(['MONDAY', 'WEDNESDAY'], ['TUESDAY', 'THURSDAY'])).toBe(false)
    })

    it('should handle case insensitivity', () => {
      expect(hasCommonDays(['monday'], ['MONDAY'])).toBe(true)
    })

    it('should return false for empty arrays', () => {
      expect(hasCommonDays([], ['MONDAY'])).toBe(false)
      expect(hasCommonDays(['MONDAY'], [])).toBe(false)
    })
  })

  describe('formatTimeSlot', () => {
    it('should format time slot as string', () => {
      const slot: TimeSlot = { day: 'MONDAY', startTime: '09:00', endTime: '10:00' }
      expect(formatTimeSlot(slot)).toBe('MONDAY 09:00-10:00')
    })
  })

  describe('formatTimeSlots', () => {
    it('should format multiple time slots grouped by day', () => {
      const slots: TimeSlot[] = [
        { day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
        { day: 'MONDAY', startTime: '14:00', endTime: '15:00' },
        { day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' },
      ]

      const formatted = formatTimeSlots(slots)
      expect(formatted).toContain('MONDAY')
      expect(formatted).toContain('WEDNESDAY')
      expect(formatted).toContain('09:00-10:00')
    })
  })
})
