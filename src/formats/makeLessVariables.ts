import chroma from 'chroma-js'
import { PaletteData, PaletteDataShadeItem } from '@tps/data.types'
import { ColorSpaceConfiguration } from '@tps/configuration.types'
import { Case } from '@a_ng_d/figmug-utils'

const makeLessVariables = (
  paletteData: PaletteData,
  colorSpace: ColorSpaceConfiguration
) => {
  const workingThemes =
      paletteData.themes.filter((theme) => theme.type === 'custom theme')
        .length === 0
        ? paletteData.themes.filter((theme) => theme.type === 'default theme')
        : paletteData.themes.filter((theme) => theme.type === 'custom theme'),
    less: Array<string> = []

  const setValueAccordingToColorSpace = (shade: PaletteDataShadeItem) => {
    if (isNaN(shade.hsl[0])) shade.hsl[0] = 0
    if (isNaN(shade.lch[2])) shade.lch[2] = 0

    const actions: { [action: string]: () => void } = {
      RGB: () =>
        `rgb(${Math.floor(shade.rgb[0])}, ${Math.floor(
          shade.rgb[1]
        )}, ${Math.floor(shade.rgb[2])})`,
      HEX: () => shade.hex,
      HSL: () =>
        `hsl(${Math.floor(shade.hsl[0])}, ${Math.floor(
          shade.hsl[1] * 100
        )}%, ${Math.floor(shade.hsl[2] * 100)}%)`,
      LCH: () =>
        `lch(${Math.floor(shade.lch[0])}%, ${Math.floor(
          shade.lch[1]
        )}, ${Math.floor(shade.lch[2])})`,
      P3: () =>
        `color(display-p3 ${shade.gl[0].toFixed(3)}, ${shade.gl[1].toFixed(
          3
        )}, ${shade.gl[2].toFixed(3)})`,
    }

    return actions[colorSpace ?? 'RGB']?.()
  }

  const setValueAccordingToAlpha = (
    shade: PaletteDataShadeItem,
    source: PaletteDataShadeItem
  ) => {
    const actions: { [action: string]: () => void } = {
      RGB: () =>
        `rgba(${Math.floor(source.rgb[0])}, ${Math.floor(
          source.rgb[1]
        )}, ${Math.floor(source.rgb[2])}, ${shade.alpha?.toFixed(2) ?? 1})`,
      HEX: () =>
        chroma(source.hex)
          .alpha(shade.alpha ?? 1)
          .hex(),
      HSL: () =>
        `hsla(${Math.floor(source.hsl[0])}, ${Math.floor(
          source.hsl[1] * 100
        )}%, ${Math.floor(source.hsl[2] * 100)}%, ${shade.alpha?.toFixed(2) ?? 1})`,
      LCH: () =>
        `lch(${Math.floor(source.lch[0])}% ${Math.floor(
          source.lch[1]
        )} ${Math.floor(source.lch[2])} / ${shade.alpha?.toFixed(2) ?? 1})`,
      P3: () =>
        `color(display-p3 ${source.gl[0].toFixed(3)}, ${source.gl[1].toFixed(
          3
        )}, ${source.gl[2].toFixed(3)}, ${shade.alpha?.toFixed(2) ?? 1})`,
    }

    return actions[colorSpace ?? 'RGB']?.()
  }

  const defaultTheme = workingThemes.find(
    (theme) => theme.type === 'default theme'
  )

  if (defaultTheme) {
    const defaultVars: Array<string> = []

    defaultTheme.colors.forEach((color) => {
      defaultVars.push(`// ${color.name}`)
      color.shades.reverse().forEach((shade) => {
        const source = color.shades.find((c) => c.type === 'source color')
        const variableName = `@${new Case(color.name).doKebabCase()}-${shade.name}`

        if (source) {
          defaultVars.push(
            `${variableName}: ${shade.isTransparent ? setValueAccordingToAlpha(shade, source) : setValueAccordingToColorSpace(shade)};`
          )
        }
      })
      defaultVars.push('')
    })

    less.push(defaultVars.join('\n'))
  }

  workingThemes
    .filter((theme) => theme.type === 'custom theme')
    .forEach((theme) => {
      const themeName = new Case(theme.name).doKebabCase()
      less.push(`
// ${theme.name} mode
#${themeName} {
  .mode() {`)

      const themeVars: Array<string> = []

      theme.colors.forEach((color) => {
        themeVars.push(`    // ${color.name}`)
        color.shades.reverse().forEach((shade) => {
          const source = color.shades.find((c) => c.type === 'source color')
          const variableName = `@${new Case(color.name).doKebabCase()}-${shade.name}`

          if (source) {
            themeVars.push(
              `    ${variableName}: ${shade.isTransparent ? setValueAccordingToAlpha(shade, source) : setValueAccordingToColorSpace(shade)};`
            )
          }
        })
        themeVars.push('')
      })

      if (themeVars.length > 0) {
        themeVars.pop()
      }

      less.push(themeVars.join('\n'))
      less.push(`  }
}`)
    })

  less.push(`
// Mode application
.apply-mode(@mode) {
  & when (@mode = default) {
    // Default mode variables are already available
  }`)

  workingThemes
    .filter((theme) => theme.type === 'custom theme')
    .forEach((theme) => {
      const themeName = new Case(theme.name).doKebabCase()
      less.push(`
  & when (@mode = ${themeName}) {
    #${themeName} > .mode();
  }`)
    })

  less.push(`}

// Mode application via HTML attribute
.with-mode(@selector) {
  @{selector} {
    @mode-content();
  }
  
  ${workingThemes
    .filter((theme) => theme.type === 'custom theme')
    .map((theme) => {
      const themeName = new Case(theme.name).doKebabCase()
      return `@{selector}[data-mode="${themeName}"] {
    #${themeName} > .mode();
    @mode-content();
  }`
    })
    .join('\n\n  ')}
}`)

  return less.join('\n\n')
}

export default makeLessVariables
