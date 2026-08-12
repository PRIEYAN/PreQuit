import { StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

const CIRCLE = 44;

const styles = StyleSheet.create({
  // Floats above screen content, pinned to the bottom.
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  // The curved bar itself — liquid morphism design with blurred glass background.
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: 68,
    paddingHorizontal: 8,
    borderRadius: 34,
    backgroundColor: 'rgba(20,20,20,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Circular glass halo that elevates behind the active icon — liquid morphism style.
  circle: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  label: {
    position: 'absolute',
    bottom: 6,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default styles;
