import { PaletteData } from '@tps/data.types'
import { ColorSpaceConfiguration } from '@tps/configuration.types'
import makeUniversalTokens from '../../formats/makeUniversalTokens'
import makeUIKit from '../../formats/makeUIKit'
import makeTailwindV4Config from '../../formats/makeTailwindV4Config'
import makeTailwindV3Config from '../../formats/makeTailwindV3Config'
import makeSwiftUI from '../../formats/makeSwiftUI'
import makeStyleDictionaryV3Tokens from '../../formats/makeStyleDictionaryV3Tokens'
import makeScssVariables from '../../formats/makeScssVariables'
import makeResources from '../../formats/makeResources'
import makeNativeTokens from '../../formats/makeNativeTokens'
import makeLessVariables from '../../formats/makeLessVariables'
import makeDtcgTokens from '../../formats/makeDtcgTokens'
import makeCsv from '../../formats/makeCsv'
import makeCssCustomProps from '../../formats/makeCssCustomProps'
import makeCompose from '../../formats/makeCompose'

export default class Code {
  private paletteData: PaletteData

  constructor(paletteData: PaletteData) {
    this.paletteData = paletteData
  }

  makeNativeTokens = () => {
    return makeNativeTokens(this.paletteData)
  }

  makeDtcgTokens = (colorSpace: ColorSpaceConfiguration = 'RGB') => {
    return makeDtcgTokens(this.paletteData, colorSpace)
  }

  makeStyleDictionaryV3Tokens = () => {
    return makeStyleDictionaryV3Tokens(this.paletteData)
  }

  makeUniversalJson = () => {
    return makeUniversalTokens(this.paletteData)
  }

  makeCssCustomProps = (colorSpace: ColorSpaceConfiguration = 'RGB') => {
    return makeCssCustomProps(this.paletteData, colorSpace)
  }

  makeScssVariables = (colorSpace: ColorSpaceConfiguration = 'RGB') => {
    return makeScssVariables(this.paletteData, colorSpace)
  }

  makeLessVariables = (colorSpace: ColorSpaceConfiguration = 'RGB') => {
    return makeLessVariables(this.paletteData, colorSpace)
  }

  makeTailwindV3Config = () => {
    return makeTailwindV3Config(this.paletteData)
  }

  makeTailwindV4Config = () => {
    return makeTailwindV4Config(this.paletteData)
  }

  makeSwiftUI = () => {
    return makeSwiftUI(this.paletteData)
  }

  makeUIKit = () => {
    return makeUIKit(this.paletteData)
  }

  makeCompose = () => {
    return makeCompose(this.paletteData)
  }

  makeResources = () => {
    return makeResources(this.paletteData)
  }

  makeCsv = () => {
    return makeCsv(this.paletteData)
  }
}
