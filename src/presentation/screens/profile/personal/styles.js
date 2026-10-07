import { StyleSheet } from 'react-native';
import { COLORS } from '../../../theme';

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  identity: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: '800',
  },
  name: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
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
    marginTop: 20,
    marginHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 4,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },

  actionButtons: {
    flexDirection: 'row',
    marginTop: 18,
    marginHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default styles;
