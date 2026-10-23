/**
 * The onboarding explainers: four slides, Back and Next between them, and the
 * last one leads to creating an account.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import IntroScreen from '../src/screens/IntroScreen';

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const pressable = (root: ReactTestInstance, label: string) =>
  root.findAll(n => typeof n.props.onPress === 'function' && allText(n).includes(label))[0];

test('walks the four slides and ends on creating an account', async () => {
  const onDone = jest.fn();
  const onBack = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<IntroScreen onDone={onDone} onBack={onBack} />);
  });
  const root = tree.root;
  expect(allText(root)).toContain('A safe space to reflect');

  for (const title of ['Tools for healthier thinking', 'Calm when you need it', 'Yours, and private']) {
    await ReactTestRenderer.act(async () => pressable(root, 'Next').props.onPress());
    expect(allText(root)).toContain(title);
  }
  await ReactTestRenderer.act(async () => pressable(root, 'Create my account').props.onPress());
  expect(onDone).toHaveBeenCalled();

  // Back steps through the slides, and leaves only from the first.
  for (let i = 0; i < 3; i++) {
    await ReactTestRenderer.act(async () => pressable(root, 'Back').props.onPress());
  }
  expect(onBack).not.toHaveBeenCalled();
  await ReactTestRenderer.act(async () => pressable(root, 'Back').props.onPress());
  expect(onBack).toHaveBeenCalled();
});
