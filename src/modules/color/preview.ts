import { Hsluv } from 'hsluv'
import chroma from 'chroma-js'
import {
  AlgorithmVersionConfiguration,
  ColorSpaceConfiguration,
  ShiftCurveConfiguration,
  VisionSimulationModeConfiguration,
} from '@tps/configuration.types'
import { Channel } from '@tps/color.types'
import {
  resolveShift,
  SHIFT_BOUNDS,
  SHIFT_NEUTRAL,
  ShiftChannel,
} from '@modules/shift/shift'
import Color from './color'

export interface ShiftGradientStop {
  offset: number
  color: string
  outOfGamut: boolean
}

export interface PreviewOptions {
  sourceColor: Channel
  colorSpace?: ColorSpaceConfiguration
  algorithmVersion?: AlgorithmVersionConfiguration
  visionSimulationMode?: VisionSimulationModeConfiguration
}

export interface SampleShiftOptions {
  steps?: number
  otherShift?: ShiftCurveConfiguration
  lightnessRange?: { min: number; max: number }
}

export interface SampleLightnessOptions {
  steps?: number
  domain?: { min: number; max: number }
}

const lerp = (from: number, to: number, ratio: number): number =>
  from + (to - from) * ratio

type ChromaJsBackedSpace = 'LCH' | 'OKLCH' | 'LAB' | 'OKLAB' | 'HSL' | 'HSV'

const sampleChromaJsBacked = (
  colorSpace: ChromaJsBackedSpace,
  sourceColor: Channel,
  hueShifting: number,
  chromaShifting: number,
  algorithmVersion: AlgorithmVersionConfiguration,
  visionSimulationMode: VisionSimulationModeConfiguration,
  lightnessOverride?: number
): { rgb: Channel; outOfGamut: boolean } => {
  const buildFromLchLike = (space: 'lch' | 'oklch') => {
    const isOk = space === 'oklch'
    const source = isOk
      ? chroma(sourceColor).oklch()
      : chroma(sourceColor).lch()
    const lightness = lightnessOverride ?? (isOk ? source[0] * 100 : source[0])
    const colorData = new Color({
      render: 'RGB',
      sourceColor,
      lightness,
      hueShifting,
      chromaShifting,
      algorithmVersion,
      visionSimulationMode,
    })
    const adjustedChroma = colorData.adjustChroma(
      source[1] * (chromaShifting / 100)
    )
    const adjustedHue = colorData.adjustHue(source[2])
    const chromaObject = isOk
      ? chroma.oklch(lightness / 100, adjustedChroma, adjustedHue)
      : chroma.lch(lightness, adjustedChroma, adjustedHue)

    return {
      rgb: colorData.simulateColorBlindRgb(chromaObject.rgb() as Channel),
      outOfGamut: chromaObject.clipped(),
    }
  }

  const buildFromLabLike = (space: 'lab' | 'oklab') => {
    const isOk = space === 'oklab'
    const labL = chroma(sourceColor).get(isOk ? 'oklab.l' : 'lab.l')
    const labA = chroma(sourceColor).get(isOk ? 'oklab.a' : 'lab.a')
    const labB = chroma(sourceColor).get(isOk ? 'oklab.b' : 'lab.b')
    const lightness = lightnessOverride ?? (isOk ? labL * 100 : labL)
    const colorData = new Color({
      render: 'RGB',
      sourceColor,
      lightness,
      hueShifting,
      chromaShifting,
      algorithmVersion,
      visionSimulationMode,
    })

    const chr = Math.sqrt(labA ** 2 + labB ** 2) * (chromaShifting / 100)
    let h = Math.atan(labB / labA) + hueShifting * (Math.PI / 180)

    if (h > Math.PI) h = Math.PI
    else if (h < -Math.PI) h = Math.PI

    let newLabA = chr * Math.cos(h)
    let newLabB = chr * Math.sin(h)

    if (Math.sign(labA) === -1 && Math.sign(labB) === 1) {
      newLabA *= -1
      newLabB *= -1
    }
    if (Math.sign(labA) === -1 && Math.sign(labB) === -1) {
      newLabA *= -1
      newLabB *= -1
    }
    if (Number.isNaN(newLabA)) newLabA = 0
    if (Number.isNaN(newLabB)) newLabB = 0

    const chromaObject = isOk
      ? chroma.oklab(
          lightness / 100,
          colorData.adjustChroma(newLabA),
          colorData.adjustChroma(newLabB)
        )
      : chroma.lab(
          lightness,
          colorData.adjustChroma(newLabA),
          colorData.adjustChroma(newLabB)
        )

    return {
      rgb: colorData.simulateColorBlindRgb(chromaObject.rgb() as Channel),
      outOfGamut: chromaObject.clipped(),
    }
  }

  const buildFromHslLike = (space: 'hsl' | 'hsv') => {
    const source =
      space === 'hsv' ? chroma(sourceColor).hsv() : chroma(sourceColor).hsl()
    const lightness = lightnessOverride ?? source[2] * 100
    const colorData = new Color({
      render: 'RGB',
      sourceColor,
      lightness,
      hueShifting,
      chromaShifting,
      algorithmVersion,
      visionSimulationMode,
    })
    const hue = colorData.adjustHue(Number.isNaN(source[0]) ? 0 : source[0])
    const adjustedChroma = colorData.adjustChroma(
      source[1] * (chromaShifting / 100)
    )
    const chromaObject =
      space === 'hsv'
        ? chroma.hsv(hue, adjustedChroma, lightness / 100)
        : chroma.hsl(hue, adjustedChroma, lightness / 100)

    return {
      rgb: colorData.simulateColorBlindRgb(chromaObject.rgb() as Channel),
      outOfGamut: chromaObject.clipped(),
    }
  }

  switch (colorSpace) {
    case 'LCH':
      return buildFromLchLike('lch')
    case 'OKLCH':
      return buildFromLchLike('oklch')
    case 'LAB':
      return buildFromLabLike('lab')
    case 'OKLAB':
      return buildFromLabLike('oklab')
    case 'HSL':
      return buildFromHslLike('hsl')
    case 'HSV':
      return buildFromHslLike('hsv')
  }
}

const sampleHsluv = (
  sourceColor: Channel,
  hueShifting: number,
  chromaShifting: number,
  algorithmVersion: AlgorithmVersionConfiguration,
  visionSimulationMode: VisionSimulationModeConfiguration,
  lightnessOverride?: number
): { rgb: Channel; outOfGamut: boolean } => {
  const hsluv = new Hsluv()
  hsluv.rgb_r = sourceColor[0] / 255
  hsluv.rgb_g = sourceColor[1] / 255
  hsluv.rgb_b = sourceColor[2] / 255
  hsluv.rgbToHsluv()

  if (lightnessOverride !== undefined) hsluv.hsluv_l = lightnessOverride

  const colorData = new Color({
    render: 'RGB',
    sourceColor,
    lightness: hsluv.hsluv_l,
    hueShifting,
    chromaShifting,
    algorithmVersion,
    visionSimulationMode,
  })

  hsluv.hsluv_s = colorData.adjustChroma(hsluv.hsluv_s * (chromaShifting / 100))
  hsluv.hsluv_h = colorData.adjustHue(hsluv.hsluv_h)
  if (Number.isNaN(hsluv.hsluv_s)) hsluv.hsluv_s = 0
  if (Number.isNaN(hsluv.hsluv_h)) hsluv.hsluv_h = 0

  hsluv.hsluvToRgb()

  const raw: Channel = [hsluv.rgb_r * 255, hsluv.rgb_g * 255, hsluv.rgb_b * 255]
  const outOfGamut = raw.some((channel) => channel < -0.5 || channel > 255.5)

  return { rgb: colorData.simulateColorBlindRgb(raw), outOfGamut }
}

const CHROMA_JS_BACKED_SPACES: ReadonlyArray<ColorSpaceConfiguration> = [
  'LCH',
  'OKLCH',
  'LAB',
  'OKLAB',
  'HSL',
  'HSV',
]

const sampleColorAt = (
  sourceColor: Channel,
  colorSpace: ColorSpaceConfiguration,
  hueShifting: number,
  chromaShifting: number,
  algorithmVersion: AlgorithmVersionConfiguration,
  visionSimulationMode: VisionSimulationModeConfiguration,
  lightnessOverride?: number
): { rgb: Channel; outOfGamut: boolean } => {
  if (CHROMA_JS_BACKED_SPACES.includes(colorSpace))
    return sampleChromaJsBacked(
      colorSpace as ChromaJsBackedSpace,
      sourceColor,
      hueShifting,
      chromaShifting,
      algorithmVersion,
      visionSimulationMode,
      lightnessOverride
    )

  if (colorSpace === 'HSLUV')
    return sampleHsluv(
      sourceColor,
      hueShifting,
      chromaShifting,
      algorithmVersion,
      visionSimulationMode,
      lightnessOverride
    )

  return sampleChromaJsBacked(
    'LCH',
    sourceColor,
    hueShifting,
    chromaShifting,
    algorithmVersion,
    visionSimulationMode,
    lightnessOverride
  )
}

export default class Preview {
  private sourceColor: Channel
  private colorSpace: ColorSpaceConfiguration
  private algorithmVersion: AlgorithmVersionConfiguration
  private visionSimulationMode: VisionSimulationModeConfiguration

  constructor({
    sourceColor,
    colorSpace = 'LCH',
    algorithmVersion = 'v3',
    visionSimulationMode = 'NONE',
  }: PreviewOptions) {
    this.sourceColor = sourceColor
    this.colorSpace = colorSpace
    this.algorithmVersion = algorithmVersion
    this.visionSimulationMode = visionSimulationMode
  }

  sampleShift = (
    channel: ShiftChannel,
    options: SampleShiftOptions = {}
  ): ShiftGradientStop[] => {
    const { steps = 12, otherShift, lightnessRange } = options
    const [lowerBound, upperBound] = SHIFT_BOUNDS[channel]
    const otherChannel: ShiftChannel = channel === 'HUE' ? 'CHROMA' : 'HUE'

    const resolvedOtherValue =
      otherShift !== undefined && lightnessRange !== undefined
        ? resolveShift(
            otherShift,
            chroma(this.sourceColor).lch()[0],
            lightnessRange,
            otherChannel
          )
        : SHIFT_NEUTRAL[otherChannel]

    return Array.from({ length: steps }, (_, i) => {
      const t = steps === 1 ? 0 : i / (steps - 1)
      const shiftValue = lerp(lowerBound, upperBound, t)
      const hueShifting = channel === 'HUE' ? shiftValue : resolvedOtherValue
      const chromaShifting =
        channel === 'CHROMA' ? shiftValue : resolvedOtherValue

      const sample = sampleColorAt(
        this.sourceColor,
        this.colorSpace,
        hueShifting,
        chromaShifting,
        this.algorithmVersion,
        this.visionSimulationMode
      )

      return {
        offset: t,
        color: chroma(sample.rgb).hex(),
        outOfGamut: sample.outOfGamut,
      }
    })
  }

  sampleLightness = (
    shift: { hue: ShiftCurveConfiguration; chroma: ShiftCurveConfiguration },
    lightnessRange: { min: number; max: number },
    options: SampleLightnessOptions = {}
  ): ShiftGradientStop[] => {
    const { steps = 12, domain = { min: 0, max: 100 } } = options

    return Array.from({ length: steps }, (_, i) => {
      const t = steps === 1 ? 0 : i / (steps - 1)
      const lightness = lerp(domain.min, domain.max, t)
      const hueShifting = resolveShift(
        shift.hue,
        lightness,
        lightnessRange,
        'HUE'
      )
      const chromaShifting = resolveShift(
        shift.chroma,
        lightness,
        lightnessRange,
        'CHROMA'
      )

      const sample = sampleColorAt(
        this.sourceColor,
        this.colorSpace,
        hueShifting,
        chromaShifting,
        this.algorithmVersion,
        this.visionSimulationMode,
        lightness
      )

      return {
        offset: t,
        color: chroma(sample.rgb).hex(),
        outOfGamut: sample.outOfGamut,
      }
    })
  }

  static blend = (tracks: ShiftGradientStop[][]): ShiftGradientStop[] => {
    const [first, ...rest] = tracks
    if (first === undefined) return []
    if (rest.length === 0) return first

    return first.map((stop, index) => {
      const contributors = tracks
        .map((track) => track[index])
        .filter(
          (candidate): candidate is ShiftGradientStop => candidate !== undefined
        )

      return {
        offset: stop.offset,
        color: chroma
          .average(contributors.map((candidate) => candidate.color))
          .hex(),
        outOfGamut: contributors.some((candidate) => candidate.outOfGamut),
      }
    })
  }
}
