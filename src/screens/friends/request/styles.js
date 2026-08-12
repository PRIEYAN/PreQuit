import { StyleSheet } from 'react-native';
import { COLORS, IMPACT_FONT } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    fontFamily: IMPACT_FONT,
    fontSize: 30,
    letterSpacing: 1,
    color: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  // ── Post card ─────────────────────────────────────────────
  post: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 16,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  postMeta: {
    marginLeft: 12,
    flex: 1,
  },
  postUser: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  postTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Image placeholder area (grayscale block).
  postImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.glassBorder,
  },

  postBody: {
    padding: 12,
  },
  postCaption: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});

export default styles;
