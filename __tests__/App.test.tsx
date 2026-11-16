/**
 * @format
 */

import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';
import App from '../App';
import {ApiError, NetworkError, apiRequest} from '../src/api/client';
import {getAccessToken} from '../src/storage/tokens';

// The real SafeAreaProvider waits for the phone's insets before it renders anything.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../src/api/client', () => ({
  ...jest.requireActual('../src/api/client'),
  apiRequest: jest.fn(),
}));
jest.mock('../src/storage/tokens', () => ({
  ...jest.requireActual('../src/storage/tokens'),
  getAccessToken: jest.fn(async () => null),
}));
jest.mock('../src/storage/appLock', () => ({
  ...jest.requireActual('../src/storage/appLock'),
  isLockSet: jest.fn(async () => false),
}));
// The splash holds for a moment on a timer; here it moves straight on.
jest.mock('../src/screens/SplashScreen', () => {
  const {useEffect} = require('react');
  function MockSplash({onDone}: {onDone: () => void}) {
    useEffect(onDone, [onDone]);
    return null;
  }
  return {__esModule: true, default: MockSplash};
});

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children)).join(' ');

async function start() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  // The splash, the lock check, the token and the status request each settle in turn.
  for (let i = 0; i < 5; i++) {
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
  }
  return tree;
}

test('renders correctly', async () => {
  await start();
});

test('signed in but offline at start: a retry, not the Welcome screen', async () => {
  (getAccessToken as jest.Mock).mockResolvedValue('token');
  (apiRequest as jest.Mock).mockRejectedValue(new NetworkError());
  const tree = await start();
  expect(allText(tree.root)).toContain('No connection right now');
  expect(allText(tree.root)).not.toContain('I already have an account');

  const retry = tree.root.findAll(
    n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => flatten(t.props.children) === 'Try again'),
  )[0];
  const calls = (apiRequest as jest.Mock).mock.calls.length;
  await ReactTestRenderer.act(async () => retry.props.onPress());
  expect((apiRequest as jest.Mock).mock.calls.length).toBe(calls + 1);
});

test('a session the server refuses goes back to Welcome', async () => {
  (getAccessToken as jest.Mock).mockResolvedValue('token');
  (apiRequest as jest.Mock).mockRejectedValue(new ApiError('Not signed in', 401));
  const tree = await start();
  expect(allText(tree.root)).toContain('I already have an account');
  expect(allText(tree.root)).not.toContain('No connection right now');
});
