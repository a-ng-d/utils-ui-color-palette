import { APCAcontrast, fontLookupAPCA, sRGBtoY } from 'apca-w3'
import chroma from 'chroma-js'
import { Channel, HexModel, RgbModel } from '@tps/color.types'

export default class Contrast {
  private backgroundColor: Channel
  private textColor: HexModel

  constructor({
    backgroundColor = [0, 0, 0],
    textColor = '#FFFFFF',
  }: {
    backgroundColor?: Channel
    textColor?: HexModel
  }) {
    this.backgroundColor = backgroundColor
    this.textColor = textColor
  }

  getWCAGContrast = (): number => {
    return chroma.contrast(chroma(this.backgroundColor).hex(), this.textColor)
  }

  getAPCAContrast = (): number => {
    return Math.abs(
      APCAcontrast(
        sRGBtoY(chroma(this.textColor).rgb()),
        sRGBtoY(this.backgroundColor)
      ) as number
    )
  }

  getWCAGScore = (): 'A' | 'AA' | 'AAA' => {
    return this.getWCAGContrast() < 4.5
      ? 'A'
      : this.getWCAGContrast() >= 4.5 && this.getWCAGContrast() < 7
        ? 'AA'
        : 'AAA'
  }

  getWCAGScoreColor = (): RgbModel => {
    if (this.getWCAGScore() !== 'A')
      return {
        r: 0.5294117647,
        g: 0.8156862745,
        b: 0.6941176471,
      }
    else
      return {
        r: 0.8274509804,
        g: 0.7019607843,
        b: 0.7803921569,
      }
  }

  getAPCAScoreColor = (): RgbModel => {
    if (this.getRecommendedUsage() !== 'AVOID')
      return {
        r: 0.5294117647,
        g: 0.8156862745,
        b: 0.6941176471,
      }
    else
      return {
        r: 0.8274509804,
        g: 0.7019607843,
        b: 0.7803921569,
      }
  }

  getMinFontSizes = (): Array<string | number> => {
    return fontLookupAPCA(this.getAPCAContrast())
  }

  getRecommendedUsage = ():
    | 'UNKNOWN'
    | 'AVOID'
    | 'NON_TEXT'
    | 'SPOT_TEXT'
    | 'HEADLINES'
    | 'BODY_TEXT'
    | 'CONTENT_TEXT'
    | 'FLUENT_TEXT' => {
    if (this.getAPCAContrast() >= 90) return 'FLUENT_TEXT'
    if (this.getAPCAContrast() >= 75 && this.getAPCAContrast() < 90)
      return 'CONTENT_TEXT'
    if (this.getAPCAContrast() >= 60 && this.getAPCAContrast() < 75)
      return 'BODY_TEXT'
    if (this.getAPCAContrast() >= 45 && this.getAPCAContrast() < 60)
      return 'HEADLINES'
    if (this.getAPCAContrast() >= 30 && this.getAPCAContrast() < 45)
      return 'SPOT_TEXT'
    if (this.getAPCAContrast() >= 15 && this.getAPCAContrast() < 30)
      return 'NON_TEXT'
    if (this.getAPCAContrast() < 15) return 'AVOID'

    return 'UNKNOWN'
  }

  getContrastRatioForLightness = (lightness: number): number => {
    const bgColor = chroma.lch(lightness, 0, 0).rgb()
    return chroma.contrast(chroma(bgColor).hex(), this.textColor)
  }

  getLightnessForContrastRatio = (
    targetRatio: number,
    precision = 0.1
  ): number => {
    const isLightText = chroma(this.textColor).luminance() > 0.5
    let min = 0
    let max = 100
    let currentLightness = isLightText ? 20 : 80

    while (max - min > precision) {
      currentLightness = (min + max) / 2
      const currentRatio = this.getContrastRatioForLightness(currentLightness)

      if (isLightText)
        if (currentRatio < targetRatio) max = currentLightness
        else min = currentLightness
      else if (currentRatio < targetRatio) min = currentLightness
      else max = currentLightness
    }

    return currentLightness
  }
}
