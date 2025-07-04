import { describe, it, expect } from 'vitest'
import {
  BaseConfiguration,
  ThemeConfiguration,
  MetaConfiguration,
  EasingConfiguration,
  ColorSpaceConfiguration,
} from '@tps/configuration.types'
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
        name: 'Test Color',
        description: 'A test color',
        rgb: { r: 1, g: 0, b: 0 },
        alpha: {
          isEnabled: false,
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

  // Test with alpha enabled color
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
})
