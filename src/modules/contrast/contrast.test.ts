import { describe, it, expect } from 'vitest'
import Contrast from './contrast'
import { Channel, HexModel } from '@tps/color.types'

describe('Contrast', () => {
  const backgroundColor: Channel = [255, 255, 255] // White
  const textColor: HexModel = '#000000' // Black

  it('should create an instance with default values', () => {
    const contrast = new Contrast({})
    expect(contrast).toBeDefined()
  })

  it('should calculate WCAG contrast correctly', () => {
    const contrast = new Contrast({
      backgroundColor,
      textColor,
    })

    const wcagContrast = contrast.getWCAGContrast()
    expect(wcagContrast).toBeGreaterThan(0)
    expect(typeof wcagContrast).toBe('number')
  })

  it('should calculate APCA contrast correctly', () => {
    const contrast = new Contrast({
      backgroundColor,
      textColor,
    })

    const apcaContrast = contrast.getAPCAContrast()
    expect(apcaContrast).toBeGreaterThan(0)
    expect(typeof apcaContrast).toBe('number')
  })

  it('should determine WCAG score correctly', () => {
    const contrast = new Contrast({
      backgroundColor,
      textColor,
    })

    const score = contrast.getWCAGScore()
    expect(['A', 'AA', 'AAA']).toContain(score)
  })

  it('should return correct score colors', () => {
    const contrast = new Contrast({
      backgroundColor,
      textColor,
    })

    const wcagColor = contrast.getWCAGScoreColor()
    expect(wcagColor).toHaveProperty('r')
    expect(wcagColor).toHaveProperty('g')
    expect(wcagColor).toHaveProperty('b')

    const apcaColor = contrast.getAPCAScoreColor()
    expect(apcaColor).toHaveProperty('r')
    expect(apcaColor).toHaveProperty('g')
    expect(apcaColor).toHaveProperty('b')
  })

  it('should return minimum font sizes based on APCA contrast', () => {
    const contrast = new Contrast({
      backgroundColor,
      textColor,
    })

    const fontSizes = contrast.getMinFontSizes()
    expect(Array.isArray(fontSizes)).toBe(true)
  })

  it('should determine recommended usage correctly', () => {
    const contrast = new Contrast({
      backgroundColor,
      textColor,
    })

    const usage = contrast.getRecommendedUsage()
    expect([
      'FLUENT_TEXT',
      'CONTENT_TEXT',
      'BODY_TEXT',
      'HEADLINES',
      'SPOT_TEXT',
      'NON_TEXT',
      'AVOID',
      'UNKNOWN',
    ]).toContain(usage)
  })

  it('should calculate contrast ratio for given lightness', () => {
    const contrast = new Contrast({
      backgroundColor,
      textColor,
    })

    const ratio = contrast.getContrastRatioForLightness(50)
    expect(typeof ratio).toBe('number')
    expect(ratio).toBeGreaterThan(0)
  })

  it('should calculate lightness for target contrast ratio', () => {
    const contrast = new Contrast({
      backgroundColor,
      textColor,
    })

    const lightness = contrast.getLightnessForContrastRatio(4.5)
    expect(typeof lightness).toBe('number')
    expect(lightness).toBeGreaterThanOrEqual(0)
    expect(lightness).toBeLessThanOrEqual(100)
  })

  it('should handle extreme contrast ratios', () => {
    const contrast = new Contrast({
      backgroundColor: [0, 0, 0],
      textColor: '#FFFFFF',
    })

    const highContrastRatio = contrast.getWCAGContrast()
    expect(highContrastRatio).toBeGreaterThan(20)

    contrast.getLightnessForContrastRatio(21, 0.1)
    expect(contrast.getRecommendedUsage()).toBe('FLUENT_TEXT')
  })

  it('should handle edge cases in WCAG contrast calculation', () => {
    const darkContrast = new Contrast({
      backgroundColor: [0, 0, 0],
      textColor: '#000000'
    })
    expect(darkContrast.getWCAGContrast()).toBe(1)

    const brightContrast = new Contrast({
      backgroundColor: [255, 255, 255],
      textColor: '#FFFFFF'
    })
    expect(brightContrast.getWCAGContrast()).toBe(1)
  })

  it('should handle edge cases in APCA contrast calculation', () => {
    const edgeCases: {
      bg: Channel
      text: HexModel
      expected: number
    }[] = [
      { bg: [0, 0, 0], text: '#000000', expected: 0 },
      { bg: [255, 255, 255], text: '#FFFFFF', expected: 0 },
      { bg: [128, 128, 128], text: '#808080', expected: 0 }
    ]

    edgeCases.forEach(({ bg, text, expected }) => {
      const contrast = new Contrast({
        backgroundColor: bg,
        textColor: text
      })
      expect(contrast.getAPCAContrast()).toBe(expected)
    })
  })

  it('should handle invalid color values', () => {
    const invalidCases: {
      bg: Channel
      text: HexModel
    }[] = [
      { bg: [256, 0, 0], text: '#000000' },
      { bg: [0, -1, 0], text: '#000000' },
      { bg: [0, 256, 0], text: '#000000' },
      { bg: [0, 0, -1], text: '#000000' },
      { bg: [0, 0, 256], text: '#000000' }
    ]

    invalidCases.forEach(({ bg, text }) => {
      const contrast = new Contrast({
        backgroundColor: bg,
        textColor: text
      })
      expect(() => contrast.getWCAGContrast()).not.toThrow()
      expect(() => contrast.getAPCAContrast()).not.toThrow()
    })
  })

  it('should handle all WCAG score cases', () => {
    const testCases: {
      bg: Channel
      text: HexModel
      expected: 'A' | 'AA' | 'AAA'
    }[] = [
      { bg: [0, 0, 0], text: '#FFFFFF', expected: 'AAA' }, // High contrast
      { bg: [100, 100, 100], text: '#FFFFFF', expected: 'AA' }, // Medium contrast
      { bg: [200, 200, 200], text: '#FFFFFF', expected: 'A' }, // Low contrast
    ]

    testCases.forEach(({ bg, text, expected }) => {
      const contrast = new Contrast({ backgroundColor: bg, textColor: text })
      expect(contrast.getWCAGScore()).toBe(expected)
    })
  })

  it('should handle all recommended usage cases', () => {
    const testCases = [
      { level: 95, expected: 'FLUENT_TEXT' },
      { level: 80, expected: 'CONTENT_TEXT' },
      { level: 65, expected: 'BODY_TEXT' },
      { level: 50, expected: 'HEADLINES' },
      { level: 35, expected: 'SPOT_TEXT' },
      { level: 20, expected: 'NON_TEXT' },
      { level: 10, expected: 'AVOID' }
    ]

    const contrast = new Contrast({ backgroundColor, textColor })
    
    // Mock getAPCAContrast pour tester chaque niveau
    testCases.forEach(({ level, expected }) => {
      const originalMethod = contrast.getAPCAContrast
      contrast.getAPCAContrast = () => level
      expect(contrast.getRecommendedUsage()).toBe(expected)
      contrast.getAPCAContrast = originalMethod
    })
  })

  it('should handle precision in getLightnessForContrastRatio', () => {
    const contrast = new Contrast({ backgroundColor, textColor })
    
    const testCases = [
      { ratio: 4.5, precision: 0.1 },
      { ratio: 7, precision: 0.01 },
      { ratio: 3, precision: 1 }
    ]

    testCases.forEach(({ ratio, precision }) => {
      const lightness = contrast.getLightnessForContrastRatio(ratio, precision)
      expect(lightness).toBeGreaterThanOrEqual(0)
      expect(lightness).toBeLessThanOrEqual(100)
    })
  })
})
