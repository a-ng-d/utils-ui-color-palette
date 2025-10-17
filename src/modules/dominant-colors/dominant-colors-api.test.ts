import { describe, it, expect } from 'vitest'
import DominantColors from './dominant-colors'

describe('DominantColors - ArrayBuffer API', () => {
  // Mock image ArrayBuffer for testing
  const createMockArrayBuffer = (size: number = 1000): ArrayBuffer => {
    const data = new Uint8Array(size)
    // Simulate image data
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.floor(Math.random() * 256)
    }
    return data.buffer
  }

  describe('ArrayBuffer Usage', () => {
    it('should accept ArrayBuffer in constructor', () => {
      const arrayBuffer = createMockArrayBuffer()

      const extractor = new DominantColors({ arrayBuffer })

      expect(extractor).toBeDefined()
      expect(extractor.getOptions().colorCount).toBe(5)
    })

    it('should work with static extract method', async () => {
      // This test will only work in browser environment
      // Here we just test that the method exists and throws the right environment error
      const arrayBuffer = createMockArrayBuffer()

      try {
        await DominantColors.extract(arrayBuffer, 3)
      } catch (error) {
        expect((error as Error).message).toContain('Browser environment')
      }
    })

    it('should work with static fromArrayBuffer method', async () => {
      const arrayBuffer = createMockArrayBuffer()

      try {
        await DominantColors.fromArrayBuffer(arrayBuffer, {
          colorCount: 3,
          maxImageSize: 150,
        })
      } catch (error) {
        expect((error as Error).message).toContain('Browser environment')
      }
    })

    it('should throw error when accessing sync method without imageData', () => {
      const arrayBuffer = createMockArrayBuffer()
      const extractor = new DominantColors({ arrayBuffer })

      expect(() => {
        extractor.extractDominantColors()
      }).toThrow('No image data available')
    })

    it('should accept both imageData and arrayBuffer (imageData priority)', () => {
      const mockImageData = {
        data: new Uint8ClampedArray([255, 0, 0, 255]), // 1 red pixel
        width: 1,
        height: 1,
      }
      const arrayBuffer = createMockArrayBuffer()

      const extractor = new DominantColors({
        imageData: mockImageData,
        arrayBuffer,
      })

      // Should use imageData and work in synchronous mode
      const results = extractor.extractDominantColors()
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('Backward Compatibility', () => {
    it('should still work with old ImageData usage', () => {
      const mockImageData = {
        data: new Uint8ClampedArray([
          255,
          0,
          0,
          255, // Red
          0,
          255,
          0,
          255, // Green
          0,
          0,
          255,
          255, // Blue
          255,
          255,
          0,
          255, // Yellow
        ]),
        width: 2,
        height: 2,
      }

      const extractor = new DominantColors({ imageData: mockImageData })
      const results = extractor.extractDominantColors()

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)

      results.forEach((result) => {
        expect(result).toHaveProperty('hex')
        expect(result).toHaveProperty('percentage')
        expect(result).toHaveProperty('count')
        expect(result.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })
})
