import { describe, it, expect } from 'vitest'
import chroma from 'chroma-js'
import {
  ColorSpaceConfiguration,
  ShiftCurveConfiguration,
} from '@tps/configuration.types'
import { Channel } from '@tps/color.types'
import { makeDefaultShift, SHIFT_BOUNDS } from '@modules/shift/shift'
import Preview from './preview'

const SUPPORTED_COLOR_SPACES: ColorSpaceConfiguration[] = [
  'LCH',
  'OKLCH',
  'LAB',
  'OKLAB',
  'HSL',
  'HSV',
  'HSLUV',
]

describe('Preview#sampleShift', () => {
  const sourceColor: Channel = [200, 60, 60]

  it('should return the requested number of stops, spanning offsets 0 to 1', () => {
    const stops = new Preview({ sourceColor }).sampleShift('HUE', {
      steps: 8,
    })

    expect(stops).toHaveLength(8)
    expect(stops[0].offset).toBe(0)
    expect(stops[stops.length - 1].offset).toBe(1)
  })

  it('should return a single stop at offset 0 when steps is 1', () => {
    const stops = new Preview({ sourceColor }).sampleShift('CHROMA', {
      steps: 1,
    })

    expect(stops).toHaveLength(1)
    expect(stops[0].offset).toBe(0)
  })

  it('should return a valid hex color for every stop', () => {
    const stops = new Preview({ sourceColor }).sampleShift('HUE')
    const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/

    stops.forEach((stop) => expect(stop.color).toMatch(hexRegex))
  })

  it('should keep the neutral point close to the source color for CHROMA', () => {
    const stops = new Preview({
      sourceColor,
      algorithmVersion: 'v1',
    }).sampleShift('CHROMA', { steps: 3 })
    const neutralStop = stops[1]

    const distance = chroma.distance(
      neutralStop.color,
      chroma(sourceColor).hex()
    )
    expect(distance).toBeLessThan(5)
  })

  it('should flag stops as out of gamut when pushed to extreme chroma', () => {
    const stops = new Preview({ sourceColor, colorSpace: 'LCH' }).sampleShift(
      'CHROMA',
      { steps: 6 }
    )

    expect(stops.some((stop) => stop.outOfGamut)).toBe(true)
  })

  it('should not flag a neutral/near-neutral gray as out of gamut', () => {
    const gray: Channel = [128, 128, 128]
    const stops = new Preview({ sourceColor: gray }).sampleShift('HUE', {
      steps: 6,
    })

    expect(stops.every((stop) => stop.outOfGamut === false)).toBe(true)
  })

  it('should span the documented HUE and CHROMA bounds', () => {
    expect(SHIFT_BOUNDS.HUE).toEqual([-180, 180])
    expect(SHIFT_BOUNDS.CHROMA).toEqual([0, 200])
  })

  it('should not throw for every supported color space', () => {
    SUPPORTED_COLOR_SPACES.forEach((colorSpace) => {
      expect(() =>
        new Preview({ sourceColor, colorSpace }).sampleShift('HUE', {
          steps: 4,
        })
      ).not.toThrow()
    })
  })

  it('should hold the other channel at neutral when otherShift/lightnessRange are not provided', () => {
    const stops = new Preview({
      sourceColor,
      algorithmVersion: 'v1',
    }).sampleShift('CHROMA', { steps: 3 })

    const distance = chroma.distance(stops[1].color, chroma(sourceColor).hex())
    expect(distance).toBeLessThan(5)
  })

  it('should resolve the other channel real shift when otherShift and lightnessRange are provided', () => {
    const range = { min: 10, max: 90 }
    const hueShift: ShiftCurveConfiguration = {
      min: 45,
      max: 45,
      value: 45,
      curve: 'LINEAR',
    }

    const withHueShift = new Preview({ sourceColor }).sampleShift('CHROMA', {
      steps: 3,
      otherShift: hueShift,
      lightnessRange: range,
    })
    const withoutHueShift = new Preview({ sourceColor }).sampleShift('CHROMA', {
      steps: 3,
    })

    expect(withHueShift[1].color).not.toBe(withoutHueShift[1].color)
  })

  it('should resolve the other channel real shift symmetrically for a HUE sweep', () => {
    const range = { min: 10, max: 90 }
    const chromaShift: ShiftCurveConfiguration = {
      min: 150,
      max: 150,
      value: 150,
      curve: 'LINEAR',
    }

    const withChromaShift = new Preview({ sourceColor }).sampleShift('HUE', {
      steps: 3,
      otherShift: chromaShift,
      lightnessRange: range,
    })
    const withoutChromaShift = new Preview({ sourceColor }).sampleShift('HUE', {
      steps: 3,
    })

    expect(withChromaShift[1].color).not.toBe(withoutChromaShift[1].color)
  })
})

describe('Preview.blend', () => {
  const red: Channel = [255, 0, 0]
  const blue: Channel = [0, 0, 255]

  it('should return an empty array when given no tracks', () => {
    expect(Preview.blend([])).toEqual([])
  })

  it('should return the single track unchanged when given only one', () => {
    const track = new Preview({ sourceColor: red }).sampleShift('HUE', {
      steps: 5,
    })

    expect(Preview.blend([track])).toEqual(track)
  })

  it('should preserve the offsets of the source tracks', () => {
    const trackA = new Preview({ sourceColor: red }).sampleShift('HUE', {
      steps: 5,
    })
    const trackB = new Preview({ sourceColor: blue }).sampleShift('HUE', {
      steps: 5,
    })
    const blended = Preview.blend([trackA, trackB])

    expect(blended.map((stop) => stop.offset)).toEqual(
      trackA.map((stop) => stop.offset)
    )
  })

  it('should average the color of every contributing track at each offset', () => {
    const trackA = new Preview({
      sourceColor: red,
      algorithmVersion: 'v1',
    }).sampleShift('HUE', { steps: 3 })
    const trackB = new Preview({
      sourceColor: blue,
      algorithmVersion: 'v1',
    }).sampleShift('HUE', { steps: 3 })
    const blended = Preview.blend([trackA, trackB])

    blended.forEach((stop, index) => {
      const expected = chroma
        .average([trackA[index].color, trackB[index].color])
        .hex()
      expect(stop.color).toBe(expected)
    })
  })

  it('should flag a blended stop as out of gamut if any contributor is', () => {
    const saturated = new Preview({ sourceColor: red }).sampleShift('CHROMA', {
      steps: 4,
    })
    const gray = new Preview({ sourceColor: [128, 128, 128] }).sampleShift(
      'CHROMA',
      { steps: 4 }
    )
    const blended = Preview.blend([saturated, gray])

    expect(
      blended.some(
        (stop, index) => stop.outOfGamut && saturated[index].outOfGamut
      )
    ).toBe(true)
  })
})

describe('Preview#sampleLightness', () => {
  const sourceColor: Channel = [200, 60, 60]
  const neutralShift = {
    hue: makeDefaultShift('HUE'),
    chroma: makeDefaultShift('CHROMA'),
  }
  const range = { min: 10, max: 90 }

  it('should return the requested number of stops, spanning the domain', () => {
    const stops = new Preview({ sourceColor }).sampleLightness(
      neutralShift,
      range,
      { steps: 8 }
    )

    expect(stops).toHaveLength(8)
    expect(stops[0].offset).toBe(0)
    expect(stops[stops.length - 1].offset).toBe(1)
  })

  it('should get monotonically lighter across the default 0-100 domain, from genuine black', () => {
    const stops = new Preview({ sourceColor }).sampleLightness(
      neutralShift,
      range,
      { steps: 5 }
    )
    const luminances = stops.map((stop) => chroma(stop.color).luminance())

    expect(luminances[0]).toBeLessThan(0.01)
    luminances.forEach((luminance, index) => {
      if (index > 0) expect(luminance).toBeGreaterThan(luminances[index - 1])
    })
  })

  it('should respect a custom domain', () => {
    const stops = new Preview({ sourceColor }).sampleLightness(
      neutralShift,
      range,
      { steps: 3, domain: { min: 20, max: 80 } }
    )

    expect(chroma(stops[0].color).luminance()).toBeGreaterThan(0.01)
  })

  it('should apply the configured hue/chroma shift via resolveShift, not hold it neutral', () => {
    const hueShift: ShiftCurveConfiguration = {
      min: -60,
      max: 60,
      value: 0,
      curve: 'HYPERBOLA',
    }
    const preview = new Preview({ sourceColor })
    const shifted = preview.sampleLightness(
      { hue: hueShift, chroma: neutralShift.chroma },
      range,
      { steps: 5 }
    )
    const neutral = preview.sampleLightness(neutralShift, range, {
      steps: 5,
    })

    expect(shifted[1].color).not.toBe(neutral[1].color)
  })

  it('should not throw for every supported color space', () => {
    SUPPORTED_COLOR_SPACES.forEach((colorSpace) => {
      expect(() =>
        new Preview({ sourceColor, colorSpace }).sampleLightness(
          neutralShift,
          range,
          { steps: 4 }
        )
      ).not.toThrow()
    })
  })

  it('should flag stops as out of gamut when the shift pushes chroma to extremes', () => {
    const chromaShift: ShiftCurveConfiguration = {
      min: 0,
      max: 200,
      value: 200,
      curve: 'LINEAR',
    }
    const stops = new Preview({ sourceColor }).sampleLightness(
      { hue: neutralShift.hue, chroma: chromaShift },
      range,
      { steps: 6 }
    )

    expect(stops.some((stop) => stop.outOfGamut)).toBe(true)
  })
})
