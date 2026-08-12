import { describe, it, expect } from 'vitest'
import { ShiftCurveConfiguration } from '@tps/configuration.types'
import {
  SHIFT_BOUNDS,
  SHIFT_CURVES,
  SHIFT_NEUTRAL,
  areShiftsEqual,
  makeDefaultShift,
  normalizeShift,
  resolveShift,
} from './shift'

describe('Shift', () => {
  const range = { min: 10, max: 90 }
  const middle = (range.min + range.max) / 2

  describe('makeDefaultShift', () => {
    it('should default the hue channel to a neutral linear shift', () => {
      expect(makeDefaultShift('HUE')).toEqual({
        min: 0,
        max: 0,
        value: 0,
        curve: 'LINEAR',
      })
    })

    it('should default the chroma channel to 100%', () => {
      expect(makeDefaultShift('CHROMA')).toEqual({
        min: 100,
        max: 100,
        value: 100,
        curve: 'LINEAR',
      })
    })

    it('should return a new object on every call', () => {
      expect(makeDefaultShift('HUE')).not.toBe(makeDefaultShift('HUE'))
    })
  })

  describe('normalizeShift', () => {
    it('should convert a legacy scalar into a linear shift', () => {
      expect(normalizeShift(15, 'HUE')).toEqual({
        min: 15,
        max: 15,
        value: 15,
        curve: 'LINEAR',
      })
      expect(normalizeShift(130, 'CHROMA')).toEqual({
        min: 130,
        max: 130,
        value: 130,
        curve: 'LINEAR',
      })
    })

    it('should preserve a legacy scalar of 0', () => {
      expect(normalizeShift(0, 'CHROMA').value).toBe(0)
    })

    it('should fall back to the channel default on undefined or null', () => {
      expect(normalizeShift(undefined, 'HUE')).toEqual(makeDefaultShift('HUE'))
      expect(normalizeShift(null, 'CHROMA')).toEqual(makeDefaultShift('CHROMA'))
    })

    it('should fall back to the channel default on an unsupported type', () => {
      expect(normalizeShift('15', 'HUE')).toEqual(makeDefaultShift('HUE'))
      expect(normalizeShift(NaN, 'HUE')).toEqual(makeDefaultShift('HUE'))
    })

    it('should complete a partial object from its own value', () => {
      expect(normalizeShift({ value: 12 }, 'HUE')).toEqual({
        min: 12,
        max: 12,
        value: 12,
        curve: 'LINEAR',
      })
    })

    it('should complete a partial object from the channel neutral', () => {
      expect(normalizeShift({ curve: 'FREE' }, 'CHROMA')).toEqual({
        min: 100,
        max: 100,
        value: 100,
        curve: 'FREE',
      })
    })

    it('should reject an unknown curve', () => {
      expect(
        normalizeShift({ min: -5, max: 15, value: 4, curve: 'BEZIER' }, 'HUE')
          .curve
      ).toBe('LINEAR')
    })

    it('should keep every supported curve', () => {
      SHIFT_CURVES.forEach((curve) => {
        expect(normalizeShift({ curve: curve }, 'HUE').curve).toBe(curve)
      })
    })

    it('should be idempotent', () => {
      const once = normalizeShift(
        { min: -5, max: 15, value: 4, curve: 'FREE' },
        'HUE'
      )

      expect(normalizeShift(once, 'HUE')).toEqual(once)
      expect(normalizeShift(normalizeShift(42, 'HUE'), 'HUE')).toEqual(
        normalizeShift(42, 'HUE')
      )
    })
  })

  describe('areShiftsEqual', () => {
    const shift: ShiftCurveConfiguration = {
      min: -5,
      max: 15,
      value: 4,
      curve: 'FREE',
    }

    it('should compare every field', () => {
      expect(areShiftsEqual(shift, { ...shift })).toBe(true)
      expect(areShiftsEqual(shift, { ...shift, min: -6 })).toBe(false)
      expect(areShiftsEqual(shift, { ...shift, max: 16 })).toBe(false)
      expect(areShiftsEqual(shift, { ...shift, value: 5 })).toBe(false)
      expect(areShiftsEqual(shift, { ...shift, curve: 'LINEAR' })).toBe(false)
    })
  })

  describe('resolveShift with a LINEAR curve', () => {
    const shift: ShiftCurveConfiguration = {
      min: -180,
      max: 180,
      value: 4,
      curve: 'LINEAR',
    }

    it('should apply the value on every stop, ignoring the thresholds', () => {
      expect(resolveShift(shift, range.min, range, 'HUE')).toBe(4)
      expect(resolveShift(shift, middle, range, 'HUE')).toBe(4)
      expect(resolveShift(shift, range.max, range, 'HUE')).toBe(4)
    })
  })

  describe('resolveShift with a HYPERBOLA curve', () => {
    const shift: ShiftCurveConfiguration = {
      min: -15,
      max: 15,
      value: 0,
      curve: 'HYPERBOLA',
    }

    it('should reach both mirrored thresholds at the extremities', () => {
      expect(resolveShift(shift, range.min, range, 'HUE')).toBe(-15)
      expect(resolveShift(shift, range.max, range, 'HUE')).toBe(15)
    })

    it('should be neutral at the middle of the scale', () => {
      expect(resolveShift(shift, middle, range, 'HUE')).toBe(0)
    })

    it('should interpolate symmetrically around the middle', () => {
      const dark = resolveShift(shift, 30, range, 'HUE')
      const light = resolveShift(shift, 70, range, 'HUE')

      expect(dark).toBeCloseTo(-7.5)
      expect(light).toBeCloseTo(7.5)
      expect(dark).toBeCloseTo(-light)
    })
  })

  describe('resolveShift with a FREE curve', () => {
    const shift: ShiftCurveConfiguration = {
      min: -5,
      max: 15,
      value: 0,
      curve: 'FREE',
    }

    it('should reach each threshold at its own extremity', () => {
      expect(resolveShift(shift, range.min, range, 'HUE')).toBe(-5)
      expect(resolveShift(shift, range.max, range, 'HUE')).toBe(15)
    })

    it('should cross the neutral at the middle, not where a straight line would', () => {
      expect(resolveShift(shift, middle, range, 'HUE')).toBe(0)

      // A straight -5 → 15 line would cross 0 at 30, a quarter into the scale
      expect(resolveShift(shift, 30, range, 'HUE')).toBeCloseTo(-2.5)
    })

    it('should stay monotonic across the whole scale', () => {
      const resolved = [10, 30, 50, 70, 90].map((lightness) =>
        resolveShift(shift, lightness, range, 'HUE')
      )

      resolved.forEach((value, index) => {
        if (index > 0) expect(value).toBeGreaterThan(resolved[index - 1])
      })
    })

    it('should anchor the chroma channel on 100%, not on 0', () => {
      const chromaShift: ShiftCurveConfiguration = {
        min: 46,
        max: 123,
        value: 130,
        curve: 'FREE',
      }

      expect(resolveShift(chromaShift, range.min, range, 'CHROMA')).toBe(46)
      expect(resolveShift(chromaShift, middle, range, 'CHROMA')).toBe(
        SHIFT_NEUTRAL.CHROMA
      )
      expect(resolveShift(chromaShift, range.max, range, 'CHROMA')).toBe(123)
    })
  })

  describe('resolveShift boundaries', () => {
    const shift: ShiftCurveConfiguration = {
      min: -15,
      max: 15,
      value: 0,
      curve: 'HYPERBOLA',
    }

    it('should return the neutral when the scale holds a single stop', () => {
      expect(resolveShift(shift, 50, { min: 50, max: 50 }, 'HUE')).toBe(0)
      expect(resolveShift(shift, 50, { min: 50, max: 50 }, 'CHROMA')).toBe(100)
    })

    it('should clamp a lightness falling outside the scale', () => {
      expect(resolveShift(shift, -20, range, 'HUE')).toBe(-15)
      expect(resolveShift(shift, 200, range, 'HUE')).toBe(15)
    })

    it('should clamp the resolved shift to the channel bounds', () => {
      const excessive: ShiftCurveConfiguration = {
        min: -500,
        max: 500,
        value: 0,
        curve: 'FREE',
      }

      expect(resolveShift(excessive, range.min, range, 'HUE')).toBe(
        SHIFT_BOUNDS.HUE[0]
      )
      expect(resolveShift(excessive, range.max, range, 'HUE')).toBe(
        SHIFT_BOUNDS.HUE[1]
      )
      expect(resolveShift(excessive, range.min, range, 'CHROMA')).toBe(
        SHIFT_BOUNDS.CHROMA[0]
      )
      expect(resolveShift(excessive, range.max, range, 'CHROMA')).toBe(
        SHIFT_BOUNDS.CHROMA[1]
      )
    })
  })
})
