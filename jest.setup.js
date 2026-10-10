/* eslint-env jest */
// AsyncStorage ships as an ES module with a native backend, neither of which
// Jest can load: an in-memory stand-in with the calls the app uses.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  const api = {
    getItem: async key => (store.has(key) ? store.get(key) : null),
    setItem: async (key, value) => void store.set(key, value),
    removeItem: async key => void store.delete(key),
    clear: async () => store.clear(),
  };
  return {__esModule: true, default: api, ...api};
});

// The voice recorder's native modules (ES modules with a native backend). Tests
// never record; the composer only needs them to load.
jest.mock('react-native-file-access', () => ({
  Dirs: {CacheDir: '/cache'},
  FileSystem: {unlink: async () => {}, exists: async () => false, readFile: async () => ''},
}));
jest.mock('react-native-nitro-sound', () => {
  const sound = {
    startRecorder: async () => '',
    stopRecorder: async () => '',
    addRecordBackListener: () => {},
    removeRecordBackListener: () => {},
  };
  return {
    __esModule: true,
    default: sound,
    AudioEncoderAndroidType: {},
    AudioSourceAndroidType: {},
    AVEncoderAudioQualityIOSType: {},
    OutputFormatAndroidType: {},
  };
});
