import { Case } from '@unoff/utils'
import { PaletteDataThemeItem } from '@tps/data.types'

export interface DtcgResolverThemeFiles {
  theme: PaletteDataThemeItem
  primitivesFilename: string
  semanticsFilename?: string
}

const makeDtcgResolver = (
  paletteName: string,
  paletteDescription: string,
  themeFiles: Array<DtcgResolverThemeFiles>
): string => {
  const slug = (name: string) => new Case(name).doKebabCase()

  const contexts: Record<string, Array<{ $ref: string }>> = {}
  themeFiles.forEach(({ theme, primitivesFilename, semanticsFilename }) => {
    const refs: Array<{ $ref: string }> = [{ $ref: `./${primitivesFilename}` }]
    if (semanticsFilename) refs.push({ $ref: `./${semanticsFilename}` })
    contexts[slug(theme.name)] = refs
  })

  const resolver = {
    $schema: 'https://www.designtokens.org/schemas/2025.10/resolver.json',
    version: '2025.10',
    name: paletteName,
    description: paletteDescription,
    modifiers: {
      'color-mode': {
        contexts,
        default: slug(themeFiles[0].theme.name),
      },
    },
    resolutionOrder: [{ $ref: '#/modifiers/color-mode' }],
  }

  return JSON.stringify(resolver, null, 2)
}

export default makeDtcgResolver
