import { Platform } from 'react-native';

// Impact-like heavy display font. True "Impact" isn't bundled on
// Android/iOS by default — drop an Impact.ttf into the project and swap
// IMPACT_FONT to its PostScript name to match exactly.
export const IMPACT_FONT = Platform.select({
  ios: 'Impact',
  android: 'sans-serif-black',
  default: 'Impact',
});

export const COLORS = {
  black: '#000000',
  white: '#FFFFFF',

  // Faux-glass surfaces on a pure-black background.
  glass: 'rgba(255,255,255,0.06)',
  glassStrong: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.14)',

  // Near-opaque dark surface for the floating bar so page content behind
  // it isn't visible through it (with a faint lift over pure black).
  barSurface: 'rgba(24,24,24,0.98)',

  textMuted: 'rgba(255,255,255,0.5)',
  placeholder: 'rgba(255,255,255,0.4)',
};

// Space the floating tab bar occupies — screens add this to their bottom
// padding (plus safe-area inset) so content clears the bar.
export const TAB_BAR_SPACE = 112;

export default { IMPACT_FONT, COLORS, TAB_BAR_SPACE };
