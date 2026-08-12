import { StyleSheet } from 'react-native';
import { COLORS } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  backBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  headerMeta: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 1,
  },

  // ── Messages ──────────────────────────────────────────────
  messages: {
    padding: 12,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  bubbleIn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleOut: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.white,
    borderBottomRightRadius: 4,
  },
  textIn: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 20,
  },
  textOut: {
    color: COLORS.black,
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeIn: {
    color: COLORS.textMuted,
  },
  timeOut: {
    color: 'rgba(0,0,0,0.45)',
  },

  // ── Input bar ─────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  inputField: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    color: COLORS.white,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default styles;
