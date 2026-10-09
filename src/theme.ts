// The Mind Doc theme: a pale periwinkle page, white and frosted-glass cards,
// deep navy ink, a violet primary for buttons and the user's chat bubbles,
// lavender and pink for softer accents. Every screen reads its colours, fonts,
// radii and shadows from here, so this file is the only place a theme change
// happens.
//
// The hex values were sampled from a low-resolution brand board, so they are
// close to, not exactly, the brand's own values.
const palette = {
  // The page itself: pale periwinkle. ScreenBackground fades it into bgDeep.
  bg: '#F4F5FC',
  bgDeep: '#E9ECFA',
  // Cards are plain white, set off from the page by a hairline.
  surface: '#FFFFFF',
  // A pressed card, a chip, or a cell set into one: a shade off white.
  surfaceRaised: '#F2F5FD',
  // Frosted glass: translucent white with a brighter edge.
  glass: 'rgba(255, 255, 255, 0.72)',
  glassEdge: 'rgba(255, 255, 255, 0.9)',
  ink: '#2E3A5F',
  inkSoft: '#4E5875',
  // Deep enough to pass AA as small text on white and on the page.
  inkFaint: '#667089',
  // A hairline, not a border: the edge of a white card on the page.
  line: '#E8ECF5',
  // Tracks, dividers and empty dots.
  muted: '#D3DBEE',
  // Light lavender: the home screen's journal cards.
  blush: '#EEEBFF',
  // Pink: decoration and emphasis. Too light for text on white.
  coral: '#F69AEB',
  coralSoft: '#FBD3F5',
  // Violet primary: buttons, the user's chat bubbles, links. White text on it
  // passes AA.
  accent: '#6B52F9',
  // The light end of the primary gradient.
  accentLight: '#8E7DFB',
  // Lavender secondary: disabled buttons, soft fills.
  accentSoft: '#B4A5FB',
  accentWash: 'rgba(107, 82, 249, 0.10)',
  // Text and spinners that sit on top of an accent colour.
  onAccent: '#FFFFFF',
  // Periwinkle: selected borders, spinners and charts; the wash is the pill colour.
  sage: '#8B9CF9',
  sageWash: '#ECEFFE',
  // Sky blue: the cool end of the logo, and charts.
  sky: '#5BD4F7',
  // Not on the brand board: a rose deep enough to read as small text.
  alert: '#C93A60',
};

export const colors = {
  ...palette,
  // `forest` is an older name for the primary accent, kept so every screen
  // keeps working. New code should use accent.
  forest: palette.accent,
};

// CSS gradients, drawn natively by React Native's backgroundImage.
export const gradient = {
  primary: `linear-gradient(90deg, ${palette.accent}, ${palette.accentLight})`,
  // ponytail: stands in for the design's pastel mountain-lake illustrations
  // until real artwork is added.
  landscape: 'linear-gradient(180deg, #B9C6FB 0%, #E9C6F2 45%, #F8D9E6 55%, #A9B8F4 100%)',
};

// The logo's ribbon runs blue, violet, pink.
export const logoColours = ['#5B8CF8', palette.accent, '#E996EC'];

// The five points of the mood scale, in order: cool at the low end, warm at
// the high end. Used by the chart, the calendar and anywhere a recorded mood
// is shown as a colour. Light enough for ink text to sit on them.
export const moodColours = ['#C9D2EE', '#B9C6FB', '#B4A5FB', '#F3C2EE', '#F69AEB'];
export const moodFaces = ['😞', '🙁', '😐', '🙂', '😊'];

// The learning library's cards: soft pastels on the page. Tints cycle, so a
// library of any length keeps its rhythm.
export const cardTints = [
  {bg: '#EFECFF', icon: '#DDD6FE'},
  {bg: '#FDEBFA', icon: '#F9D3F3'},
  {bg: '#E6F7FD', icon: '#C8EEFB'},
  {bg: '#EEF1FD', icon: '#DCE3FB'},
];
// Text and icons that sit on one of those tints.
export const onTint = palette.ink;
export const heart = '#E15BB8';

// Plus Jakarta Sans, one file per weight (android/app/src/main/assets/fonts).
// Set the weight by picking the family; never add fontWeight on top, or
// Android fakes a bolder weight over the real one.
export const font = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
};

// Bold for headlines, SemiBold for buttons and emphasis, Regular for body,
// Medium for captions and labels.
export const type = {
  display: {fontFamily: font.bold, fontSize: 30, color: colors.ink},
  title: {fontFamily: font.bold, fontSize: 24, color: colors.ink},
  heading: {fontFamily: font.bold, fontSize: 18, color: colors.ink},
  label: {fontFamily: font.semibold, fontSize: 15, color: colors.ink},
  body: {fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: colors.inkSoft},
  small: {fontFamily: font.medium, fontSize: 13, color: colors.inkFaint},
  tiny: {fontFamily: font.medium, fontSize: 11, color: colors.inkFaint},
  link: {fontFamily: font.semibold, fontSize: 13, color: colors.accent},
};

export const space = {
  screen: 24,
  section: 32,
};

export const radius = {
  // The corner a chat bubble points from.
  tail: 6,
  tile: 14,
  input: 16,
  card: 20,
  image: 24,
  pill: 999,
};

// Soft, lavender-tinted shadows, drawn natively by React Native's boxShadow.
export const shadow = {
  sm: {boxShadow: '0px 2px 8px rgba(46, 58, 95, 0.06)'},
  md: {boxShadow: '0px 8px 24px rgba(107, 82, 249, 0.10)'},
  button: {boxShadow: '0px 8px 20px rgba(107, 82, 249, 0.30)'},
  // Cast upwards, for the tab bar along the bottom edge.
  bar: {boxShadow: '0px -4px 20px rgba(107, 82, 249, 0.08)'},
};

// A frosted-glass card. Real background blur would need a native module, so
// this is translucent white with a bright edge and a soft shadow.
export const glass = {
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.glassEdge,
  ...shadow.md,
};
