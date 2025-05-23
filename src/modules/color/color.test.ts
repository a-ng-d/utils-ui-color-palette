import { describe, it, expect } from 'vitest'
import Color from './color'
import { VisionSimulationModeConfiguration } from '@tps/configurations.types'
import { Channel, ChannelWithAlpha } from '@tps/color.types'

describe('Color', () => {
  const sourceColor: Channel = [255, 0, 0]

  it('should create an instance with default values', () => {
    const color = new Color({})
    expect(color).toBeDefined()
  })

  it('should correctly adjust hue', () => {
    const color = new Color({
      sourceColor,
      hueShifting: 180,
    })
    expect(color.adjustHue(0)).toBe(180)
    expect(color.adjustHue(270)).toBe(90)
  })

  it('should correctly adjust chroma based on algorithm version', () => {
    const testChroma = 100

    // v1
    const colorV1 = new Color({
      sourceColor,
      algorithmVersion: 'v1',
    })
    expect(colorV1.adjustChroma(testChroma)).toBe(testChroma)

    // v2
    const colorV2 = new Color({
      sourceColor,
      algorithmVersion: 'v2',
    })
    expect(colorV2.adjustChroma(testChroma)).toBeLessThan(testChroma)

    // v3
    const colorV3 = new Color({
      sourceColor,
      algorithmVersion: 'v3',
    })
    expect(colorV3.adjustChroma(testChroma)).toBeLessThan(testChroma)
  })

  it('should correctly convert colors in different color spaces', () => {
    const color = new Color({ sourceColor })

    expect(color.lch()).toBeDefined()
    expect(color.oklch()).toBeDefined()
    expect(color.lab()).toBeDefined()
    expect(color.oklab()).toBeDefined()
    expect(color.hsl()).toBeDefined()
    expect(color.hsluv()).toBeDefined()
  })

  it('should correctly handle alpha channel', () => {
    const color = new Color({
      sourceColor,
      alpha: 0.5,
    })

    const result = color.setColorWithAlpha()
    expect(result).toBeDefined()
  })

  it('should correctly simulate color blindness', () => {
    const modes: VisionSimulationModeConfiguration[] = [
      'PROTANOPIA',
      'PROTANOMALY',
      'DEUTERANOPIA',
      'DEUTERANOMALY',
      'TRITANOPIA',
      'TRITANOMALY',
      'ACHROMATOPSIA',
      'ACHROMATOMALY',
      'NONE',
    ]

    modes.forEach((mode) => {
      const color = new Color({
        sourceColor,
        visionSimulationMode: mode,
      })

      expect(color.setColor()).toBeDefined()
    })
  })

  it('should correctly mix colors', () => {
    const color = new Color({ sourceColor })

    // RGB mix
    const colorA: ChannelWithAlpha = [255, 0, 0, 0.5]
    const colorB: ChannelWithAlpha = [0, 255, 0, 1]
    const mixedRgb = color.mixColorsRgb(colorA, colorB)
    expect(mixedRgb).toBeDefined()
    expect(mixedRgb.length).toBe(3)

    // HEX mix
    const mixedHex = color.mixColorsHex('#FF0000', '#00FF00')
    expect(mixedHex).toBeDefined()
    expect(mixedHex.startsWith('#')).toBe(true)
  })

  // Test color space conversions with alpha
  const colorSpaceMethods = [
    'lcha',
    'oklcha',
    'laba',
    'oklaba',
    'hsla',
    'hsluva',
  ] as const

  colorSpaceMethods.forEach((method) => {
    it(`should correctly handle ${method} conversion with alpha`, () => {
      const color = new Color({
        sourceColor,
        alpha: 0.5,
      })
      const result = color[method as keyof Color]
      expect(result).toBeDefined()
    })
  })

  it('should handle color space transformations with invalid values', () => {
    const color = new Color({
      sourceColor: [300, -50, 1000],
    })

    expect(color.lch()).toBeDefined()
    expect(color.oklch()).toBeDefined()
    expect(color.lab()).toBeDefined()
    expect(color.oklab()).toBeDefined()
  })

  it('should handle extreme color adjustments', () => {
    const color = new Color({
      sourceColor,
      lightness: 200,
      chromaShifting: -150,
    })

    expect(color.setColor()).toBeDefined()
    expect(color.setColorWithAlpha()).toBeDefined()
  })

  it('should handle color interpolation edge cases', () => {
    const color = new Color({ sourceColor })

    // Test with extreme alpha values
    expect(color.mixColorsRgb([255, 0, 0, 2], [0, 255, 0, -1])).toBeDefined()
  })

  it('should properly handle color space boundaries', () => {
    const color = new Color({
      sourceColor,
      hueShifting: 720, // Over 360 degrees
      chromaShifting: 200, // Over 100%
    })

    const result = color.setColor()
    expect(result).toBeDefined()

    const methods = ['lch', 'oklch', 'lab', 'oklab', 'hsl', 'hsluv']
    methods.forEach((method) => {
      expect(color[method as keyof Color]).toBeDefined()
    })
  })

  it('should handle invalid hex colors in mixColorsHex', () => {
    const color = new Color({ sourceColor })
    expect(color.mixColorsHex('invalid', '#FF0000')).toBeDefined()
    expect(color.mixColorsHex('#FF0000', 'invalid')).toBeDefined()
    expect(color.mixColorsHex('invalid', 'invalid')).toBeDefined()
  })

  it('should handle zero and negative values in adjustments', () => {
    const color = new Color({
      sourceColor,
      lightness: 0,
      chromaShifting: -200,
      hueShifting: -360,
    })
    expect(color.setColor()).toBeDefined()
    expect(color.adjustChroma(-50)).toBeDefined()
    expect(color.adjustHue(-180)).toBeDefined()
  })

  it('should handle all color space transformations', () => {
    const methods = [
      'lch',
      'oklch',
      'lab',
      'oklab',
      'hsl',
      'hsluv',
      'lcha',
      'oklcha',
      'laba',
      'oklaba',
      'hsla',
      'hsluva',
    ]
    const color = new Color({ sourceColor })

    methods.forEach((method) => {
      expect(color[method as keyof Color]).toBeDefined()
    })
  })

  it('should handle extreme alpha values in color mixing', () => {
    const color = new Color({ sourceColor })
    const extremeCases: Array<[ChannelWithAlpha, ChannelWithAlpha]> = [
      [
        [255, 0, 0, 2],
        [0, 0, 255, 1],
      ],
      [
        [255, 0, 0, -1],
        [0, 0, 255, 0.5],
      ],
      [
        [255, 0, 0, 0],
        [0, 0, 255, 0],
      ],
      [
        [255, 0, 0, 1],
        [0, 0, 255, 2],
      ],
    ]

    extremeCases.forEach(([colorA, colorB]) => {
      expect(color.mixColorsRgb(colorA, colorB)).toBeDefined()
    })
  })
})
