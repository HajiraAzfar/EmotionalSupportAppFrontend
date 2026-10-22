module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Reanimated ships both web and native builds of the same modules; under Jest
  // the native ones cannot load. Its resolver picks the right ones, and wraps
  // react-native-worklets' resolver for the same reason.
  resolver: '<rootDir>/node_modules/react-native-reanimated/jest/resolver.js',
  // Both ship as ES modules, which Jest will not parse unless it is told to
  // transform them. The rest of the pattern is the React Native preset's own.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-reanimated|react-native-worklets)/)',
  ],
  // The check-in test taps every chip at every mood; 5s is too tight for that.
  testTimeout: 60000,
  // lucide-react-native's React Native entry is an ES module (.mjs) that Jest
  // won't transform; its CommonJS build is the same icons.
  moduleNameMapper: {
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
};
