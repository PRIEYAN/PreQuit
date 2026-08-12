import { StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.glassStrong,
  },
  // Shown when the author has no avatar — first letter of their name.
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  displayName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  handle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 1,
  },
  // "Why am I seeing this" — the ranking reason from the feed algorithm.
  reasonPill: {
    alignSelf: 'flex-start',
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  reasonText: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  description: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  media: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.glassStrong,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 20,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  // Pushes the save action to the right edge of the row.
  spacer: {
    flex: 1,
  },
  topics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  topic: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});

export default styles;
