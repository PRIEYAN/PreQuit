import { StyleSheet } from 'react-native';

export const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  field: '#0D0D0D',
  placeholder: 'rgba(255,255,255,0.45)',
  label: 'rgba(255,255,255,0.6)',
  border: 'rgba(255,255,255,0.15)',
  muted: 'rgba(255,255,255,0.7)',
};

const styles = StyleSheet.create({
  // Full-screen root — transparent so the splash shows through during expand.
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Fullscreen panel, transformed (scale+translate) down onto the button
  // rect at rest, then animated up to identity. Anchored top-left so the
  // transform math lines up with the screen origin.
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: COLORS.black,
    borderColor: COLORS.white,
    borderWidth: 1,
    overflow: 'hidden',
  },
  // Content that fades in once the panel has expanded.
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // ── Header ────────────────────────────────────────────────
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    alignSelf: 'flex-start',
  },
  backChevron: {
    color: COLORS.white,
    fontSize: 26,
    marginRight: 4,
    marginTop: -2,
  },
  backText: {
    color: COLORS.white,
    fontSize: 18,
  },
  title: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Form ──────────────────────────────────────────────────
  sectionLabel: {
    color: COLORS.label,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 12,
  },
  field: {
    backgroundColor: COLORS.field,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    padding: 0,
  },
  eyeButton: {
    paddingLeft: 12,
    height: '100%',
    justifyContent: 'center',
  },
  forgot: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 2,
    marginBottom: 24,
  },
  // Sits between the form and the submit button so it cannot be missed.
  error: {
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: COLORS.white,
    height: 52,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default styles;
