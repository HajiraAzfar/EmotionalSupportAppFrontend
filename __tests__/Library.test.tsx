/**
 * The reading library as an editorial list: each article with its category and
 * reading time, saving with the heart, and a gentle empty state.
 */
import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {ReactTestInstance} from 'react-test-renderer';

import LibraryScreen from '../src/screens/LibraryScreen';
import {listArticles, setFavourite} from '../src/api/library';

jest.mock('../src/api/library', () => ({
  listArticles: jest.fn(),
  setFavourite: jest.fn(),
}));

const flatten = (c: any): string =>
  Array.isArray(c) ? c.map(flatten).join('') : c == null || c === false ? '' : String(c);
const allText = (root: ReactTestInstance) => root.findAllByType(Text).map(t => flatten(t.props.children));
const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];

const article = {
  slug: 'understanding-thinking-traps', title: 'Understanding thinking traps',
  summary: 'Fifteen common patterns.', category: 'Thinking', minutes: 4, featured: false,
  favourite: false,
};

async function open() {
  const onOpenArticle = jest.fn();
  let root!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    root = ReactTestRenderer.create(<LibraryScreen onOpenArticle={onOpenArticle} onBack={jest.fn()} />);
  });
  await settle();
  return {root: root.root, onOpenArticle};
}

// The list loads after a zero-delay timer (the search debounce), then a promise.
const settle = () =>
  ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 5));
  });

beforeEach(() => jest.clearAllMocks());

test('lists each article with its category and reading time, and opens it', async () => {
  (listArticles as jest.Mock).mockResolvedValue({categories: ['Thinking'], featured: [], articles: [article], saved_count: 0});
  const {root, onOpenArticle} = await open();
  const text = allText(root);
  expect(text).toContain('Understanding thinking traps');
  expect(text).toContain('4 min read');

  await ReactTestRenderer.act(async () => byLabel(root, 'Understanding thinking traps, 4 minute read').props.onPress());
  expect(onOpenArticle).toHaveBeenCalledWith('understanding-thinking-traps');

  (setFavourite as jest.Mock).mockResolvedValue(null);
  await ReactTestRenderer.act(async () => byLabel(root, 'Save').props.onPress());
  expect(setFavourite).toHaveBeenCalledWith('understanding-thinking-traps', true);
});

test('saved with nothing saved says how to save, kindly', async () => {
  (listArticles as jest.Mock).mockResolvedValue({categories: [], featured: [], articles: [], saved_count: 0});
  const {root} = await open();
  await ReactTestRenderer.act(async () =>
    root.findAll(n => typeof n.props.onPress === 'function' && allText(n).join('') === 'Saved')[0].props.onPress(),
  );
  await settle();
  expect(allText(root)).toContain('Nothing saved yet. Tap the heart on an article to keep it here.');
});
