import chroma from 'chroma-js'
import {
  Channel,
  HexModel,
  ImageData,
  DominantColorResult,
  DominantColorsOptions,
} from '@tps/color.types'

interface DominantColorsInput extends DominantColorsOptions {
  imageData?: ImageData
  arrayBuffer?: ArrayBuffer
  maxImageSize?: number
}

export default class DominantColors {
  private imageData: ImageData | null = null
  private colorCount: number
  private maxIterations: number
  private tolerance: number
  private skipTransparent: boolean
  private maxImageSize: number

  constructor({
    imageData,
    arrayBuffer,
    colorCount = 5,
    maxIterations = 50,
    tolerance = 0.01,
    skipTransparent = true,
    maxImageSize = 200,
  }: DominantColorsInput) {
    if (!imageData && !arrayBuffer) {
      throw new Error('Either imageData or arrayBuffer must be provided')
    }

    this.imageData = imageData || null
    this.colorCount = colorCount
    this.maxIterations = maxIterations
    this.tolerance = tolerance
    this.skipTransparent = skipTransparent
    this.maxImageSize = maxImageSize

    if (arrayBuffer && !imageData) {
      this.arrayBuffer = arrayBuffer
    }
  }

  private arrayBuffer?: ArrayBuffer

  private async ensureImageData(): Promise<void> {
    if (!this.imageData && this.arrayBuffer) {
      this.imageData = await this.decodeImageFromArrayBuffer(this.arrayBuffer)
    }
  }

  private async decodeImageFromArrayBuffer(
    arrayBuffer: ArrayBuffer
  ): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalWindow = globalThis as any

      if (!globalWindow.document || !globalWindow.Image || !globalWindow.URL) {
        reject(new Error('Browser environment with Canvas API required'))
        return
      }

      const blob = new globalWindow.Blob([arrayBuffer])
      const url = globalWindow.URL.createObjectURL(blob)
      const img = new globalWindow.Image()

      img.onload = () => {
        try {
          const canvas = globalWindow.document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            throw new Error('Failed to create canvas context')
          }

          // Resize image if needed
          const aspectRatio = img.width / img.height
          let targetWidth = img.width
          let targetHeight = img.height

          if (Math.max(img.width, img.height) > this.maxImageSize) {
            if (img.width > img.height) {
              targetWidth = this.maxImageSize
              targetHeight = Math.round(this.maxImageSize / aspectRatio)
            } else {
              targetHeight = this.maxImageSize
              targetWidth = Math.round(this.maxImageSize * aspectRatio)
            }
          }

          canvas.width = targetWidth
          canvas.height = targetHeight

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

          const browserImageData = ctx.getImageData(
            0,
            0,
            targetWidth,
            targetHeight
          )

          const imageData: ImageData = {
            data: new Uint8ClampedArray(browserImageData.data),
            width: browserImageData.width,
            height: browserImageData.height,
          }

          globalWindow.URL.revokeObjectURL(url)
          resolve(imageData)
        } catch (error) {
          globalWindow.URL.revokeObjectURL(url)
          reject(error)
        }
      }

      img.onerror = () => {
        globalWindow.URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /** Synchronous extraction for ImageData (backward compatibility) */
  extractDominantColors = (): DominantColorResult[] => {
    if (!this.imageData) {
      throw new Error(
        'No image data available. Use extractDominantColorsAsync() for ArrayBuffer.'
      )
    }

    const pixels = this.extractPixels()
    if (pixels.length === 0) return []

    const clusters = this.performKMeans(pixels)
    const results = this.calculateColorFrequencies(pixels, clusters)

    return results.sort((a, b) => b.percentage - a.percentage)
  }

  /** Asynchronous extraction for ArrayBuffer */
  extractDominantColorsAsync = async (): Promise<DominantColorResult[]> => {
    await this.ensureImageData()

    if (!this.imageData) {
      throw new Error(
        'No image data available. Ensure ArrayBuffer was successfully decoded.'
      )
    }

    const pixels = this.extractPixels()
    if (pixels.length === 0) return []

    const clusters = this.performKMeans(pixels)
    const results = this.calculateColorFrequencies(pixels, clusters)

    return results.sort((a, b) => b.percentage - a.percentage)
  }

  private extractPixels = (): Channel[] => {
    if (!this.imageData) {
      throw new Error('No image data available')
    }

    const pixels: Channel[] = []
    const data = this.imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if (this.skipTransparent && a < 128) continue

      pixels.push([r, g, b])
    }

    return pixels
  }

  private performKMeans = (pixels: Channel[]): Channel[] => {
    let centroids = this.initializeCentroids(pixels)
    let prevCentroids: Channel[] = []
    let iteration = 0

    while (
      iteration < this.maxIterations &&
      !this.hasConverged(centroids, prevCentroids)
    ) {
      prevCentroids = centroids.map((c) => [...c] as Channel)

      const clusters: Channel[][] = Array.from(
        { length: this.colorCount },
        () => []
      )

      pixels.forEach((pixel) => {
        const closestIndex = this.findClosestCentroid(pixel, centroids)
        clusters[closestIndex].push(pixel)
      })

      centroids = clusters.map((cluster) => {
        if (cluster.length === 0)
          return prevCentroids[centroids.indexOf(centroids[0])]
        return this.calculateCentroid(cluster)
      })

      iteration++
    }

    return centroids
  }

  private initializeCentroids = (pixels: Channel[]): Channel[] => {
    const centroids: Channel[] = []

    // K-means++ initialization
    centroids.push(pixels[Math.floor(Math.random() * pixels.length)])

    for (let i = 1; i < this.colorCount; i++) {
      const distances = pixels.map((pixel) => {
        const minDistance = Math.min(
          ...centroids.map((centroid) =>
            this.calculateDistance(pixel, centroid)
          )
        )
        return minDistance * minDistance
      })

      const totalDistance = distances.reduce((sum, d) => sum + d, 0)
      const threshold = Math.random() * totalDistance

      let cumulative = 0
      for (let j = 0; j < pixels.length; j++) {
        cumulative += distances[j]
        if (cumulative >= threshold) {
          centroids.push(pixels[j])
          break
        }
      }
    }

    return centroids
  }

  private findClosestCentroid = (
    pixel: Channel,
    centroids: Channel[]
  ): number => {
    let minDistance = Infinity
    let closestIndex = 0

    centroids.forEach((centroid, index) => {
      const distance = this.calculateDistance(pixel, centroid)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })

    return closestIndex
  }

  private calculateDistance = (color1: Channel, color2: Channel): number => {
    const [r1, g1, b1] = color1
    const [r2, g2, b2] = color2

    return Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    )
  }

  private calculateCentroid = (cluster: Channel[]): Channel => {
    const sum = cluster.reduce(
      (acc, pixel) => [acc[0] + pixel[0], acc[1] + pixel[1], acc[2] + pixel[2]],
      [0, 0, 0] as Channel
    )

    return [
      Math.round(sum[0] / cluster.length),
      Math.round(sum[1] / cluster.length),
      Math.round(sum[2] / cluster.length),
    ]
  }

  private hasConverged = (
    centroids: Channel[],
    prevCentroids: Channel[]
  ): boolean => {
    if (prevCentroids.length === 0) return false

    return centroids.every((centroid, index) => {
      const distance = this.calculateDistance(centroid, prevCentroids[index])
      return distance < this.tolerance
    })
  }

  private calculateColorFrequencies = (
    pixels: Channel[],
    centroids: Channel[]
  ): DominantColorResult[] => {
    const counts = new Array(centroids.length).fill(0)

    pixels.forEach((pixel) => {
      const closestIndex = this.findClosestCentroid(pixel, centroids)
      counts[closestIndex]++
    })

    const totalPixels = pixels.length

    return centroids.map((centroid, index) => ({
      color: centroid,
      hex: chroma.rgb(centroid[0], centroid[1], centroid[2]).hex() as HexModel,
      count: counts[index],
      percentage: parseFloat(((counts[index] / totalPixels) * 100).toFixed(2)),
    }))
  }

  setColorCount = (count: number): void => {
    this.colorCount = Math.max(1, Math.min(count, 20))
  }

  updateOptions = (options: Partial<DominantColorsOptions>): void => {
    if (options.colorCount !== undefined) this.setColorCount(options.colorCount)
    if (options.maxIterations !== undefined)
      this.maxIterations = options.maxIterations
    if (options.tolerance !== undefined) this.tolerance = options.tolerance
    if (options.skipTransparent !== undefined)
      this.skipTransparent = options.skipTransparent
  }

  getOptions = (): DominantColorsOptions => ({
    colorCount: this.colorCount,
    maxIterations: this.maxIterations,
    tolerance: this.tolerance,
    skipTransparent: this.skipTransparent,
  })

  /** Static method for simplified ArrayBuffer usage */
  static async fromArrayBuffer(
    arrayBuffer: ArrayBuffer,
    options: Omit<DominantColorsInput, 'arrayBuffer' | 'imageData'> = {}
  ): Promise<DominantColorResult[]> {
    const decoder = new DominantColors({
      arrayBuffer,
      ...options,
    })

    return decoder.extractDominantColorsAsync()
  }

  /** Simplified static method for quick color extraction */
  static async extract(
    arrayBuffer: ArrayBuffer,
    colorCount: number = 5
  ): Promise<DominantColorResult[]> {
    return this.fromArrayBuffer(arrayBuffer, { colorCount })
  }
}
