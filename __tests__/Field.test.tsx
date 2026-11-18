/**
 * The text field on the sign-in screens: codes get the number pad, passwords
 * can be shown, and password managers are told what each field is.
 */
import React from 'react';
import {TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import Field from '../src/components/Field';

function render(extra: object) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<Field label="L" value="" onChangeText={() => {}} {...extra} />);
  });
  return tree.root;
}

test('a code opens the number pad and stops at six digits', () => {
  const input = render({code: true}).findByType(TextInput).props;
  expect(input.keyboardType).toBe('number-pad');
  expect(input.maxLength).toBe(6);
  expect(input.autoComplete).toBe('one-time-code');
});

test('a password is hidden until she asks to see it', () => {
  const root = render({secure: true});
  expect(root.findByType(TextInput).props.secureTextEntry).toBe(true);
  expect(root.findByType(TextInput).props.autoCapitalize).toBe('none');

  const toggle = root.findByProps({accessibilityLabel: 'Show password'});
  ReactTestRenderer.act(() => toggle.props.onPress());
  expect(root.findByType(TextInput).props.secureTextEntry).toBe(false);
  expect(root.findByProps({accessibilityLabel: 'Hide password'})).toBeTruthy();
});

test('a new password is marked for the password manager', () => {
  expect(render({secure: true, newPassword: true}).findByType(TextInput).props.autoComplete).toBe(
    'new-password',
  );
  expect(render({email: true}).findByType(TextInput).props.autoComplete).toBe('email');
});
