import { PaletteDataShadeItem, PaletteDataThemeItem } from '@tps/data.types'
import { ColorSpaceConfiguration } from '@tps/configuration.types'

const makeDtcgTokens = (
  colorSpace: ColorSpaceConfiguration,
  theme: PaletteDataThemeItem
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: { [key: string]: any } = {}

  const setValueAccordingToColorSpace = (shade: PaletteDataShadeItem) => {
    if (isNaN(shade.oklch[2])) shade.oklch[2] = 0

    const actions: { [action: string]: () => void } = {
      RGB: () => {
        return {
          colorSpace: 'srgb',
          components: [
            parseFloat(shade.gl[0].toFixed(3)),
            parseFloat(shade.gl[1].toFixed(3)),
            parseFloat(shade.gl[2].toFixed(3)),
          ],
          hex: shade.hex,
        }
      },
      OKLCH: () => {
        return {
          colorSpace: 'oklch',
          components: [
            parseFloat(shade.oklch[0].toFixed(3)),
            parseFloat(shade.oklch[1].toFixed(3)),
            parseFloat(shade.oklch[2].toFixed(0)),
          ],
          hex: shade.hex,
        }
      },
    }

    return actions[colorSpace ?? 'RGB']?.()
  }

  const setValueAccordingToColorSpaceAndAlpha = (
    source: PaletteDataShadeItem,
    shade: PaletteDataShadeItem
  ) => {
    if (isNaN(shade.oklch[2])) shade.oklch[2] = 0

    const actions: { [action: string]: () => void } = {
      RGB: () => {
        return {
          colorSpace: 'srgb',
          components: [
            parseFloat(source.gl[0].toFixed(3)),
            parseFloat(source.gl[1].toFixed(3)),
            parseFloat(source.gl[2].toFixed(3)),
          ],
          hex: source.hex,
          alpha: shade.alpha,
        }
      },
      OKLCH: () => {
        return {
          colorSpace: 'oklch',
          components: [
            parseFloat(source.oklch[0].toFixed(3)),
            parseFloat(source.oklch[1].toFixed(3)),
            parseFloat(source.oklch[2].toFixed(0)),
          ],
          hex: source.hex,
          alpha: shade.alpha,
        }
      },
    }

    return actions[colorSpace ?? 'RGB']?.()
  }

  theme.colors.forEach((color) => {
    const source = color.shades.find((shade) => shade.type === 'source color')

    json[color.name] = {}
    color.shades.forEach((shade) => {
      if (shade && source) {
        json[color.name][shade.name] = {
          $type: 'color',
          $value: shade.isTransparent
            ? setValueAccordingToColorSpaceAndAlpha(source, shade)
            : setValueAccordingToColorSpace(shade),
          $description:
            color.description !== ''
              ? color.description + ' - ' + shade.description
              : shade.description,
          ...(shade.textContrast && {
            $extensions: {
              'com.uicp.wcag': {
                light: {
                  score: shade.textContrast.wcag.light.score,
                  ratio: shade.textContrast.wcag.light.ratio,
                },
                dark: {
                  score: shade.textContrast.wcag.dark.score,
                  ratio: shade.textContrast.wcag.dark.ratio,
                },
              },
              'com.uicp.apca': {
                light: {
                  score: shade.textContrast.apca.light.lc,
                  recommendation:
                    shade.textContrast.apca.light.recommendedUsage,
                },
                dark: {
                  score: shade.textContrast.apca.dark.lc,
                  recommendation: shade.textContrast.apca.dark.recommendedUsage,
                },
              },
            },
          }),
        }
      }
    })
  })

  return JSON.stringify(json, null, '  ')
}

export default makeDtcgTokens
