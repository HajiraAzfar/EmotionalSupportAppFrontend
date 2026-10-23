import {IllustrationName} from './art';

// Which drawn scene stands for which library article, so a card is
// recognisable before it is read. A new article falls back to its category.
const BY_SLUG: Record<string, IllustrationName> = {
  'understanding-thinking-traps': 'thoughts',
  'how-cbt-reframing-works': 'growth',
  'facing-what-you-avoid': 'anxiety',
  'daily-mindfulness': 'mindfulness',
  'managing-distress': 'breathing',
  'why-writing-helps': 'empty',
};

const BY_CATEGORY: Record<string, IllustrationName> = {
  Thinking: 'thoughts',
  Coping: 'breathing',
  Journalling: 'empty',
};

export function articleArt(slug: string, category: string): IllustrationName {
  return BY_SLUG[slug] ?? BY_CATEGORY[category] ?? 'selfCompassion';
}
