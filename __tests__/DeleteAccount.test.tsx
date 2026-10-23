/**
 * Deleting the account: nothing happens until it is understood, the password
 * is given and a last "Delete everything?" is confirmed; afterwards nothing of
 * the account stays on the phone. A wrong password deletes nothing.
 */
import React from 'react';
import {Alert, Text, TextInput} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import DeleteAccountScreen from '../src/screens/DeleteAccountScreen';
import {deleteAccount} from '../src/api/auth';
import {clearLock} from '../src/storage/appLock';
import {clearTokens} from '../src/storage/tokens';

jest.mock('../src/api/auth', () => ({deleteAccount: jest.fn()}));
jest.mock('../src/storage/appLock', () => ({clearLock: jest.fn(async () => {})}));
jest.mock('../src/storage/tokens', () => ({clearTokens: jest.fn(async () => {})}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const deleteButton = (root: ReactTestInstance) =>
  root.findAll(n => typeof n.props.onPress === 'function' && allText(n).includes('Delete my account'))[0];

async function open() {
  const onDeleted = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<DeleteAccountScreen onBack={jest.fn()} onDeleted={onDeleted} />);
  });
  const root = tree.root;
  const ready = async (password: string) => {
    const understood = root.findAll(
      n => n.props.accessibilityLabel === 'I understand this cannot be undone' && typeof n.props.onPress === 'function',
    )[0];
    await ReactTestRenderer.act(async () => understood.props.onPress());
    await ReactTestRenderer.act(async () => root.findByType(TextInput).props.onChangeText(password));
  };
  const confirmInAlert = async () => {
    const alert = jest.spyOn(Alert, 'alert');
    await ReactTestRenderer.act(async () => deleteButton(root).props.onPress());
    const buttons = alert.mock.calls[alert.mock.calls.length - 1][2]!;
    await ReactTestRenderer.act(async () => buttons.find(b => b.style === 'destructive')!.onPress!());
  };
  return {root, onDeleted, ready, confirmInAlert};
}

beforeEach(() => jest.clearAllMocks());

test('is disabled until it is understood and a password is given', async () => {
  const {root, ready} = await open();
  expect(deleteButton(root).props.disabled).toBe(true);
  await ready('secret');
  expect(deleteButton(root).props.disabled).toBe(false);
});

test('deletes only after the last confirmation, then clears this phone', async () => {
  (deleteAccount as jest.Mock).mockResolvedValue(null);
  const {onDeleted, ready, confirmInAlert} = await open();
  await ready('secret');
  expect(deleteAccount).not.toHaveBeenCalled();

  await confirmInAlert();
  expect(deleteAccount).toHaveBeenCalledWith('secret');
  expect(clearLock).toHaveBeenCalled();
  expect(clearTokens).toHaveBeenCalled();
  expect(onDeleted).toHaveBeenCalled();
});

test('a wrong password says so and leaves everything in place', async () => {
  (deleteAccount as jest.Mock).mockRejectedValue(new Error("That password isn't right."));
  const {root, onDeleted, ready, confirmInAlert} = await open();
  await ready('wrong');
  await confirmInAlert();
  expect(allText(root)).toContain("That password isn't right.");
  expect(clearTokens).not.toHaveBeenCalled();
  expect(onDeleted).not.toHaveBeenCalled();
});
