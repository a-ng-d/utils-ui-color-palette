export type {
  HexModel,
  RgbModel,
  HslModel,
  Channel,
  ChannelWithAlpha,
} from '@tps/color.types'
export type {
  BaseConfiguration,
  SourceColorConfiguration,
  ExchangeConfiguration,
  ExtractOfBaseConfiguration,
  EasingConfiguration,
  PresetConfiguration,
  ShiftConfiguration,
  ScaleConfiguration,
  LockedSourceColorsConfiguration,
  ColorConfiguration,
  ThemeConfiguration,
  ExportConfiguration,
  ColorSpaceConfiguration,
  VisionSimulationModeConfiguration,
  TextColorsThemeConfiguration,
  ViewConfiguration,
  AlgorithmVersionConfiguration,
  DatesConfiguration,
  PublicationConfiguration,
  CreatorConfiguration,
  StatusConfiguration,
  UserConfiguration,
  MetaConfiguration,
  FullConfiguration,
  DocumentConfiguration,
  ThirdParty,
} from '@tps/configuration.types'
export type {
  PaletteData,
  LibraryData,
  PaletteDataThemeItem,
  PaletteDataColorItem,
  PaletteDataShadeItem,
  ExternalPalettes,
  ColourLovers,
} from '@tps/data.types'
export type { ColorFormat } from '@tps/model.types'

export { default as Color } from '@modules/color/color'
export { default as Contrast } from '@modules/contrast/contrast'
export { default as Data } from '@modules/data/data'
