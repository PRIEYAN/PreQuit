import { StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: '#0C0C0C',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.glassBorder,
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    marginLeft: 10,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  text: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  likes: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.glassBorder,
  },
  composerInput: {
    flex: 1,
    maxHeight: 110,
    minHeight: 40,
    color: COLORS.white,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    backgroundColor: COLORS.glass,
  },
  composerSend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
});

export default styles;
