import { describe, it, expect } from 'vitest'
import {
  BaseConfiguration,
  ThemeConfiguration,
  MetaConfiguration,
  EasingConfiguration,
  ColorSpaceConfiguration,
} from '@tps/configuration.types'
import { Case } from '@a_ng_d/figmug-utils'
import Data from './data'

describe('Data', () => {
  const mockBase: BaseConfiguration = {
    name: 'Test Palette',
    description: 'Test Description',
    preset: {
      id: 'custom',
      name: 'Custom',
      stops: [1, 2, 3],
      min: 0,
      max: 100,
      easing: 'LINEAR',
    },
    shift: {
      chroma: 100,
    },
    colors: [
      {
        id: 'color1',
        name: 'Test Color A',
        description: 'A test color',
        rgb: { r: 1, g: 0, b: 0 },
        alpha: {
          isEnabled: false,
          backgroundColor: '#FFFFFF',
        },
        hue: { shift: 0, isLocked: false },
        chroma: { shift: 100, isLocked: false },
      },
      {
        id: 'color2',
        name: 'Test Color B',
        description: 'A test color',
        rgb: { r: 0, g: 1, b: 0 },
        alpha: {
          isEnabled: false,
          backgroundColor: '#FFFFFF',
        },
        hue: { shift: 0, isLocked: false },
        chroma: { shift: 100, isLocked: false },
      },
      {
        id: 'color3',
        name: 'Test Color C',
        description: 'A test color',
        rgb: { r: 0, g: 0, b: 1 },
        alpha: {
          isEnabled: true,
          backgroundColor: '#FFFFFF',
        },
        hue: { shift: 0, isLocked: false },
        chroma: { shift: 100, isLocked: false },
      },
    ],
    colorSpace: 'LCH',
    algorithmVersion: 'v3',
    areSourceColorsLocked: false,
  }

  const mockTheme: ThemeConfiguration = {
    id: 'theme1',
    name: 'Test Theme',
    description: 'A test theme',
    type: 'default theme',
    scale: {
      '100': 100,
      '50': 50,
    },
    visionSimulationMode: 'NONE',
    textColorsTheme: {
      lightColor: '#FFFFFF',
      darkColor: '#000000',
    },
    paletteBackground: '#FFFFFF',
    isEnabled: true,
  }

  const mockThemes: Array<ThemeConfiguration> = [
    {
      id: '00000000000',
      name: 'Default Theme',
      description: 'A test theme',
      type: 'default theme',
      scale: {
        '100': 100,
        '50': 50,
      },
      visionSimulationMode: 'NONE',
      textColorsTheme: {
        lightColor: '#FFFFFF',
        darkColor: '#000000',
      },
      paletteBackground: '#FFFFFF',
      isEnabled: true,
    },
    {
      id: '00000000001',
      name: 'Custom Theme A',
      description: 'A custom theme',
      type: 'custom theme',
      scale: {
        '100': 75,
        '50': 25,
      },
      visionSimulationMode: 'NONE',
      textColorsTheme: {
        lightColor: '#FFFFFF',
        darkColor: '#000000',
      },
      paletteBackground: '#FFFFFF',
      isEnabled: true,
    },
    {
      id: '00000000002',
      name: 'Custom Theme B',
      description: 'A custom theme',
      type: 'custom theme',
      scale: {
        '100': 50,
        '50': 0,
      },
      visionSimulationMode: 'NONE',
      textColorsTheme: {
        lightColor: '#FFFFFF',
        darkColor: '#000000',
      },
      paletteBackground: '#FFFFFF',
      isEnabled: true,
    },
  ]

  const mockMeta: MetaConfiguration = {
    id: 'palette1',
    dates: {
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      publishedAt: '2023-01-01',
      openedAt: '2023-01-01',
    },
    creatorIdentity: {
      creatorFullName: 'Test Creator',
      creatorId: 'testcreator',
      creatorAvatar: 'https://example.com/avatar.png',
    },
    publicationStatus: {
      isPublished: false,
      isShared: false,
    },
  }

  it('should create an instance with correct initial values', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })
    expect(data).toBeDefined()
  })

  it('should generate palette data with makePaletteData', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makePaletteData()
    expect(result).toBeDefined()
    expect(result.name).toBe('Test Palette')
    expect(result.themes).toHaveLength(1)
  })

  it('should generate full palette data with makePaletteFullData', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makePaletteFullData()
    expect(result).toBeDefined()
    expect(result.base).toEqual(mockBase)
    expect(result.themes).toEqual([mockTheme])
    expect(result.meta).toEqual(mockMeta)
    expect(result.type).toBe('UI_COLOR_PALETTE')
  })

  it('should handle alpha enabled colors correctly', () => {
    const baseWithAlpha: BaseConfiguration = {
      ...mockBase,
      colors: [
        {
          ...mockBase.colors[0],
          alpha: {
            isEnabled: true,
            backgroundColor: '#FFFFFF',
          },
        },
      ],
    }

    const data = new Data({
      base: baseWithAlpha,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makePaletteData()
    expect(
      result.themes[0].colors[0].shades.some((shade) => shade.isTransparent)
    ).toBe(true)
  })

  it('should handle locked source colors correctly', () => {
    const baseWithLockedColors: BaseConfiguration = {
      ...mockBase,
      areSourceColorsLocked: true,
    }

    const data = new Data({
      base: baseWithLockedColors,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makePaletteData()
    expect(
      result.themes[0].colors[0].shades.some(
        (shade) => shade.isSourceColorLocked
      )
    ).toBe(true)
  })

  it('should handle different vision simulation modes', () => {
    const themeWithSimulation: ThemeConfiguration = {
      ...mockTheme,
      visionSimulationMode: 'PROTANOPIA',
    }

    const data = new Data({
      base: mockBase,
      themes: [themeWithSimulation],
      meta: mockMeta,
    })

    const result = data.makePaletteData()
    expect(result.themes[0].colors[0].shades.length).toBeGreaterThan(0)
  })

  it('should handle all color space configurations', () => {
    const colorSpaces = ['LCH', 'OKLCH', 'LAB', 'OKLAB', 'HSL', 'HSLUV']

    colorSpaces.forEach((space) => {
      const baseWithColorSpace: BaseConfiguration = {
        ...mockBase,
        colorSpace: space as ColorSpaceConfiguration,
      }

      const data = new Data({
        base: baseWithColorSpace,
        themes: [mockTheme],
        meta: mockMeta,
      })

      const result = data.makePaletteData()
      expect(result.themes[0].colors[0].shades[0]).toBeDefined()
    })
  })

  it('should handle edge cases in theme configurations', () => {
    const data = new Data({
      base: {
        ...mockBase,
        colors: [],
      },
      themes: [],
      meta: mockMeta,
    })

    const result = data.makePaletteData()
    expect(result).toBeDefined()
    expect(result.themes).toHaveLength(0)
  })

  it('should handle invalid color configurations', () => {
    const data = new Data({
      base: {
        ...mockBase,
        colors: [
          {
            ...mockBase.colors[0],
            rgb: { r: -1, g: 256, b: 1000 },
          },
        ],
      },
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makePaletteData()
    expect(result).toBeDefined()
    expect(result.themes[0].colors).toBeDefined()
  })

  it('should handle missing optional fields', () => {
    const minimalBase = {
      name: 'Minimal',
      description: 'Minimal description',
      preset: {
        id: 'minimal',
        name: 'Minimal Preset',
        stops: [],
        min: 0,
        max: 100,
        easing: 'LINEAR' as EasingConfiguration,
      },
      shift: {
        chroma: 0,
      },
      colors: [],
      colorSpace: 'LCH' as const,
      algorithmVersion: 'v3' as const,
      areSourceColorsLocked: false,
    }

    const data = new Data({
      base: minimalBase,
      themes: [],
      meta: {
        id: 'minimal',
        dates: {
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          publishedAt: '2023-01-01',
          openedAt: '2023-01-01',
        },
        creatorIdentity: {
          creatorFullName: 'Minimal Creator',
          creatorId: 'minimalcreator',
          creatorAvatar: 'https://example.com/avatar.png',
        },
        publicationStatus: {
          isPublished: false,
          isShared: false,
        },
      },
    })

    const result = data.makePaletteFullData()
    expect(result).toBeDefined()
    expect(result.type).toBe('UI_COLOR_PALETTE')
  })

  it('should retrieve styleId, variableId, collectionId, and modeId from previousData', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const initialLibraryData = data.makeLibraryData()
    const firstShade = initialLibraryData[0]
    const previousData = [
      {
        ...firstShade,
        styleId: 'style-123',
        variableId: 'var-456',
        collectionId: 'coll-789',
        modeId: 'mode-101',
      },
    ]

    const result = data.makeLibraryData(
      ['style_id', 'variable_id', 'collection_id', 'mode_id'],
      previousData
    )

    const found = result.find((item) => item.id === firstShade.id)
    expect(found).toBeDefined()
    expect(found?.styleId).toBe('style-123')
    expect(found?.variableId).toBe('var-456')
    expect(found?.collectionId).toBe('coll-789')
    expect(found?.modeId).toBe('mode-101')
  })

  it('should retrieve styleId if name change but id is the same', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const initialLibraryData = data.makeLibraryData()
    const firstShade = initialLibraryData[0]
    const previousData = [
      {
        ...firstShade,
        name: 'Old shade name',
        styleId: 'style-123',
      },
    ]

    const result = data.makeLibraryData(['style_id'], previousData)

    const found = result.find((item) => item.id === firstShade.id)
    expect(found).toBeDefined()
    expect(found?.styleId).toBe('style-123')
  })

  it('should retrieve styleId if path change but id is the same', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const initialLibraryData = data.makeLibraryData()
    const firstShade = initialLibraryData[0]
    const previousData = [
      {
        ...firstShade,
        path: 'Old theme name / Old color name',
        styleId: 'style-123',
      },
    ]

    const result = data.makeLibraryData(['style_id'], previousData)

    const found = result.find((item) => item.id === firstShade.id)
    expect(found).toBeDefined()
    expect(found?.styleId).toBe('style-123')
  })

  it('should retrieve styleId if hex change but id is the same', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const initialLibraryData = data.makeLibraryData()
    const firstShade = initialLibraryData[0]
    const previousData = [
      {
        ...firstShade,
        hex: '#3465FE',
        styleId: 'style-123',
      },
    ]

    const result = data.makeLibraryData(['style_id'], previousData)

    const found = result.find((item) => item.id === firstShade.id)
    expect(found).toBeDefined()
    expect(found?.styleId).toBe('style-123')
  })

  it('should generate native tokens with makeNativeTokens', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeNativeTokens()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should generate DTCG tokens with makeDtcgTokens', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const resultRgb = data.makeDtcgTokens('RGB')
    expect(resultRgb).toBeDefined()
    expect(typeof resultRgb).toBe('string')
    expect(resultRgb.length).toBeGreaterThan(0)

    const resultHsl = data.makeDtcgTokens('HSL')
    expect(resultHsl).toBeDefined()
    expect(typeof resultHsl).toBe('string')
  })

  it('should generate Style Dictionary tokens with makeStyleDictionaryTokens', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeStyleDictionaryV3Tokens()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should generate Universal JSON with makeUniversalJson', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeUniversalJson()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should generate CSS custom properties with makeCSS', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const resultRgb = data.makeCssCustomProps('RGB')
    expect(resultRgb).toBeDefined()
    expect(typeof resultRgb).toBe('string')
    expect(resultRgb).toContain(':root')

    const resultLch = data.makeCssCustomProps('LCH')
    expect(resultLch).toBeDefined()
    expect(resultLch).toContain('lch')
  })

  it('should generate Tailwind v3 config with makeTailwindConfigV3', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeTailwindV3Config()
    expect(result).toBeDefined()
    expect(result.theme).toBeDefined()
    expect(result.theme.colors).toBeDefined()
  })

  it('should generate Tailwind v4 config with makeTailwindConfigV4', () => {
    const defaultThemeData = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const defaultThemeResult = defaultThemeData.makeTailwindV4Config()
    console.log(defaultThemeResult)
    expect(defaultThemeResult).toBeDefined()
    expect(typeof defaultThemeResult).toBe('string')
    expect(defaultThemeResult).toContain('@theme {')
    expect(defaultThemeResult).toContain('--color-')
    expect(defaultThemeResult).toContain('@import "tailwindcss"')

    const paletteData = defaultThemeData.makePaletteData()
    const defaultThemeColors = paletteData.themes[0].colors.map((color) =>
      new Case(color.name).doKebabCase()
    )

    if (defaultThemeColors.length > 0) {
      expect(defaultThemeResult).toContain(`--color-${defaultThemeColors[0]}-`)
    }

    const customThemeData = new Data({
      base: mockBase,
      themes: mockThemes,
      meta: mockMeta,
    })

    const customThemeResult = customThemeData.makeTailwindV4Config()
    console.log(customThemeResult)
    expect(customThemeResult).toBeDefined()
    expect(customThemeResult).toContain('@theme {')
    expect(customThemeResult).toContain('--color-')

    const customThemesExist = mockThemes.some(
      (theme) => theme.type === 'custom theme'
    )

    if (customThemesExist) {
      const customTheme = mockThemes.find(
        (theme) => theme.type === 'custom theme'
      )
      if (customTheme && defaultThemeColors.length > 0) {
        const customThemeName = new Case(customTheme.name).doKebabCase()
        const colorName = defaultThemeColors[0]
        expect(customThemeResult).toContain(
          `--color-${customThemeName}-${colorName}-`
        )
      }
    }
  })

  it('should generate SwiftUI code with makeSwiftUI', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeSwiftUI()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('struct')
    expect(result).toContain('Color')
  })

  it('should generate UIKit code with makeUIKit', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeUIKit()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('UIColor')
  })

  it('should generate Jetpack Compose code with makeCompose', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeCompose()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('Color')
  })

  it('should generate resource files with makeResources', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeResources()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should generate SCSS variables with makeScssVariable', () => {
    const data = new Data({
      base: mockBase,
      themes: mockThemes,
      meta: mockMeta,
    })

    const resultRgb = data.makeScssVariables('RGB')
    expect(resultRgb).toBeDefined()
    expect(typeof resultRgb).toBe('string')
    expect(resultRgb).toContain('$')

    const resultLch = data.makeScssVariables('LCH')
    expect(resultLch).toBeDefined()
    expect(resultLch).toContain('lch')
  })

  it('should generate Less variables with makeLessVariables', () => {
    const data = new Data({
      base: mockBase,
      themes: mockThemes,
      meta: mockMeta,
    })

    const resultRgb = data.makeLessVariables('RGB')
    expect(resultRgb).toBeDefined()
    expect(typeof resultRgb).toBe('string')
    expect(resultRgb).toContain('@')

    const resultLch = data.makeLessVariables('LCH')
    expect(resultLch).toBeDefined()
    expect(resultLch).toContain('lch')
  })

  it('should generate CSV data with makeCsv', () => {
    const data = new Data({
      base: mockBase,
      themes: [mockTheme],
      meta: mockMeta,
    })

    const result = data.makeCsv()
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)

    const firstMode = result[0]
    expect(firstMode.name).toBe(mockTheme.name)
    expect(firstMode.type).toBe(mockTheme.type)
    expect(Array.isArray(firstMode.colors)).toBe(true)

    if (firstMode.colors.length > 0) {
      const firstColor = firstMode.colors[0]
      expect(firstColor.name).toBeDefined()
      expect(typeof firstColor.csv).toBe('string')
      expect(firstColor.csv).toContain('Lightness,Chroma,Hue')
    }
  })
})
