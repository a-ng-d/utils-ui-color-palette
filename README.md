![GitHub package.json version](https://img.shields.io/github/package-json/v/a-ng-d/utils-ui-color-palette?color=informational) ![GitHub last commit](https://img.shields.io/github/last-commit/a-ng-d/utils-ui-color-palette?color=informational) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/a-ng-d/utils-ui-color-palette/npm.yml?label=npm)
![GitHub](https://img.shields.io/github/license/a-ng-d/utils-ui-color-palette?color=informational)

# UI Color Palette Utils

Core utilities library for UI Color Palette - a color management plugin for design tools. This library provides the foundational color manipulation, contrast calculation, and palette generation features used in the plugin.

## Design Tools Compatibility

UI Color Palette is available for:
- Figma - Create and manage color primivites directly in your Figma designs
- FigJam - Collaborate on color decisions with your team
- Penpot - Open-source design tool alternative with full color management support

## Features

- **Color Contrast Tools**: 
  - APCA contrast calculations
  - WCAG 2.1 compliance checking
  - Contrast ratio calculations between colors

- **Color Manipulation**:
  - Color space conversions (RGB, HSL, HSLuv, LAB)
  - Color mixing and blending
  - Brightness and saturation adjustments

- **Palette Generation**:
  - Create harmonious color schemes
  - Generate accessible color combinations
  - Scale generation for design systems

## Installation

```bash
npm install @a_ng_d/utils-ui-color-palette
# or
yarn add @a_ng_d/utils-ui-color-palette
```

## Usage

```typescript
import { calculateContrast, generatePalette } from '@a_ng_d/utils-ui-color-palette';

// Calculate contrast between two colors
const contrast = calculateContrast('#000000', '#FFFFFF');

// Generate a color palette
const palette = generatePalette('#FF0000', { steps: 10 });
```

## Examples

### Contrast Calculations
```typescript
import { Contrast } from '@a_ng_d/utils-ui-color-palette';

// Create a contrast checker instance
const contrast = new Contrast({
  backgroundColor: [255, 255, 255], // White background
  textColor: '#000000' // Black text
});

// Get WCAG contrast ratio
const wcagScore = contrast.getWCAGScore(); // Returns: 'AAA'

// Get APCA contrast value
const apcaScore = contrast.getAPCAContrast(); // Returns: ~106

// Get recommended usage
const usage = contrast.getRecommendedUsage(); // Returns: 'FLUENT_TEXT'

// Get minimum font sizes
const sizes = contrast.getMinFontSizes(); // Returns recommended font sizes
```

### Color Space Conversions
```typescript
import { Color } from '@a_ng_d/utils-ui-color-palette';

// Create a color instance
const color = new Color({
  sourceColor: [255, 0, 0], // Red in RGB
  lightness: 50,
  chromaShifting: 100,
});

// Convert to different color spaces
const lchColor = color.lch();
const oklchColor = color.oklch();
const hsluvColor = color.hsluv();

// Handle color blindness simulation
const protanopiaColor = new Color({
  sourceColor: [255, 0, 0],
  visionSimulationMode: 'PROTANOPIA'
}).setColor();
```

### Color Mixing
```typescript
import { Color } from '@a_ng_d/utils-ui-color-palette';

const color = new Color({});

// Mix RGB colors with alpha
const mixed = color.mixColorsRgb(
  [255, 0, 0, 0.5], // Semi-transparent red
  [0, 0, 255, 1]    // Solid blue
);

// Mix hex colors
const mixedHex = color.mixColorsHex('#FF0000', '#0000FF');
```

## Testing

```bash
npm test
# or
yarn test
```

## Code Coverage

Current test coverage results:

```
File          | % Stmts | % Branch | % Funcs | % Lines
--------------|---------|----------|---------|--------
All files     |   76.09 |    62.63 |   75.86 |   76.09
 color.ts     |   72.06 |    68.05 |   66.66 |   72.06
 contrast.ts  |   81.51 |    65.51 |     100 |   81.51
 data.ts      |   80.14 |     57.3 |     100 |   80.14
```

To run coverage tests:
```bash
npm run test:coverage
```

## Credits

This project relies on several excellent open source packages:

### Color Processing
- [chroma.js](https://gka.github.io/chroma.js/) - A powerful library for color manipulations and conversions
  - Author: Gregor Aisch
  - License: BSD-3-Clause

### Contrast Calculation
- [APCA-W3](https://github.com/Myndex/SAPC-APCA) - Advanced Perceptual Contrast Algorithm
  - Author: Andrew Somers
  - License: W3C Software and Document Notice and License

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
