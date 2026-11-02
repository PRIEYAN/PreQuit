import { StyleSheet } from 'react-native';
import { COLORS } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backChevron: {
    color: COLORS.white,
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '300',
  },
  title: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },

  identity: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
  },
  name: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '700',
  },
  handle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  bio: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },

  stats: {
    flexDirection: 'row',
    marginTop: 18,
    marginHorizontal: 24,
    borderRadius: 16,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: 4,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },

  sortWrap: {
    marginTop: 18,
    marginBottom: 6,
  },

  placeholder: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 44,
  },
  placeholderTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  placeholderBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});

export default styles;
