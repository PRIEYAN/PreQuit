module.exports = {
  preset: '@react-native/jest-preset',

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|@react-navigation|react-native-reanimated|react-native-worklets|react-native-vector-icons|react-native-screens|react-native-safe-area-context|@react-native-async-storage|@react-native-community)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup-after-env.js'],
};
