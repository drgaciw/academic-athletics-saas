/**
 * Thresholds Tests
 * Tests for alert threshold configurations and metric status determination
 */

import {
  DEFAULT_THRESHOLDS,
  METRIC_BENCHMARKS,
  determineMetricStatus,
  calculateTrend,
} from '../lib/thresholds'

describe('Default Thresholds', () => {
  describe('GPA Thresholds', () => {
    it('should have correct critical threshold', () => {
      expect(DEFAULT_THRESHOLDS.gpa.critical).toBe(1.8)
    })

    it('should have correct high threshold', () => {
      expect(DEFAULT_THRESHOLDS.gpa.high).toBe(2.0)
    })

    it('should have correct medium threshold', () => {
      expect(DEFAULT_THRESHOLDS.gpa.medium).toBe(2.3)
    })

    it('should have thresholds in ascending order', () => {
      expect(DEFAULT_THRESHOLDS.gpa.critical).toBeLessThan(DEFAULT_THRESHOLDS.gpa.high)
      expect(DEFAULT_THRESHOLDS.gpa.high).toBeLessThan(DEFAULT_THRESHOLDS.gpa.medium)
    })
  })

  describe('Attendance Thresholds', () => {
    it('should have correct critical threshold', () => {
      expect(DEFAULT_THRESHOLDS.attendance.critical).toBe(60)
    })

    it('should have correct high threshold', () => {
      expect(DEFAULT_THRESHOLDS.attendance.high).toBe(75)
    })

    it('should have correct medium threshold', () => {
      expect(DEFAULT_THRESHOLDS.attendance.medium).toBe(85)
    })

    it('should have thresholds in ascending order', () => {
      expect(DEFAULT_THRESHOLDS.attendance.critical).toBeLessThan(DEFAULT_THRESHOLDS.attendance.high)
      expect(DEFAULT_THRESHOLDS.attendance.high).toBeLessThan(DEFAULT_THRESHOLDS.attendance.medium)
    })
  })

  describe('Credit Hours Thresholds', () => {
    it('should have correct critical threshold', () => {
      expect(DEFAULT_THRESHOLDS.creditHours.critical).toBe(6)
    })

    it('should have correct high threshold', () => {
      expect(DEFAULT_THRESHOLDS.creditHours.high).toBe(9)
    })

    it('should have thresholds in ascending order', () => {
      expect(DEFAULT_THRESHOLDS.creditHours.critical).toBeLessThan(DEFAULT_THRESHOLDS.creditHours.high)
    })
  })
})

describe('Metric Benchmarks', () => {
  describe('GPA Benchmarks', () => {
    it('should have excellent threshold', () => {
      expect(METRIC_BENCHMARKS.gpa.excellent).toBe(3.5)
    })

    it('should have good threshold', () => {
      expect(METRIC_BENCHMARKS.gpa.good).toBe(3.0)
    })

    it('should have satisfactory threshold', () => {
      expect(METRIC_BENCHMARKS.gpa.satisfactory).toBe(2.5)
    })

    it('should have at-risk threshold', () => {
      expect(METRIC_BENCHMARKS.gpa.atRisk).toBe(2.0)
    })
  })

  describe('Attendance Benchmarks', () => {
    it('should have excellent threshold', () => {
      expect(METRIC_BENCHMARKS.attendance.excellent).toBe(95)
    })

    it('should have good threshold', () => {
      expect(METRIC_BENCHMARKS.attendance.good).toBe(90)
    })

    it('should have satisfactory threshold', () => {
      expect(METRIC_BENCHMARKS.attendance.satisfactory).toBe(85)
    })

    it('should have at-risk threshold', () => {
      expect(METRIC_BENCHMARKS.attendance.atRisk).toBe(75)
    })
  })

  describe('Credit Hours Benchmarks', () => {
    it('should have full-time threshold', () => {
      expect(METRIC_BENCHMARKS.creditHours.fullTime).toBe(12)
    })

    it('should have recommended threshold', () => {
      expect(METRIC_BENCHMARKS.creditHours.recommended).toBe(15)
    })

    it('should have part-time threshold', () => {
      expect(METRIC_BENCHMARKS.creditHours.partTime).toBe(9)
    })
  })

  describe('Study Hours Benchmarks', () => {
    it('should have recommended hours', () => {
      expect(METRIC_BENCHMARKS.studyHours.recommended).toBe(20)
    })

    it('should have minimum hours', () => {
      expect(METRIC_BENCHMARKS.studyHours.minimum).toBe(10)
    })
  })
})

describe('determineMetricStatus', () => {
  describe('GPA Status', () => {
    it('should return ABOVE_TARGET for excellent GPA', () => {
      expect(determineMetricStatus('GPA', 3.8)).toBe('ABOVE_TARGET')
      expect(determineMetricStatus('GPA', 3.5)).toBe('ABOVE_TARGET')
    })

    it('should return ON_TARGET for good GPA', () => {
      expect(determineMetricStatus('GPA', 3.2)).toBe('ON_TARGET')
      expect(determineMetricStatus('GPA', 3.0)).toBe('ON_TARGET')
    })

    it('should return BELOW_TARGET for satisfactory GPA', () => {
      expect(determineMetricStatus('GPA', 2.7)).toBe('BELOW_TARGET')
      expect(determineMetricStatus('GPA', 2.5)).toBe('BELOW_TARGET')
    })

    it('should return AT_RISK for low GPA', () => {
      expect(determineMetricStatus('GPA', 2.0)).toBe('AT_RISK')
      expect(determineMetricStatus('GPA', 1.5)).toBe('AT_RISK')
    })

    it('should handle edge cases at boundaries', () => {
      expect(determineMetricStatus('GPA', 3.5)).toBe('ABOVE_TARGET')
      expect(determineMetricStatus('GPA', 3.0)).toBe('ON_TARGET')
      expect(determineMetricStatus('GPA', 2.5)).toBe('BELOW_TARGET')
    })
  })

  describe('Attendance Status', () => {
    it('should return ABOVE_TARGET for excellent attendance', () => {
      expect(determineMetricStatus('ATTENDANCE', 98)).toBe('ABOVE_TARGET')
      expect(determineMetricStatus('ATTENDANCE', 95)).toBe('ABOVE_TARGET')
    })

    it('should return ON_TARGET for good attendance', () => {
      expect(determineMetricStatus('ATTENDANCE', 92)).toBe('ON_TARGET')
      expect(determineMetricStatus('ATTENDANCE', 90)).toBe('ON_TARGET')
    })

    it('should return BELOW_TARGET for satisfactory attendance', () => {
      expect(determineMetricStatus('ATTENDANCE', 87)).toBe('BELOW_TARGET')
      expect(determineMetricStatus('ATTENDANCE', 85)).toBe('BELOW_TARGET')
    })

    it('should return AT_RISK for low attendance', () => {
      expect(determineMetricStatus('ATTENDANCE', 75)).toBe('AT_RISK')
      expect(determineMetricStatus('ATTENDANCE', 60)).toBe('AT_RISK')
    })
  })

  describe('Credit Hours Status', () => {
    it('should return ABOVE_TARGET for recommended credit hours', () => {
      expect(determineMetricStatus('CREDIT_HOURS', 18)).toBe('ABOVE_TARGET')
      expect(determineMetricStatus('CREDIT_HOURS', 15)).toBe('ABOVE_TARGET')
    })

    it('should return ON_TARGET for full-time credit hours', () => {
      expect(determineMetricStatus('CREDIT_HOURS', 14)).toBe('ON_TARGET')
      expect(determineMetricStatus('CREDIT_HOURS', 12)).toBe('ON_TARGET')
    })

    it('should return BELOW_TARGET for part-time credit hours', () => {
      expect(determineMetricStatus('CREDIT_HOURS', 10)).toBe('BELOW_TARGET')
      expect(determineMetricStatus('CREDIT_HOURS', 9)).toBe('BELOW_TARGET')
    })

    it('should return AT_RISK for very low credit hours', () => {
      expect(determineMetricStatus('CREDIT_HOURS', 6)).toBe('AT_RISK')
      expect(determineMetricStatus('CREDIT_HOURS', 3)).toBe('AT_RISK')
    })
  })
})

describe('calculateTrend', () => {
  describe('Improving Trend', () => {
    it('should detect significant improvement', () => {
      expect(calculateTrend(3.5, 3.0)).toBe('IMPROVING')
    })

    it('should detect large improvement', () => {
      expect(calculateTrend(100, 50)).toBe('IMPROVING')
    })
  })

  describe('Declining Trend', () => {
    it('should detect significant decline', () => {
      expect(calculateTrend(2.5, 3.0)).toBe('DECLINING')
    })

    it('should detect large decline', () => {
      expect(calculateTrend(50, 100)).toBe('DECLINING')
    })
  })

  describe('Stable Trend', () => {
    it('should detect stability within default threshold', () => {
      expect(calculateTrend(3.0, 3.0)).toBe('STABLE')
    })

    it('should detect minimal change as stable', () => {
      expect(calculateTrend(3.0, 2.997)).toBe('STABLE')
    })
  })

  describe('Custom Threshold', () => {
    it('should use custom threshold for detection', () => {
      // 5% change with 10% threshold should be stable
      expect(calculateTrend(105, 100, 10)).toBe('STABLE')
    })

    it('should detect change beyond custom threshold', () => {
      // 15% change with 10% threshold should be improving
      expect(calculateTrend(115, 100, 10)).toBe('IMPROVING')
    })

    it('should detect decline beyond custom threshold', () => {
      // -15% change with 10% threshold should be declining
      expect(calculateTrend(85, 100, 10)).toBe('DECLINING')
    })
  })

  describe('Edge Cases', () => {
    it('should handle equal values', () => {
      expect(calculateTrend(100, 100)).toBe('STABLE')
    })

    it('should handle very small changes', () => {
      expect(calculateTrend(100.001, 100)).toBe('STABLE')
    })

    it('should handle zero threshold', () => {
      expect(calculateTrend(101, 100, 0)).toBe('IMPROVING')
    })
  })
})

describe('Threshold Validation', () => {
  it('should ensure all thresholds are numbers', () => {
    expect(typeof DEFAULT_THRESHOLDS.gpa.critical).toBe('number')
    expect(typeof DEFAULT_THRESHOLDS.gpa.high).toBe('number')
    expect(typeof DEFAULT_THRESHOLDS.gpa.medium).toBe('number')
    expect(typeof DEFAULT_THRESHOLDS.attendance.critical).toBe('number')
    expect(typeof DEFAULT_THRESHOLDS.attendance.high).toBe('number')
    expect(typeof DEFAULT_THRESHOLDS.attendance.medium).toBe('number')
    expect(typeof DEFAULT_THRESHOLDS.creditHours.critical).toBe('number')
    expect(typeof DEFAULT_THRESHOLDS.creditHours.high).toBe('number')
  })

  it('should have non-negative thresholds', () => {
    expect(DEFAULT_THRESHOLDS.gpa.critical).toBeGreaterThan(0)
    expect(DEFAULT_THRESHOLDS.attendance.critical).toBeGreaterThan(0)
    expect(DEFAULT_THRESHOLDS.creditHours.critical).toBeGreaterThan(0)
  })

  it('should have GPA thresholds within valid range (0-4)', () => {
    expect(DEFAULT_THRESHOLDS.gpa.critical).toBeLessThanOrEqual(4)
    expect(DEFAULT_THRESHOLDS.gpa.high).toBeLessThanOrEqual(4)
    expect(DEFAULT_THRESHOLDS.gpa.medium).toBeLessThanOrEqual(4)
  })

  it('should have attendance thresholds within valid range (0-100)', () => {
    expect(DEFAULT_THRESHOLDS.attendance.critical).toBeLessThanOrEqual(100)
    expect(DEFAULT_THRESHOLDS.attendance.high).toBeLessThanOrEqual(100)
    expect(DEFAULT_THRESHOLDS.attendance.medium).toBeLessThanOrEqual(100)
  })
})
