import { Platform } from 'react-native';

export const IMPACT_FONT = Platform.select({
  ios: 'Impact',
  android: 'sans-serif-black',
  default: 'Impact',
}) as string;

export const COLORS = {
  black: '#000000',
  white: '#FFFFFF',

  glass: 'rgba(255,255,255,0.06)',
  glassStrong: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.14)',

  barSurface: 'rgba(24,24,24,0.98)',

  textMuted: 'rgba(255,255,255,0.5)',
  placeholder: 'rgba(255,255,255,0.4)',
} as const;

export type ColorToken = keyof typeof COLORS;

export const TAB_BAR_SPACE = 112;

export default { IMPACT_FONT, COLORS, TAB_BAR_SPACE };
