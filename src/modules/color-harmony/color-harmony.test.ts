import { describe, it, expect, beforeEach } from 'vitest'
import { Channel, HarmonyType } from '@tps/color.types'
import ColorHarmony from './color-harmony'

describe('ColorHarmony', () => {
  let colorHarmony: ColorHarmony
  const redColor: Channel = [255, 0, 0]

  beforeEach(() => {
    colorHarmony = new ColorHarmony({
      baseColor: redColor,
    })
  })

  describe('Constructor and basic functionality', () => {
    it('should create an instance with default values', () => {
      const instance = new ColorHarmony({})
      expect(instance).toBeDefined()

      const options = instance.getOptions()
      expect(options.analogousSpread).toBe(30)
      expect(options.returnFormat).toBe('both')
    })

    it('should create an instance with custom options', () => {
      const instance = new ColorHarmony({
        baseColor: [0, 255, 0],
        analogousSpread: 45,
        returnFormat: 'hex',
      })

      const options = instance.getOptions()
      expect(options.analogousSpread).toBe(45)
      expect(options.returnFormat).toBe('hex')
    })
  })

  describe('Color harmony generation', () => {
    it('should generate analogous colors', () => {
      const result = colorHarmony.generateAnalogous()

      expect(result.type).toBe('ANALOGOUS')
      expect(result.baseColor).toEqual([255, 0, 0])
      expect(result.colors).toHaveLength(3)
      expect(result.hexColors).toHaveLength(3)
      expect(result.baseHex).toMatch(/^#[0-9A-Fa-f]{6}$/)

      result.hexColors.forEach((hex) => {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })

    it('should generate complementary colors', () => {
      const result = colorHarmony.generateComplementary()

      expect(result.type).toBe('COMPLEMENTARY')
      expect(result.colors).toHaveLength(2)
      expect(result.hexColors).toHaveLength(2)

      // First color should be the base color
      expect(result.colors[0]).toEqual([255, 0, 0])
    })

    it('should generate triadic colors', () => {
      const result = colorHarmony.generateTriadic()

      expect(result.type).toBe('TRIADIC')
      expect(result.colors).toHaveLength(3)
      expect(result.hexColors).toHaveLength(3)
      expect(result.colors[0]).toEqual([255, 0, 0])
    })

    it('should generate tetradic colors', () => {
      const result = colorHarmony.generateTetradic()

      expect(result.type).toBe('TETRADIC')
      expect(result.colors).toHaveLength(4)
      expect(result.hexColors).toHaveLength(4)
      expect(result.colors[0]).toEqual([255, 0, 0])
    })

    it('should generate square colors', () => {
      const result = colorHarmony.generateSquare()

      expect(result.type).toBe('SQUARE')
      expect(result.colors).toHaveLength(4)
      expect(result.hexColors).toHaveLength(4)
      expect(result.colors[0]).toEqual([255, 0, 0])
    })
  })

  describe('Generic harmony generation', () => {
    it('should generate harmony by type', () => {
      const types: HarmonyType[] = [
        'ANALOGOUS',
        'COMPLEMENTARY',
        'TRIADIC',
        'TETRADIC',
        'SQUARE',
      ]

      types.forEach((type) => {
        const result = colorHarmony.generateHarmony(type)
        expect(result.type).toBe(type)
        expect(result.colors.length).toBeGreaterThan(0)
        expect(result.hexColors.length).toBe(result.colors.length)
      })
    })

    it('should throw error for unknown harmony type', () => {
      expect(() => {
        colorHarmony.generateHarmony('unknown' as HarmonyType)
      }).toThrow('Unknown harmony type: unknown')
    })

    it('should generate all harmonies at once', () => {
      const allHarmonies = colorHarmony.getAllHarmonies()

      expect(allHarmonies).toHaveLength(5)

      const types = allHarmonies.map((h) => h.type)
      expect(types).toContain('ANALOGOUS')
      expect(types).toContain('COMPLEMENTARY')
      expect(types).toContain('TRIADIC')
      expect(types).toContain('TETRADIC')
      expect(types).toContain('SQUARE')
    })
  })

  describe('Color format validation', () => {
    it('should return valid RGB values', () => {
      const result = colorHarmony.generateTriadic()

      result.colors.forEach((color) => {
        expect(color).toHaveLength(3)
        color.forEach((component) => {
          expect(component).toBeGreaterThanOrEqual(0)
          expect(component).toBeLessThanOrEqual(255)
          expect(Number.isInteger(component)).toBe(true)
        })
      })
    })

    it('should return valid hex colors', () => {
      const result = colorHarmony.generateTriadic()

      result.hexColors.forEach((hex) => {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })

  describe('Hue calculations', () => {
    it('should calculate complementary hue correctly for red', () => {
      const result = colorHarmony.generateComplementary()

      // Red (0°) + 180° should give cyan-ish color
      const complementaryColor = result.colors[1]
      expect(complementaryColor[0]).toBeLessThan(complementaryColor[1]) // Less red than green
      expect(complementaryColor[0]).toBeLessThan(complementaryColor[2]) // Less red than blue
    })

    it('should maintain saturation and lightness in harmony colors', () => {
      // Test with a more saturated, lighter color
      const testColor: Channel = [255, 128, 128]
      const instance = new ColorHarmony({ baseColor: testColor })

      const result = instance.generateAnalogous()

      // All colors should have similar saturation levels
      // This is a basic check - exact values may vary due to HSL conversion
      result.colors.forEach((color) => {
        const hasHighValue = color.some((c) => c > 100)
        expect(hasHighValue).toBe(true) // Should maintain relatively high values
      })
    })
  })

  describe('Options management', () => {
    it('should update base color correctly', () => {
      const newColor: Channel = [0, 255, 0]
      colorHarmony.setBaseColor(newColor)

      const result = colorHarmony.generateComplementary()
      expect(result.baseColor).toEqual([0, 255, 0])
      expect(result.colors[0]).toEqual([0, 255, 0])
    })

    it('should update analogous spread correctly', () => {
      colorHarmony.setAnalogousSpread(60)
      expect(colorHarmony.getOptions().analogousSpread).toBe(60)

      // Test boundaries
      colorHarmony.setAnalogousSpread(0)
      expect(colorHarmony.getOptions().analogousSpread).toBe(1) // Minimum

      colorHarmony.setAnalogousSpread(200)
      expect(colorHarmony.getOptions().analogousSpread).toBe(180) // Maximum
    })

    it('should update options correctly', () => {
      const newOptions = {
        analogousSpread: 45,
        returnFormat: 'rgb' as const,
      }

      colorHarmony.updateOptions(newOptions)

      const updatedOptions = colorHarmony.getOptions()
      expect(updatedOptions.analogousSpread).toBe(45)
      expect(updatedOptions.returnFormat).toBe('rgb')
    })

    it('should update partial options correctly', () => {
      const originalOptions = colorHarmony.getOptions()

      colorHarmony.updateOptions({ analogousSpread: 90 })

      const updatedOptions = colorHarmony.getOptions()
      expect(updatedOptions.analogousSpread).toBe(90)
      expect(updatedOptions.returnFormat).toBe(originalOptions.returnFormat)
    })
  })

  describe('Analogous spread variations', () => {
    it('should generate different analogous colors with different spreads', () => {
      const spread30 = colorHarmony.generateAnalogous()

      colorHarmony.setAnalogousSpread(60)
      const spread60 = colorHarmony.generateAnalogous()

      // Colors should be different with different spreads
      expect(spread30.colors[1]).not.toEqual(spread60.colors[1])
      expect(spread30.colors[2]).not.toEqual(spread60.colors[2])
    })
  })
})
