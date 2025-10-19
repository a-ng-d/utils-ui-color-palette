import chroma from 'chroma-js'
import {
  Channel,
  HexModel,
  HarmonyType,
  ColorHarmonyResult,
  ColorHarmonyOptions,
} from '@tps/color.types'

export default class ColorHarmony {
  private baseColor: Channel
  private analogousSpread: number
  private returnFormat: 'rgb' | 'hex' | 'both'

  constructor({
    baseColor = [255, 0, 0],
    analogousSpread = 30,
    returnFormat = 'both',
  }: {
    baseColor?: Channel
  } & ColorHarmonyOptions) {
    this.baseColor = baseColor
    this.analogousSpread = analogousSpread
    this.returnFormat = returnFormat
  }

  generateAnalogous = (): ColorHarmonyResult => {
    const hsl = chroma(this.baseColor).hsl()
    const baseHue = hsl[0] || 0

    const colors = [
      this.baseColor,
      this.hueToRgb(
        this.normalizeHue(baseHue - this.analogousSpread),
        hsl[1],
        hsl[2]
      ),
      this.hueToRgb(
        this.normalizeHue(baseHue + this.analogousSpread),
        hsl[1],
        hsl[2]
      ),
    ]

    return this.formatResult('ANALOGOUS', colors)
  }

  generateComplementary = (): ColorHarmonyResult => {
    const hsl = chroma(this.baseColor).hsl()
    const baseHue = hsl[0] || 0

    const colors = [
      this.baseColor,
      this.hueToRgb(this.normalizeHue(baseHue + 180), hsl[1], hsl[2]),
    ]

    return this.formatResult('COMPLEMENTARY', colors)
  }

  generateTriadic = (): ColorHarmonyResult => {
    const hsl = chroma(this.baseColor).hsl()
    const baseHue = hsl[0] || 0

    const colors = [
      this.baseColor,
      this.hueToRgb(this.normalizeHue(baseHue + 120), hsl[1], hsl[2]),
      this.hueToRgb(this.normalizeHue(baseHue + 240), hsl[1], hsl[2]),
    ]

    return this.formatResult('TRIADIC', colors)
  }

  generateTetradic = (): ColorHarmonyResult => {
    const hsl = chroma(this.baseColor).hsl()
    const baseHue = hsl[0] || 0

    const colors = [
      this.baseColor,
      this.hueToRgb(this.normalizeHue(baseHue + 90), hsl[1], hsl[2]),
      this.hueToRgb(this.normalizeHue(baseHue + 180), hsl[1], hsl[2]),
      this.hueToRgb(this.normalizeHue(baseHue + 270), hsl[1], hsl[2]),
    ]

    return this.formatResult('TETRADIC', colors)
  }

  generateSquare = (): ColorHarmonyResult => {
    const hsl = chroma(this.baseColor).hsl()
    const baseHue = hsl[0] || 0

    const colors = [
      this.baseColor,
      this.hueToRgb(this.normalizeHue(baseHue + 90), hsl[1], hsl[2]),
      this.hueToRgb(this.normalizeHue(baseHue + 180), hsl[1], hsl[2]),
      this.hueToRgb(this.normalizeHue(baseHue + 270), hsl[1], hsl[2]),
    ]

    return this.formatResult('SQUARE', colors)
  }

  generateHarmony = (type: HarmonyType): ColorHarmonyResult => {
    switch (type) {
      case 'ANALOGOUS':
        return this.generateAnalogous()
      case 'COMPLEMENTARY':
        return this.generateComplementary()
      case 'TRIADIC':
        return this.generateTriadic()
      case 'TETRADIC':
        return this.generateTetradic()
      case 'SQUARE':
        return this.generateSquare()
      default:
        throw new Error(`Unknown harmony type: ${type}`)
    }
  }

  getAllHarmonies = (): ColorHarmonyResult[] => {
    return [
      this.generateAnalogous(),
      this.generateComplementary(),
      this.generateTriadic(),
      this.generateTetradic(),
      this.generateSquare(),
    ]
  }

  private normalizeHue = (hue: number): number => {
    while (hue < 0) hue += 360
    while (hue >= 360) hue -= 360
    return hue
  }

  private hueToRgb = (
    hue: number,
    saturation: number,
    lightness: number
  ): Channel => {
    const rgb = chroma.hsl(hue, saturation, lightness).rgb()
    return [Math.round(rgb[0]), Math.round(rgb[1]), Math.round(rgb[2])]
  }

  private formatResult = (
    type: HarmonyType,
    colors: Channel[]
  ): ColorHarmonyResult => {
    const cleanColors = colors.map(
      (color) =>
        [
          Math.round(color[0]),
          Math.round(color[1]),
          Math.round(color[2]),
        ] as Channel
    )

    const hexColors = cleanColors.map(
      (color) => chroma.rgb(color[0], color[1], color[2]).hex() as HexModel
    )

    return {
      type,
      baseColor: [
        Math.round(this.baseColor[0]),
        Math.round(this.baseColor[1]),
        Math.round(this.baseColor[2]),
      ],
      baseHex: chroma
        .rgb(this.baseColor[0], this.baseColor[1], this.baseColor[2])
        .hex() as HexModel,
      colors: cleanColors,
      hexColors,
    }
  }

  setBaseColor = (color: Channel): void => {
    this.baseColor = color
  }

  setAnalogousSpread = (spread: number): void => {
    this.analogousSpread = Math.max(1, Math.min(spread, 180))
  }

  updateOptions = (options: Partial<ColorHarmonyOptions>): void => {
    if (options.analogousSpread !== undefined) {
      this.setAnalogousSpread(options.analogousSpread)
    }
    if (options.returnFormat !== undefined) {
      this.returnFormat = options.returnFormat
    }
  }

  getOptions = (): ColorHarmonyOptions => ({
    analogousSpread: this.analogousSpread,
    returnFormat: this.returnFormat,
  })
}
