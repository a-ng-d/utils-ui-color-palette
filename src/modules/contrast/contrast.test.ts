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
})
