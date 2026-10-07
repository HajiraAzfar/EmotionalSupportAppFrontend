// The lavender theme: a pale lilac page, white rounded cards, deep navy ink,
// a violet accent for buttons and the user's chat bubbles, and pink for
// emphasis. Every screen reads its colours from here, so this file is the only
// place a theme change happens.
const palette = {
  // The page itself: pale lilac.
  bg: '#F5F3FF',
  // Cards are plain white, set off from the lilac by a hairline.
  surface: '#FFFFFF',
  // A pressed card, or a cell set into one: a shade deeper than the page.
  surfaceRaised: '#ECE8FD',
  // The home screen's cards, and the ink on them.
  card: '#FFFFFF',
  onCard: '#2B2950',
  onCardSoft: '#55527A',
  ink: '#2B2950',
  inkSoft: '#55527A',
  inkFaint: '#6F6C93',
  // A hairline, not a border: the edge of a white card on the lilac.
  line: '#E2DDF6',
  // Light lilac: the home screen's journal cards.
  blush: '#EAE5FF',
  // Pink: the AI Chat button and anything that needs to stand out.
  coral: '#EE82AE',
  coralSoft: '#F6B9D3',
  // Violet: buttons, the user's chat bubbles, links. Deep enough that white
  // text on it stays readable.
  accent: '#6D5BE0',
  accentSoft: '#A89AF0',
  accentWash: 'rgba(109, 91, 224, 0.10)',
  // Text and spinners that sit on top of an accent colour.
  onAccent: '#FFFFFF',
  // Periwinkle: borders, spinners and charts; the wash is the pill colour.
  sage: '#8EA2EE',
  sageWash: '#E6EAFD',
  // The ground the logo sits on.
  logoGround: '#FFFFFF',
  // Deep enough to read as small text on lilac and on white.
  alert: '#B8325A',
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
export const moodColours = ['#CBC8DC', '#B9B2EA', '#A79CF1', '#F6B9D3', '#EE82AE'];
export const moodFaces = ['😞', '🙁', '😐', '🙂', '😊'];

// The learning library's cards: soft pastels on the lilac page. Tints cycle,
// so a library of any length keeps its rhythm.
export const cardTints = [
  {bg: '#EEEAFE', icon: '#DCD4FC'},
  {bg: '#FCE8F1', icon: '#F7CFE1'},
  {bg: '#E7EDFD', icon: '#CFDBFB'},
  {bg: '#F3ECFB', icon: '#E3D5F6'},
];
// Text and icons that sit on one of those tints.
export const onTint = palette.ink;
export const heart = '#D9477E';

// Headings are a bold sans, as in the design, rather than a serif.
export const type = {
  display: {fontSize: 40, fontWeight: '700' as const, color: colors.ink},
  title: {fontSize: 26, fontWeight: '700' as const, color: colors.ink},
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
