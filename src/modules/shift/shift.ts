import { ShiftCurve, ShiftCurveConfiguration } from '@tps/configuration.types'

export type ShiftChannel = 'HUE' | 'CHROMA'

export const SHIFT_CURVES: ReadonlyArray<ShiftCurve> = [
  'LINEAR',
  'HYPERBOLA',
  'FREE',
]

export const SHIFT_NEUTRAL: Record<ShiftChannel, number> = {
  HUE: 0,
  CHROMA: 100,
}

export const SHIFT_BOUNDS: Record<ShiftChannel, [number, number]> = {
  HUE: [-180, 180],
  CHROMA: [0, 200],
}

const lerp = (from: number, to: number, ratio: number): number =>
  from + (to - from) * ratio

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const makeDefaultShift = (
  channel: ShiftChannel
): ShiftCurveConfiguration => {
  const neutral = SHIFT_NEUTRAL[channel]

  return {
    min: neutral,
    max: neutral,
    value: neutral,
    curve: 'LINEAR',
  }
}

export const normalizeShift = (
  raw: unknown,
  channel: ShiftChannel
): ShiftCurveConfiguration => {
  if (typeof raw === 'number' && Number.isFinite(raw))
    return {
      min: raw,
      max: raw,
      value: raw,
      curve: 'LINEAR',
    }

  if (raw === null || typeof raw !== 'object') return makeDefaultShift(channel)

  const shift = raw as Partial<ShiftCurveConfiguration>
  const fallback = makeDefaultShift(channel)
  const value =
    typeof shift.value === 'number' && Number.isFinite(shift.value)
      ? shift.value
      : fallback.value

  return {
    min:
      typeof shift.min === 'number' && Number.isFinite(shift.min)
        ? shift.min
        : value,
    max:
      typeof shift.max === 'number' && Number.isFinite(shift.max)
        ? shift.max
        : value,
    value: value,
    curve:
      shift.curve !== undefined && SHIFT_CURVES.includes(shift.curve)
        ? shift.curve
        : fallback.curve,
  }
}

export const areShiftsEqual = (
  a: ShiftCurveConfiguration,
  b: ShiftCurveConfiguration
): boolean =>
  a.min === b.min &&
  a.max === b.max &&
  a.value === b.value &&
  a.curve === b.curve

export const resolveShift = (
  shift: ShiftCurveConfiguration,
  lightness: number,
  range: { min: number; max: number },
  channel: ShiftChannel
): number => {
  if (shift.curve === 'LINEAR') return shift.value

  const neutral = SHIFT_NEUTRAL[channel]
  const [lowerBound, upperBound] = SHIFT_BOUNDS[channel]

  if (range.max === range.min) return neutral

  const middle = (range.min + range.max) / 2
  const stop = clamp(lightness, range.min, range.max)
  const shifted =
    stop <= middle
      ? lerp(shift.min, neutral, (stop - range.min) / (middle - range.min))
      : lerp(neutral, shift.max, (stop - middle) / (range.max - middle))

  return clamp(shifted, lowerBound, upperBound)
}
