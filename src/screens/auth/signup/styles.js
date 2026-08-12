import { StyleSheet } from 'react-native';

// Reversed theme vs. SignIn: white surface, black text/controls.
export const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  field: '#F2F2F2',
  placeholder: 'rgba(0,0,0,0.45)',
  label: 'rgba(0,0,0,0.6)',
  border: 'rgba(0,0,0,0.15)',
  muted: 'rgba(0,0,0,0.7)',
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
    backgroundColor: COLORS.white,
    borderColor: COLORS.black,
    borderWidth: 1,
    overflow: 'hidden',
  },
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
    color: COLORS.black,
    fontSize: 26,
    marginRight: 4,
    marginTop: -2,
  },
  backText: {
    color: COLORS.black,
    fontSize: 18,
  },
  title: {
    color: COLORS.black,
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
    marginTop: 28,
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
    color: COLORS.black,
    fontSize: 16,
    padding: 0,
  },
  eyeButton: {
    paddingLeft: 12,
    height: '100%',
    justifyContent: 'center',
  },
  // Sits directly above the submit button so the failure is where the tap was.
  error: {
    color: '#C62828',
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 12,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButton: {
    backgroundColor: COLORS.black,
    height: 52,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default styles;
