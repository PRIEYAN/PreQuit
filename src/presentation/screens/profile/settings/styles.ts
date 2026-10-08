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
    paddingBottom: 20,
    gap: 6,
  },
  backChevron: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 32,
    marginTop: -3,
  },
  title: {
    color: COLORS.white,
    fontFamily: IMPACT_FONT,
    fontSize: 26,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowLabel: {
    color: COLORS.white,
    fontSize: 15,
    flex: 1,
  },
  rowValue: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginLeft: 16,
  },
  signOutText: {
    color: '#FF453A',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});

export default styles;
