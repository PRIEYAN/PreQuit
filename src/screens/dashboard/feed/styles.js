import { StyleSheet } from 'react-native';
import { COLORS, IMPACT_FONT } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    flex: 1,
    color: COLORS.white,
    fontFamily: IMPACT_FONT,
    fontSize: 30,
    letterSpacing: 0.5,
  },
  // Home / Explore / Trending — the three ranked surfaces the API exposes.
  surfaces: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  surface: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  surfaceActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  surfaceText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  surfaceTextActive: {
    color: COLORS.black,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
  emptyBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
  },
  retryText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default styles;
