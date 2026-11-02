import { StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.barSurface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  gif: {
    width: '100%',
    height: 168,
    backgroundColor: COLORS.glass,
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  error: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.glassStrong,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  confirmButton: {
    backgroundColor: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default styles;
