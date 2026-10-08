/* eslint-env jest */

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
      getMany: async keys =>
        Object.fromEntries(keys.map(k => [k, store.has(k) ? store.get(k) : null])),
      setMany: async entries => {
        Object.entries(entries).forEach(([k, v]) => store.set(k, v));
      },
      removeMany: async keys => {
        keys.forEach(k => store.delete(k));
      },
      getAllKeys: async () => [...store.keys()],
      clear: async () => {
        store.clear();
      },
    },
  };
});

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

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn, ...args) => fn(...args),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
