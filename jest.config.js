module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The check-in test taps every chip at every mood; 5s is too tight for that.
  testTimeout: 60000,
  // lucide-react-native's React Native entry is an ES module (.mjs) that Jest
  // won't transform; its CommonJS build is the same icons.
  moduleNameMapper: {
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
};
