import chroma from 'chroma-js'
import { PaletteData, PaletteDataShadeItem } from '@tps/data.types'
import { ColorSpaceConfiguration } from '@tps/configuration.types'
import { Case } from '@a_ng_d/figmug-utils'

const makeScssVariables = (
  paletteData: PaletteData,
  colorSpace: ColorSpaceConfiguration
) => {
  const workingThemes =
      paletteData.themes.filter((theme) => theme.type === 'custom theme')
        .length === 0
        ? paletteData.themes.filter((theme) => theme.type === 'default theme')
        : paletteData.themes.filter((theme) => theme.type === 'custom theme'),
    scss: Array<string> = []

  const setValueAccordingToColorSpace = (shade: PaletteDataShadeItem) => {
    if (shade.hsl[0] === null) shade.hsl[0] = 0
    if (shade.lch[2] === null) shade.lch[2] = 0

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

  workingThemes.forEach((theme) => {
    const rowScss: Array<string> = []

    if (theme.type === 'custom theme') {
      rowScss.push(`// ${theme.name} mode`)
      rowScss.push(`@mixin ${new Case(theme.name).doCamelCase()}-mode {`)
    }

    theme.colors.forEach((color) => {
      rowScss.push(`// ${color.name}`)
      color.shades.reverse().forEach((shade) => {
        const source = color.shades.find((c) => c.type === 'source color')
        const variableName = `$${new Case(color.name).doKebabCase()}-${shade.name}`

        if (source) {
          if (theme.type === 'custom theme') {
            rowScss.push(
              `  ${variableName}: ${shade.isTransparent ? setValueAccordingToAlpha(shade, source) : setValueAccordingToColorSpace(shade)};`
            )
          } else {
            rowScss.push(
              `${variableName}: ${shade.isTransparent ? setValueAccordingToAlpha(shade, source) : setValueAccordingToColorSpace(shade)};`
            )
          }
        }
      })
      rowScss.push('')
    })

    if (theme.type === 'custom theme') {
      rowScss.push(`}`)
    }

    scss.push(rowScss.join('\n'))
  })

  scss.push(`
// Color modes map
$modes: (`)

  workingThemes
    .filter((theme) => theme.type === 'custom theme')
    .forEach((theme, index, array) => {
      const themeName = new Case(theme.name).doKebabCase()
      scss.push(
        `  '${themeName}': ${new Case(theme.name).doCamelCase()}-mode${index < array.length - 1 ? ',' : ''}`
      )
    })

  scss.push(`);

// Mode application mixin
@mixin with-color-mode() {
  @content;
  
  @each $mode, $mixin in $modes {
    .mode-#{$mode} & {
      @include #{$mixin};
      @content($mode);
    }
  }
}`)

  return scss.join('\n\n')
}

export default makeScssVariables
