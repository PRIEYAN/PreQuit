import { StyleSheet } from 'react-native';
import { COLORS, IMPACT_FONT } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  // ── Header + search ───────────────────────────────────────
  header: {
    fontFamily: IMPACT_FONT,
    fontSize: 30,
    letterSpacing: 1,
    color: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.white,
    fontSize: 15,
    padding: 0,
  },

  // ── Chat row ──────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginLeft: 84,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    marginLeft: 14,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  timeUnread: {
    color: COLORS.white,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  message: {
    color: COLORS.textMuted,
    fontSize: 14,
    flexShrink: 1,
    marginRight: 8,
  },
  messageUnread: {
    color: COLORS.white,
  },
  // Unread badge — inverted (white pill, black number) for the mono theme.
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default styles;
