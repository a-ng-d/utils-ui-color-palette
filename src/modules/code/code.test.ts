import { describe, it, expect } from 'vitest'
import {
  BaseConfiguration,
  ThemeConfiguration,
  MetaConfiguration,
} from '@tps/configuration.types'
import Data from '@modules/data/data'
import Code from './code'

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

  const data = new Data({
    base: mockBase,
    themes: [mockTheme],
    meta: mockMeta,
  }).makePaletteData()

  const code = new Code(data)

  it('should generate native tokens with makeNativeTokens', () => {
    const result = code.makeNativeTokens()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should generate DTCG tokens with makeDtcgTokens', () => {
    const resultRgb = code.makeDtcgTokens('RGB')
    expect(resultRgb).toBeDefined()
    expect(typeof resultRgb).toBe('string')
    expect(resultRgb.length).toBeGreaterThan(0)

    const resultHsl = code.makeDtcgTokens('HSL')
    expect(resultHsl).toBeDefined()
    expect(typeof resultHsl).toBe('string')
  })

  it('should generate Style Dictionary tokens with makeStyleDictionaryTokens', () => {
    const result = code.makeStyleDictionaryV3Tokens()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should generate Universal JSON with makeUniversalJson', () => {
    const result = code.makeUniversalJson()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should generate CSS custom properties with makeCSS', () => {
    const resultRgb = code.makeCssCustomProps('RGB')
    expect(resultRgb).toBeDefined()
    expect(typeof resultRgb).toBe('string')
    expect(resultRgb).toContain(':root')

    const resultLch = code.makeCssCustomProps('LCH')
    expect(resultLch).toBeDefined()
    expect(resultLch).toContain('lch')
  })

  it('should handle default theme (mono theme) correctly in makeCssCustomProps', () => {
    const dataWithDefaultThemeOnly = new Data({
      base: mockBase,
      themes: [mockThemes[0]],
      meta: mockMeta,
    }).makePaletteData()

    const codeWithDefaultTheme = new Code(dataWithDefaultThemeOnly)
    const result = codeWithDefaultTheme.makeCssCustomProps('RGB')

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain(':root')

    mockBase.colors.forEach((color) => {
      const kebabCaseName = color.name.toLowerCase().replace(/\s+/g, '-')
      expect(result.toLowerCase()).toContain(`--${kebabCaseName}`)
    })
  })

  it('should handle multiple custom themes correctly in makeCssCustomProps', () => {
    const dataWithMultipleCustomThemes = new Data({
      base: mockBase,
      themes: [mockThemes[0], mockThemes[1], mockThemes[2]],
      meta: mockMeta,
    }).makePaletteData()

    const codeWithCustomThemes = new Code(dataWithMultipleCustomThemes)
    const result = codeWithCustomThemes.makeCssCustomProps('RGB')

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain(':root')

    mockThemes.slice(1).forEach((theme) => {
      const themeName = theme.name.toLowerCase().replace(/\s+/g, '-')
      expect(result.toLowerCase()).toContain(themeName)
    })
  })

  it('should generate Tailwind v3 config with makeTailwindConfigV3', () => {
    const result = code.makeTailwindV3Config()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle default theme (mono theme) correctly in makeTailwindV3Config', () => {
    const dataWithDefaultThemeOnly = new Data({
      base: mockBase,
      themes: [mockThemes[0]],
      meta: mockMeta,
    }).makePaletteData()

    const codeWithDefaultTheme = new Code(dataWithDefaultThemeOnly)
    const result = codeWithDefaultTheme.makeTailwindV3Config()

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('module.exports')
    expect(result).not.toContain('none')

    mockBase.colors.forEach((color) => {
      const kebabCaseName = color.name.toLowerCase().replace(/\s+/g, '-')
      expect(result).toContain(kebabCaseName)
    })
  })

  it('should handle multiple custom themes correctly in makeTailwindV3Config', () => {
    const dataWithMultipleCustomThemes = new Data({
      base: mockBase,
      themes: [mockThemes[0], mockThemes[1], mockThemes[2]],
    }).makePaletteData()

    const codeWithCustomThemes = new Code(dataWithMultipleCustomThemes)
    const result = codeWithCustomThemes.makeTailwindV3Config()

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')

    expect(result).toContain('custom-theme-a')
    expect(result).toContain('custom-theme-b')

    mockBase.colors.forEach((color) => {
      const kebabCaseName = color.name.toLowerCase().replace(/\s+/g, '-')
      expect(result).toContain(kebabCaseName)
    })
  })

  it('should generate Tailwind v4 config with makeTailwindConfigV4', () => {
    const result = code.makeTailwindV4Config()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle default theme (mono theme) correctly in makeTailwindV4Config', () => {
    const dataWithDefaultThemeOnly = new Data({
      base: mockBase,
      themes: [mockThemes[0]],
      meta: mockMeta,
    }).makePaletteData()

    const codeWithDefaultTheme = new Code(dataWithDefaultThemeOnly)
    const result = codeWithDefaultTheme.makeTailwindV4Config()

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('@import "tailwindcss"')
    expect(result).toContain('@theme')

    mockBase.colors.forEach((color) => {
      const kebabCaseName = color.name.toLowerCase().replace(/\s+/g, '-')
      expect(result).toContain(kebabCaseName)
    })
  })

  it('should handle multiple custom themes correctly in makeTailwindV4Config', () => {
    const dataWithMultipleCustomThemes = new Data({
      base: mockBase,
      themes: [mockThemes[0], mockThemes[1], mockThemes[2]],
      meta: mockMeta,
    }).makePaletteData()

    const codeWithCustomThemes = new Code(dataWithMultipleCustomThemes)
    const result = codeWithCustomThemes.makeTailwindV4Config()

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')

    const themeNames = ['custom-theme-a', 'custom-theme-b'].map((name) =>
      name.toLowerCase().replace(/\s+/g, '-')
    )

    themeNames.forEach((name) => {
      expect(result.toLowerCase()).toContain(name)
    })
  })

  it('should generate SwiftUI code with makeSwiftUI', () => {
    const result = code.makeSwiftUI()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('struct')
    expect(result).toContain('Color')
  })

  it('should generate UIKit code with makeUIKit', () => {
    const result = code.makeUIKit()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('UIColor')
  })

  it('should generate Jetpack Compose code with makeCompose', () => {
    const result = code.makeCompose()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('Color')
  })

  it('should generate resource files with makeResources', () => {
    const result = code.makeResources()
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should generate SCSS variables with makeScssVariable', () => {
    const resultRgb = code.makeScssVariables('RGB')
    expect(resultRgb).toBeDefined()
    expect(typeof resultRgb).toBe('string')
    expect(resultRgb).toContain('$')

    const resultLch = code.makeScssVariables('LCH')
    expect(resultLch).toBeDefined()
    expect(resultLch).toContain('lch')
  })

  it('should generate Less variables with makeLessVariables', () => {
    const resultRgb = code.makeLessVariables('RGB')
    expect(resultRgb).toBeDefined()
    expect(typeof resultRgb).toBe('string')
    expect(resultRgb).toContain('@')

    const resultLch = code.makeLessVariables('LCH')
    expect(resultLch).toBeDefined()
    expect(resultLch).toContain('lch')
  })

  it('should generate CSV data with makeCsv', () => {
    const result = code.makeCsv()
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
