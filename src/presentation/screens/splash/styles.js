import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#FF3B30',
  violet: '#8A2BE2',
  blue: '#2E7DFF',
  ring: 'rgba(255,255,255,0.14)',
};

export const SOLAR = {
  sunSize: 120,
  rings: [190, 270, 350],
  dotSize: 16,
};

const titleFont = Platform.select({
  ios: 'Impact',
  android: 'sans-serif-black',
  default: 'Impact',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 64,
  },

  header: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontFamily: titleFont,
    fontSize: 52,
    letterSpacing: 2,
    color: COLORS.white,
    fontWeight: Platform.OS === 'ios' ? '900' : 'normal',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },

  solarSystem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.ring,
    borderRadius: 9999,
  },

  orbit: {
    position: 'absolute',
    alignItems: 'center',
  },
  dot: {
    width: SOLAR.dotSize,
    height: SOLAR.dotSize,
    borderRadius: SOLAR.dotSize / 2,

    marginTop: -SOLAR.dotSize / 2,

    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  sunWrap: {
    width: SOLAR.sunSize,
    height: SOLAR.sunSize,
    borderRadius: SOLAR.sunSize / 2,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  sun: {
    width: SOLAR.sunSize,
    height: SOLAR.sunSize,
    borderRadius: SOLAR.sunSize / 2,
  },

  actions: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 14,
    marginBottom: 8,
  },
  button: {
    height: 52,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: COLORS.white,
  },
  createButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default styles;
