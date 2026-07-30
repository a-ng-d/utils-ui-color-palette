import {
  SystemConfiguration,
  SystemData,
  SystemDataRef,
  SystemDataToken,
  SystemLibraryData,
  TaxonomyBinding,
  TaxonomySchema,
} from '@tps/system.types'
import { PaletteData } from '@tps/data.types'

export default class System {
  private paletteData: PaletteData
  private system: SystemConfiguration

  constructor({
    paletteData,
    system,
  }: {
    paletteData: PaletteData
    system: SystemConfiguration
  }) {
    this.paletteData = paletteData
    this.system = system
  }

  makeSystemData = (): SystemData => {
    const paths = this.computePaths(this.system.schema)
    const tokens = paths.map((path) => this.resolveToken(path))
    return {
      schema: this.system.schema,
      tokens,
      type: 'system',
    }
  }

  private computePaths = (schema: TaxonomySchema): Array<Array<string>> => {
    const groups = schema.groups
    if (groups.length === 0) return []

    return groups.reduce<Array<Array<string>>>((acc, group) => {
      if (acc.length === 0) return group.members.map((m) => [m.id])
      const next: Array<Array<string>> = []
      for (const path of acc)
        for (const member of group.members) next.push([...path, member.id])
      return next
    }, [])
  }

  private resolveToken = (path: Array<string>): SystemDataToken => {
    const groups = this.system.schema.groups
    const pathNames = path.map((memberId, i) => {
      const member = groups[i]?.members.find((m) => m.id === memberId)
      return member?.name ?? memberId
    })

    const binding = this.findBinding(path)
    const isExcluded = binding?.isExcluded ?? false

    const refs: Array<SystemDataRef> = this.paletteData.themes.map((theme) => {
      if (!binding || isExcluded) return { themeId: theme.id, shadeId: null }
      const themeRef = binding.overrides?.[theme.id] ?? binding.ref
      const parsed = this.parseRef(themeRef)
      if (!parsed) return { themeId: theme.id, shadeId: null }
      const exists = this.shadeExists(
        theme.id,
        parsed.colorId,
        parsed.shadeName
      )
      return {
        themeId: theme.id,
        shadeId: exists
          ? `${theme.id}:${parsed.colorId}:${parsed.shadeName}`
          : null,
      }
    })

    return {
      path,
      pathNames,
      description: binding?.description,
      isExcluded,
      refs,
    }
  }

  private findBinding = (path: Array<string>): TaxonomyBinding | undefined => {
    const bindings = this.system.bindings ?? []
    return bindings.find(
      (b) =>
        b.path.length === path.length &&
        b.path.every((seg, i) => seg === path[i])
    )
  }

  private parseRef = (
    ref: string
  ): { colorId: string; shadeName: string } | null => {
    const idx = ref.indexOf(':')
    if (idx === -1) return null
    const colorId = ref.slice(0, idx)
    const shadeName = ref.slice(idx + 1)
    if (!colorId || !shadeName) return null
    return { colorId, shadeName }
  }

  private shadeExists = (
    themeId: string,
    colorId: string,
    shadeName: string
  ): boolean => {
    const theme = this.paletteData.themes.find((t) => t.id === themeId)
    if (!theme) return false
    const color = theme.colors.find((c) => c.id === colorId)
    if (!color) return false
    return color.shades.some((s) => s.name === shadeName)
  }

  makeSystemLibraryData = (
    options?: Array<
      | 'collection_id'
      | 'mode_id'
      | 'variable_id'
      | 'style_id'
      | 'catalog_id'
      | 'set_id'
      | 'token_id'
      | 'description'
    >,
    previousData?: Array<SystemLibraryData>
  ) => {
    const systemData = this.makeSystemData()

    const systemLibraryData: Array<SystemLibraryData> =
      systemData.tokens.flatMap((token) =>
        token.refs.map((ref) => {
          const generatedId = `${ref.themeId}:${token.path.join('>')}`
          const previousItem = previousData?.find(
            (item) => item.id === generatedId
          )

          return {
            id: generatedId,
            path: token.path,
            pathNames: token.pathNames,
            themeId: ref.themeId,
            shadeId: ref.shadeId,
            isExcluded: token.isExcluded,
            ...(options?.includes('description') && {
              description: token.description,
            }),
            ...(options?.includes('collection_id') && {
              collectionId: previousItem?.collectionId,
            }),
            ...(options?.includes('mode_id') && {
              modeId: previousItem?.modeId,
            }),
            ...(options?.includes('variable_id') && {
              variableId: previousItem?.variableId,
            }),
            ...(options?.includes('style_id') && {
              styleId: previousItem?.styleId,
            }),
            ...(options?.includes('catalog_id') && {
              catalogId: previousItem?.catalogId,
            }),
            ...(options?.includes('set_id') && {
              setId: previousItem?.setId,
            }),
            ...(options?.includes('token_id') && {
              tokenId: previousItem?.tokenId,
            }),
          }
        })
      )

    return systemLibraryData
  }
}
