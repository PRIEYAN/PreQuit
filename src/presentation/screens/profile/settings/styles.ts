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

  stackRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  rowIcon: {
    marginRight: 10,
  },
  rowAction: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    marginBottom: 10,
  },
  activePillText: {
    color: COLORS.black,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  // The non-active mode's card stays editable; the dimming only signals which
  // set of rules the account is currently running under.
  cardInactive: {
    opacity: 0.55,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: COLORS.white,
  },
  segmentText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.black,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
  },
});

export default styles;
