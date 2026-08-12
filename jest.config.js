module.exports = {
  preset: '@react-native/jest-preset',
  // The RN preset's transform matches js|ts|tsx but not jsx, and every screen
  // and component in this project is a .jsx file.
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  // node_modules is not transformed by default, but these packages ship ESM
  // and must be compiled before Jest can require them.
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|@react-navigation|react-native-reanimated|react-native-worklets|react-native-vector-icons|react-native-screens|react-native-safe-area-context|@react-native-async-storage|@react-native-community)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup-after-env.js'],
};
