import { Channel, ChannelWithAlpha, HexModel } from './color.types'

export type ColorFormat<T extends 'HEX' | 'RGB'> = T extends 'HEX'
  ? HexModel
  : Channel | ChannelWithAlpha
