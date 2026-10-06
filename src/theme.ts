// mindDoc's palette, sampled from the brand designs: a warm cream page, white
// rounded cards, a terracotta accent, peach for the AI Chat button and
// sage-green pills. Every screen reads its colours from here, so this file is
// the only place a theme change happens.
const palette = {
  // The page itself: flat warm cream.
  bg: '#F6EEE4',
  // Cards are plain white, set off from the cream by a hairline.
  surface: '#FFFFFF',
  // A pressed card, or a cell set into one: a shade warmer than the page.
  surfaceRaised: '#F4E8DC',
  // The home screen's cards, and the ink on them.
  card: '#FFFFFF',
  onCard: '#3A322E',
  onCardSoft: '#5F5550',
  ink: '#3A322E',
  inkSoft: '#5F5550',
  inkFaint: '#7E736C',
  // A hairline, not a border: the edge of a white card on the cream.
  line: '#EADFD3',
  // Light peach: the home screen's journal cards.
  blush: '#F6D9C8',
  // Peach, from the flowers in the logo: the AI Chat button.
  coral: '#E8956F',
  coralSoft: '#F1B999',
  // Terracotta: buttons, the user's chat bubbles, links. A shade deeper than
  // the design so white text on it stays readable.
  accent: '#BC6A4E',
  accentSoft: '#DB937A',
  accentWash: 'rgba(188, 106, 78, 0.10)',
  // Text and spinners that sit on top of an accent colour.
  onAccent: '#FFFFFF',
  // Sage: borders, spinners and charts; the wash is the pill colour.
  sage: '#9AAD8C',
  sageWash: '#E3E9D8',
  // The ground the logo sits on.
  logoGround: '#FFFFFF',
  // Deep enough to read as small text on cream and on white.
  alert: '#B94A42',
};

export const colors = {
  ...palette,
  // `forest` is an older name for the primary accent, kept so every screen
  // keeps working. New code should use accent.
  forest: palette.accent,
};

// The five points of the mood scale, in order: muted at the low end, warm at
// the high end. Used by the chart, the calendar and anywhere a recorded mood
// is shown as a colour. Light enough for ink text to sit on them.
export const moodColours = ['#BDB4AC', '#D4C3AE', '#C5D0B4', '#F1C4A8', '#E8956F'];
export const moodFaces = ['😞', '🙁', '😐', '🙂', '😊'];

// The learning library's cards: soft pastels on the cream page. Tints cycle,
// so a library of any length keeps its rhythm.
export const cardTints = [
  {bg: '#FBE6D9', icon: '#F4CDB6'},
  {bg: '#E9EEDF', icon: '#D3DDC3'},
  {bg: '#FAF0DC', icon: '#F0DDB5'},
  {bg: '#F7E3E0', icon: '#EDC7C1'},
];
// Text and icons that sit on one of those tints.
export const onTint = palette.ink;
export const heart = '#D9605A';

export const type = {
  display: {fontFamily: 'serif', fontSize: 44, color: colors.ink},
  title: {fontFamily: 'serif', fontSize: 26, color: colors.ink},
  body: {fontSize: 15, lineHeight: 22, color: colors.inkSoft},
  label: {fontSize: 15, color: colors.ink},
  small: {fontSize: 13, color: colors.inkFaint},
};

export const space = {
  screen: 28,
  gap: 12,
  section: 32,
};

export const radius = {
  card: 18,
  pill: 28,
};
