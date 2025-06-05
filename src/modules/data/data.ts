import { Hsluv } from 'hsluv'
import chroma from 'chroma-js'
import {
  PaletteData,
  PaletteDataColorItem,
  PaletteDataThemeItem,
} from '@tps/data.types'
import {
  MetaConfiguration,
  BaseConfiguration,
  ScaleConfiguration,
  ThemeConfiguration,
  FullConfiguration,
} from '@tps/configuration.types'
import { Channel, HexModel } from '@tps/color.types'
import Color from '@modules/color/color'

export default class Data {
  private base: BaseConfiguration
  private themes: Array<ThemeConfiguration>
  private meta?: MetaConfiguration
  private paletteData: PaletteData
  private currentScale: ScaleConfiguration

  constructor({
    base,
    themes,
    meta,
  }: {
    base: BaseConfiguration
    themes: Array<ThemeConfiguration>
    meta?: MetaConfiguration
  }) {
    this.base = base
    this.themes = themes
    this.meta = meta
    this.paletteData = {
      name: base.name ?? 'UI Color Palette',
      description: base.description,
      themes: [],
      type: 'palette',
    }
    this.currentScale =
      themes.find((theme) => theme.isEnabled)?.scale ??
      ({} as ScaleConfiguration)
  }

  searchForShadeStyleId = (
    themes: Array<PaletteDataThemeItem>,
    themeId: string,
    colorId: string,
    shadeName: string
  ) => {
    const themeMatch = themes.find((theme) => theme.id === themeId),
      colorMatch =
        themeMatch === undefined
          ? undefined
          : themeMatch.colors.find((color) => color.id === colorId),
      shadeMatch =
        colorMatch === undefined
          ? undefined
          : colorMatch.shades.find((shade) => shade.name === shadeName),
      styleId = shadeMatch === undefined ? '' : shadeMatch.styleId

    return styleId === undefined ? '' : styleId
  }

  makePaletteData = (previousData?: PaletteData) => {
    this.themes.forEach((theme) => {
      const paletteDataThemeItem: PaletteDataThemeItem = {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        colors: [],
        type: theme.type,
      }
      this.base.colors.forEach((color) => {
        const scaledColors = Object.entries(theme.scale)
          .reverse()
          .map((lightness) => {
            if (color.alpha.isEnabled) {
              const foregroundColorData = new Color({
                render: 'RGB',
                sourceColor: [
                  color.rgb.r * 255,
                  color.rgb.g * 255,
                  color.rgb.b * 255,
                ],
                alpha: parseFloat((lightness[1] / 100).toFixed(2)),
                hueShifting:
                  color.hue.shift !== undefined ? color.hue.shift : 0,
                chromaShifting:
                  color.chroma.shift !== undefined ? color.chroma.shift : 100,
                algorithmVersion: this.base.algorithmVersion,
                visionSimulationMode: theme.visionSimulationMode,
              })
              const backgroundColorData = new Color({
                render: 'RGB',
                sourceColor: chroma(color.alpha.backgroundColor).rgb(),
                algorithmVersion: this.base.algorithmVersion,
                visionSimulationMode: theme.visionSimulationMode,
              })

              switch (this.base.colorSpace) {
                case 'LCH':
                  return this.base.areSourceColorsLocked
                    ? [
                        lightness,
                        foregroundColorData.setColorWithAlpha(),
                        backgroundColorData.setColorWithAlpha(),
                      ]
                    : [
                        lightness,
                        foregroundColorData.lcha(),
                        backgroundColorData.lcha(),
                      ]
                case 'OKLCH':
                  return this.base.areSourceColorsLocked
                    ? [
                        lightness,
                        foregroundColorData.setColorWithAlpha(),
                        backgroundColorData.setColorWithAlpha(),
                      ]
                    : [
                        lightness,
                        foregroundColorData.oklcha(),
                        backgroundColorData.oklcha(),
                      ]
                case 'LAB':
                  return this.base.areSourceColorsLocked
                    ? [
                        lightness,
                        foregroundColorData.setColorWithAlpha(),
                        backgroundColorData.setColorWithAlpha(),
                      ]
                    : [
                        lightness,
                        foregroundColorData.laba(),
                        backgroundColorData.laba(),
                      ]
                case 'OKLAB':
                  return this.base.areSourceColorsLocked
                    ? [
                        lightness,
                        foregroundColorData.setColorWithAlpha(),
                        backgroundColorData.setColorWithAlpha(),
                      ]
                    : [
                        lightness,
                        foregroundColorData.oklaba(),
                        backgroundColorData.oklaba(),
                      ]
                case 'HSL':
                  return this.base.areSourceColorsLocked
                    ? [
                        lightness,
                        foregroundColorData.setColorWithAlpha(),
                        backgroundColorData.setColorWithAlpha(),
                      ]
                    : [
                        lightness,
                        foregroundColorData.hsla(),
                        backgroundColorData.hsla(),
                      ]
                case 'HSLUV':
                  return this.base.areSourceColorsLocked
                    ? [
                        lightness,
                        foregroundColorData.setColorWithAlpha(),
                        backgroundColorData.setColorWithAlpha(),
                      ]
                    : [
                        lightness,
                        foregroundColorData.hsluva(),
                        backgroundColorData.hsluva(),
                      ]
                default:
                  return [lightness, [0, 0, 0], [255, 255, 255]]
              }
            } else {
              const colorData = new Color({
                render: 'RGB',
                sourceColor: [
                  color.rgb.r * 255,
                  color.rgb.g * 255,
                  color.rgb.b * 255,
                ],
                lightness: lightness[1],
                hueShifting:
                  color.hue.shift !== undefined ? color.hue.shift : 0,
                chromaShifting:
                  color.chroma.shift !== undefined ? color.chroma.shift : 100,
                algorithmVersion: this.base.algorithmVersion,
                visionSimulationMode: theme.visionSimulationMode,
              })

              switch (this.base.colorSpace) {
                case 'LCH':
                  return [lightness, colorData.lch()]
                case 'OKLCH':
                  return [lightness, colorData.oklch()]
                case 'LAB':
                  return [lightness, colorData.lab()]
                case 'OKLAB':
                  return [lightness, colorData.oklab()]
                case 'HSL':
                  return [lightness, colorData.hsl()]
                case 'HSLUV':
                  return [lightness, colorData.hsluv()]
                default:
                  return [lightness, [0, 0, 0]]
              }
            }
          })

        const paletteDataColorItem: PaletteDataColorItem = {
            id: color.id,
            name: color.name,
            description: color.description,
            shades: [],
            type: 'color',
          },
          sourceColor: Channel = [
            color.rgb.r * 255,
            color.rgb.g * 255,
            color.rgb.b * 255,
          ]

        const sourceHsluv = new Hsluv()
        sourceHsluv.rgb_r = color.rgb.r
        sourceHsluv.rgb_g = color.rgb.g
        sourceHsluv.rgb_b = color.rgb.b
        sourceHsluv.rgbToHsluv()

        paletteDataColorItem.shades.push({
          name: 'source',
          description: 'Source color',
          hex: chroma(sourceColor).hex(),
          rgb: sourceColor,
          gl: chroma(sourceColor).gl(),
          lch: chroma(sourceColor).lch(),
          oklch: chroma(sourceColor).oklch(),
          lab: chroma(sourceColor).lab(),
          oklab: chroma(sourceColor).oklab(),
          hsl: chroma(sourceColor).hsl(),
          hsluv: [
            sourceHsluv.hsluv_h,
            sourceHsluv.hsluv_s,
            sourceHsluv.hsluv_l,
          ],
          styleId: this.searchForShadeStyleId(
            previousData?.themes ?? this.paletteData.themes,
            theme.id,
            color.id,
            'source'
          ),
          type: 'source color',
        })

        const distances = scaledColors.map((shade) =>
          chroma.distance(
            chroma(sourceColor).hex(),
            chroma(shade[1] as Channel).hex(),
            'rgb'
          )
        )
        const minDistanceIndex = distances.indexOf(Math.min(...distances))

        scaledColors.forEach((scaledColor, index) => {
          const distance: number = chroma.distance(
            chroma(sourceColor).hex(),
            chroma(scaledColor[1] as Channel).hex(),
            'rgb'
          )
          const scaleName: string =
            Object.keys(this.currentScale).find(
              (key) => key === scaledColor[0][0]
            ) ?? '0'
          const newHsluv = new Hsluv()
          const simulatedSourceColorRgb = new Color({
            render: 'RGB',
            sourceColor: chroma(sourceColor).rgb(),
            visionSimulationMode: theme.visionSimulationMode,
          }).setColor() as Channel
          const simulatedSourceColorHex = new Color({
            render: 'HEX',
            sourceColor: chroma(sourceColor).rgb(),
            visionSimulationMode: theme.visionSimulationMode,
          }).setColor() as HexModel

          if (
            index === minDistanceIndex &&
            this.base.areSourceColorsLocked &&
            !color.alpha.isEnabled
          ) {
            newHsluv.rgb_r = Number(simulatedSourceColorRgb[0]) / 255
            newHsluv.rgb_g = Number(simulatedSourceColorRgb[1]) / 255
            newHsluv.rgb_b = Number(simulatedSourceColorRgb[2]) / 255
          } else {
            newHsluv.rgb_r = Number(scaledColor[1][0]) / 255
            newHsluv.rgb_g = Number(scaledColor[1][1]) / 255
            newHsluv.rgb_b = Number(scaledColor[1][2]) / 255
          }
          newHsluv.rgbToHsluv()

          paletteDataColorItem.shades.push({
            name: scaleName,
            description: `Shade color with ${typeof scaledColor[0][1] === 'number' ? scaledColor[0][1].toFixed(1) : scaledColor[0][1]}% of ${
              color.alpha.isEnabled ? 'opacity' : 'lightness'
            }`,
            hex:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled
                ? chroma(simulatedSourceColorHex).hex()
                : chroma(scaledColor[1] as Channel).hex(),
            rgb:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled
                ? chroma(simulatedSourceColorHex).rgb()
                : chroma(scaledColor[1] as Channel).rgb(),
            gl:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled
                ? chroma(simulatedSourceColorHex).gl()
                : chroma(scaledColor[1] as Channel).gl(),
            lch:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled
                ? chroma(simulatedSourceColorHex).lch()
                : chroma(scaledColor[1] as Channel).lch(),
            oklch:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled
                ? chroma(simulatedSourceColorHex).oklch()
                : chroma(scaledColor[1] as Channel).oklch(),
            lab:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled
                ? chroma(simulatedSourceColorHex).lab()
                : chroma(scaledColor[1] as Channel).lab(),
            oklab:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled
                ? chroma(simulatedSourceColorHex).oklab()
                : chroma(scaledColor[1] as Channel).oklab(),
            hsl:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled
                ? chroma(simulatedSourceColorHex).hsl()
                : chroma(scaledColor[1] as Channel).hsl(),
            hsluv: [newHsluv.hsluv_h, newHsluv.hsluv_s, newHsluv.hsluv_l],
            alpha: color.alpha.isEnabled
              ? parseFloat(((scaledColor[0][1] as number) / 100).toFixed(2))
              : undefined,
            backgroundColor:
              color.alpha.isEnabled && color.alpha.backgroundColor
                ? chroma(scaledColor[2] as Channel).rgb()
                : undefined,
            mixedColor:
              color.alpha.isEnabled && color.alpha.backgroundColor
                ? new Color({
                    visionSimulationMode: theme.visionSimulationMode,
                  }).mixColorsRgb(
                    [
                      ...(scaledColor[1] as Channel),
                      parseFloat(
                        ((scaledColor[0][1] as number) / 100).toFixed(2)
                      ),
                    ],
                    [...(scaledColor[2] as Channel), 1]
                  )
                : undefined,
            styleId: this.searchForShadeStyleId(
              previousData?.themes ?? this.paletteData.themes,
              theme.id,
              color.id,
              scaleName
            ),
            isClosestToRef: distance < 4 && !this.base.areSourceColorsLocked,
            isSourceColorLocked:
              index === minDistanceIndex &&
              this.base.areSourceColorsLocked &&
              !color.alpha.isEnabled,
            isTransparent: color.alpha.isEnabled,
            type: 'color shade',
          })
        })

        paletteDataThemeItem.colors.push(paletteDataColorItem)
      })
      this.paletteData.themes.push(paletteDataThemeItem)
    })

    return this.paletteData
  }

  makePaletteFullData = () => {
    const fullPaletteData = {
      base: this.base,
      themes: this.themes,
      meta: this.meta,
      data: this.makePaletteData(),
      type: 'UI_COLOR_PALETTE',
    } as FullConfiguration

    return fullPaletteData
  }
}
