module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Must be listed last. Reanimated 4 ships its worklets transform here.
  plugins: ['react-native-worklets/plugin'],
};
