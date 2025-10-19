export type HexModel = `#${string}` | string

export interface RgbModel {
  r: number
  g: number
  b: number
  a?: number
}

export interface HslModel {
  h: number
  s: number
  l: number
  a: number
}

export type Channel = [number, number, number]
export type ChannelWithAlpha = [number, number, number, number]

export interface ImageData {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface DominantColorResult {
  color: Channel
  hex: HexModel
  percentage: number
  count: number
}

export interface DominantColorsOptions {
  colorCount?: number
  maxIterations?: number
  tolerance?: number
  skipTransparent?: boolean
}

export type HarmonyType =
  | 'ANALOGOUS'
  | 'COMPLEMENTARY'
  | 'TRIADIC'
  | 'TETRADIC'
  | 'SQUARE'
  | 'COMPOUND'

export interface ColorHarmonyResult {
  type: HarmonyType
  baseColor: Channel
  baseHex: HexModel
  colors: Channel[]
  hexColors: HexModel[]
}

export interface ColorHarmonyOptions {
  analogousSpread?: number
  returnFormat?: 'rgb' | 'hex' | 'both'
}
