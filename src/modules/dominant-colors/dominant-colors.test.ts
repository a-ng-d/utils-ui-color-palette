import { describe, it, expect, beforeEach } from 'vitest'
import { ImageData, Channel } from '@tps/color.types'
import DominantColors from './dominant-colors'

// Mock image data helper functions
const createMockImageData = (
  colors: Channel[],
  width = 10,
  height = 10
): ImageData => {
  const totalPixels = width * height
  const data = new Uint8ClampedArray(totalPixels * 4)

  for (let i = 0; i < totalPixels; i++) {
    const colorIndex = i % colors.length
    const color = colors[colorIndex]
    const dataIndex = i * 4

    data[dataIndex] = color[0] // R
    data[dataIndex + 1] = color[1] // G
    data[dataIndex + 2] = color[2] // B
    data[dataIndex + 3] = 255 // A
  }

  return { data, width, height }
}

const createSolidColorImageData = (
  color: Channel,
  width = 10,
  height = 10
): ImageData => {
  return createMockImageData([color], width, height)
}

describe('DominantColors', () => {
  let mockImageData: ImageData
  let dominantColors: DominantColors

  beforeEach(() => {
    // Create a simple 10x10 image with red pixels
    mockImageData = createSolidColorImageData([255, 0, 0])
    dominantColors = new DominantColors({
      imageData: mockImageData,
      colorCount: 3,
    })
  })

  describe('Constructor and basic functionality', () => {
    it('should create an instance with default values', () => {
      const instance = new DominantColors({
        imageData: mockImageData,
      })
      expect(instance).toBeDefined()

      const options = instance.getOptions()
      expect(options.colorCount).toBe(5)
      expect(options.maxIterations).toBe(50)
      expect(options.tolerance).toBe(0.01)
      expect(options.skipTransparent).toBe(true)
    })

    it('should create an instance with custom options', () => {
      const instance = new DominantColors({
        imageData: mockImageData,
        colorCount: 8,
        maxIterations: 100,
        tolerance: 0.05,
        skipTransparent: false,
      })

      const options = instance.getOptions()
      expect(options.colorCount).toBe(8)
      expect(options.maxIterations).toBe(100)
      expect(options.tolerance).toBe(0.05)
      expect(options.skipTransparent).toBe(false)
    })
  })

  describe('Dominant color extraction', () => {
    it('should extract dominant colors from a solid color image', () => {
      const results = dominantColors.extractDominantColors()

      expect(results.length).toBeGreaterThan(0)
      expect(results[0]).toMatchObject({
        color: expect.arrayContaining([
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
        ]),
        hex: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
        percentage: expect.any(Number),
        count: expect.any(Number),
      })

      // The most dominant color should be close to red
      const dominantColor = results[0]
      expect(dominantColor.color[0]).toBeGreaterThan(200) // High red component
      expect(dominantColor.percentage).toBeGreaterThan(30) // Should be a significant percentage
    })

    it('should extract multiple colors from a multi-colored image', () => {
      const multiColorImageData = createMockImageData(
        [
          [255, 0, 0], // Red
          [0, 255, 0], // Green
          [0, 0, 255], // Blue
        ],
        6,
        6
      )

      const instance = new DominantColors({
        imageData: multiColorImageData,
        colorCount: 3,
      })

      const results = instance.extractDominantColors()

      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(3)

      // Results should be sorted by percentage (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].percentage).toBeGreaterThanOrEqual(
          results[i].percentage
        )
      }

      // All percentages should sum to approximately 100%
      const totalPercentage = results.reduce(
        (sum, result) => sum + result.percentage,
        0
      )
      expect(totalPercentage).toBeCloseTo(100, 0)
    })

    it('should handle empty image data', () => {
      const emptyImageData: ImageData = {
        data: new Uint8ClampedArray(0),
        width: 0,
        height: 0,
      }

      const instance = new DominantColors({
        imageData: emptyImageData,
      })

      const results = instance.extractDominantColors()
      expect(results).toHaveLength(0)
    })

    it('should skip transparent pixels when requested', () => {
      const data = new Uint8ClampedArray(16) // 4 pixels
      // First pixel: red, opaque
      data[0] = 255
      data[1] = 0
      data[2] = 0
      data[3] = 255
      // Second pixel: green, transparent
      data[4] = 0
      data[5] = 255
      data[6] = 0
      data[7] = 0
      // Third pixel: blue, opaque
      data[8] = 0
      data[9] = 0
      data[10] = 255
      data[11] = 255
      // Fourth pixel: yellow, semi-transparent
      data[12] = 255
      data[13] = 255
      data[14] = 0
      data[15] = 100

      const transparentImageData: ImageData = { data, width: 2, height: 2 }

      const instance = new DominantColors({
        imageData: transparentImageData,
        colorCount: 3,
        skipTransparent: true,
      })

      const results = instance.extractDominantColors()

      // Should only process opaque pixels (red and blue)
      expect(results.length).toBeGreaterThan(0)

      // Total count should be less than 4 (since transparent pixels are skipped)
      const totalCount = results.reduce((sum, result) => sum + result.count, 0)
      expect(totalCount).toBeLessThan(4)
    })
  })

  describe('Color count management', () => {
    it('should respect the color count parameter', () => {
      const multiColorImageData = createMockImageData(
        [
          [255, 0, 0], // Red
          [0, 255, 0], // Green
          [0, 0, 255], // Blue
          [255, 255, 0], // Yellow
          [255, 0, 255], // Magenta
        ],
        10,
        10
      )

      const instance = new DominantColors({
        imageData: multiColorImageData,
        colorCount: 2,
      })

      const results = instance.extractDominantColors()
      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should update color count correctly', () => {
      dominantColors.setColorCount(7)
      expect(dominantColors.getOptions().colorCount).toBe(7)

      // Test boundaries
      dominantColors.setColorCount(0)
      expect(dominantColors.getOptions().colorCount).toBe(1) // Minimum

      dominantColors.setColorCount(25)
      expect(dominantColors.getOptions().colorCount).toBe(20) // Maximum
    })
  })

  describe('Options management', () => {
    it('should update options correctly', () => {
      const newOptions = {
        colorCount: 6,
        maxIterations: 75,
        tolerance: 0.02,
        skipTransparent: false,
      }

      dominantColors.updateOptions(newOptions)

      const updatedOptions = dominantColors.getOptions()
      expect(updatedOptions.colorCount).toBe(6)
      expect(updatedOptions.maxIterations).toBe(75)
      expect(updatedOptions.tolerance).toBe(0.02)
      expect(updatedOptions.skipTransparent).toBe(false)
    })

    it('should update partial options correctly', () => {
      const originalOptions = dominantColors.getOptions()

      dominantColors.updateOptions({ colorCount: 8 })

      const updatedOptions = dominantColors.getOptions()
      expect(updatedOptions.colorCount).toBe(8)
      expect(updatedOptions.maxIterations).toBe(originalOptions.maxIterations)
      expect(updatedOptions.tolerance).toBe(originalOptions.tolerance)
      expect(updatedOptions.skipTransparent).toBe(
        originalOptions.skipTransparent
      )
    })
  })

  describe('Color format validation', () => {
    it('should return valid hex colors', () => {
      const results = dominantColors.extractDominantColors()

      results.forEach((result) => {
        expect(result.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(result.color).toHaveLength(3)
        result.color.forEach((component) => {
          expect(component).toBeGreaterThanOrEqual(0)
          expect(component).toBeLessThanOrEqual(255)
          expect(Number.isInteger(component)).toBe(true)
        })
      })
    })

    it('should return valid percentages and counts', () => {
      const results = dominantColors.extractDominantColors()

      results.forEach((result) => {
        expect(result.percentage).toBeGreaterThanOrEqual(0)
        expect(result.percentage).toBeLessThanOrEqual(100)
        expect(result.count).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(result.count)).toBe(true)
      })
    })
  })
})
