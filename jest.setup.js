/* eslint-env jest */
/**
 * AsyncStorage is a native module with no JS implementation under Jest, and
 * this version ships no mock of its own, so stand in an in-memory store with
 * the same async contract the token store relies on.
 */
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: async key => (store.has(key) ? store.get(key) : null),
      setItem: async (key, value) => {
        store.set(key, value);
      },
      removeItem: async key => {
        store.delete(key);
      },
      multiGet: async keys => keys.map(k => [k, store.has(k) ? store.get(k) : null]),
      multiSet: async pairs => pairs.forEach(([k, v]) => store.set(k, v)),
      multiRemove: async keys => keys.forEach(k => store.delete(k)),
      clear: async () => {
        store.clear();
      },
    },
  };
});

// Reanimated 4 drives animations through a native worklets runtime that does
// not exist under Jest. Its shipped mock still imports the real entry point,
// so stub the surface this app uses directly.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const timing = (toValue, _config, callback) => {
    callback?.(true);
    return toValue;
  };
  return {
    __esModule: true,
    default: { View, Text: View, ScrollView: View, createAnimatedComponent: c => c },
    useSharedValue: initial => ({ value: initial }),
    useAnimatedStyle: factory => factory(),
    withTiming: timing,
    withSpring: timing,
    interpolate: (_value, _input, output) => output?.[0] ?? 0,
    Easing: {
      linear: v => v,
      ease: v => v,
      in: fn => fn,
      out: fn => fn,
      inOut: fn => fn,
      cubic: v => v,
    },
  };
});

// The tab bar and auth screens schedule callbacks back onto the RN thread.
// Outside the worklets runtime, running them inline is the correct stand-in.
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn, ...args) => fn(...args),
}));

// Vector icons resolve a native font module at import time.
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
