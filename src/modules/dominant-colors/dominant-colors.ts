import chroma from 'chroma-js'
import {
  Channel,
  HexModel,
  ImageData,
  DominantColorResult,
  DominantColorsOptions,
} from '@tps/color.types'

export default class DominantColors {
  private imageData: ImageData
  private colorCount: number
  private maxIterations: number
  private tolerance: number
  private skipTransparent: boolean

  constructor({
    imageData,
    colorCount = 5,
    maxIterations = 50,
    tolerance = 0.01,
    skipTransparent = true,
  }: {
    imageData: ImageData
  } & DominantColorsOptions) {
    this.imageData = imageData
    this.colorCount = colorCount
    this.maxIterations = maxIterations
    this.tolerance = tolerance
    this.skipTransparent = skipTransparent
  }

  extractDominantColors = (): DominantColorResult[] => {
    const pixels = this.extractPixels()
    if (pixels.length === 0) return []

    const clusters = this.performKMeans(pixels)
    const results = this.calculateColorFrequencies(pixels, clusters)

    return results.sort((a, b) => b.percentage - a.percentage)
  }

  private extractPixels = (): Channel[] => {
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
}
