module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4 compiles its worklets through this plugin, which ships with
  // react-native-worklets rather than with reanimated itself. It has to stay
  // last in the list.
  plugins: ['react-native-worklets/plugin'],
};
