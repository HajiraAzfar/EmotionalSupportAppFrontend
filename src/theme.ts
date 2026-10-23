// The Mind Doc theme (brand brief, 22 Oct): a warm cream page, white cards
// with soft plum-tinted shadows, deep plum ink, a muted purple primary, and
// lavender, blush pink and sage green as the soft accents. Every screen reads
// its colours, fonts, radii and shadows from here, so this file is the only
// place a theme change happens.
//
// The token names are older than this palette and describe a role, not a hue:
// `sage` is the medium accent for selected borders, spinners and charts (now
// lavender), and `leaf` is the actual sage green.
const palette = {
  // The page itself: warm cream. ScreenBackground fades it into bgDeep.
  bg: '#FFF9F6',
  bgDeep: '#F6EEF4',
  // Cards are plain white, set off from the page by a hairline.
  surface: '#FFFFFF',
  // A pressed card, a chip, or a cell set into one: a shade off white.
  surfaceRaised: '#F8F2F8',
  // Frosted glass: translucent white with a brighter edge.
  glass: 'rgba(255, 255, 255, 0.78)',
  glassEdge: 'rgba(255, 255, 255, 0.92)',
  // Deep plum text.
  ink: '#30263B',
  inkSoft: '#54495F',
  // Deep enough to pass AA as small text on white and on the cream page.
  inkFaint: '#6F6680',
  // A hairline, not a border: the edge of a white card on the page.
  line: '#EFE6EE',
  // Tracks, dividers and empty dots.
  muted: '#DDD2E3',
  // Blush pink: soft fills behind cards and notes.
  blush: '#F6E7E9',
  // Rose pink: decoration and emphasis. Too light for text on white.
  coral: '#F4B8C2',
  coralSoft: '#F6E7E9',
  // Muted purple primary: buttons, the user's chat bubbles, links. White text
  // on it passes AA (6.1:1).
  accent: '#685895',
  // The light end of the primary gradient; white text still passes AA on it.
  accentLight: '#7E6BAE',
  // Lavender: disabled buttons, soft fills.
  accentSoft: '#B7A6DE',
  accentWash: 'rgba(104, 88, 149, 0.10)',
  // Text and spinners that sit on top of an accent colour.
  onAccent: '#FFFFFF',
  // Lavender: selected borders, spinners and charts; the wash is the pill colour.
  sage: '#A78BE3',
  sageWash: '#E8DDF3',
  // Sage green: botanical accents and calm, positive moments.
  leaf: '#C9D8C2',
  // A sage deep enough for icons and large text on white.
  leafDeep: '#5E7A57',
  // Second cool tone, for the page wash and charts.
  sky: '#C9D8C2',
  // A rose deep enough to read as small text.
  alert: '#B03A5B',
};

export const colors = {
  ...palette,
  // `forest` is an older name for the primary accent, kept so every screen
  // keeps working. New code should use accent.
  forest: palette.accent,
};

// CSS gradients, drawn natively by React Native's backgroundImage. Subtle on
// purpose: the brand is soft, and the light end keeps white text readable.
export const gradient = {
  primary: `linear-gradient(90deg, ${palette.accent}, ${palette.accentLight})`,
  // A dawn wash for headers that have no illustration.
  dawn: 'linear-gradient(180deg, #E8DDF3 0%, #F6E7E9 60%, #FFF9F6 100%)',
  // Soft card fills: the featured card (lavender) and a quiet note (blush).
  lavender: 'linear-gradient(135deg, #E8DDF3 0%, #F1EAF8 55%, #F6E7E9 100%)',
  blush: 'linear-gradient(135deg, #F6E7E9 0%, #FBF1F1 60%, #FFF9F6 100%)',
};

// The five points of the mood scale, in order: cool at the low end, warm at
// the high end. Used by the chart, the calendar and anywhere a recorded mood
// is shown as a colour. Light enough for ink text to sit on them.
// Each point's face is drawn by components/MoodFace in the same colour.
export const moodColours = ['#D3CDE0', '#BBAAE2', '#D8C6EF', '#F2CBD4', '#F4B2BF'];

// The learning library's cards: soft pastels on the page (lavender, blush,
// sage, peach). Tints cycle, so a library of any length keeps its rhythm.
export const cardTints = [
  {bg: '#F1EAF8', icon: '#E3D6F2'},
  {bg: '#FBEFF1', icon: '#F4D9DE'},
  {bg: '#EEF4EC', icon: '#D9E6D4'},
  {bg: '#FFF1EA', icon: '#F6DFD2'},
];
// Text and icons that sit on one of those tints.
export const onTint = palette.ink;
export const heart = '#D06A86';

// Playfair Display for headings, Inter for everything else; one file per
// weight (android/app/src/main/assets/fonts). Set the weight by picking the
// family; never add fontWeight on top, or Android fakes a bolder weight over
// the real one.
export const font = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  serif: 'PlayfairDisplay-SemiBold',
  serifBold: 'PlayfairDisplay-Bold',
};

// Serif for headlines, Inter SemiBold for buttons and emphasis, Regular for
// body, Medium for captions and labels.
export const type = {
  display: {fontFamily: font.serifBold, fontSize: 32, color: colors.ink},
  title: {fontFamily: font.serifBold, fontSize: 25, color: colors.ink},
  heading: {fontFamily: font.serif, fontSize: 19, color: colors.ink},
  label: {fontFamily: font.semibold, fontSize: 15, color: colors.ink},
  body: {fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.inkSoft},
  small: {fontFamily: font.medium, fontSize: 13, color: colors.inkFaint},
  // Text typed into a box.
  input: {fontFamily: font.regular, fontSize: 15},
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

// Soft, plum-tinted shadows, drawn natively by React Native's boxShadow.
export const shadow = {
  sm: {boxShadow: '0px 2px 8px rgba(48, 38, 59, 0.06)'},
  md: {boxShadow: '0px 8px 24px rgba(104, 88, 149, 0.10)'},
  button: {boxShadow: '0px 8px 20px rgba(104, 88, 149, 0.28)'},
  // Cast upwards, for the tab bar along the bottom edge.
  bar: {boxShadow: '0px -4px 20px rgba(104, 88, 149, 0.08)'},
};

// Axis labels inside the SVG charts.
export const chartLabel = {fontSize: 10, fontFamily: font.medium, fill: colors.inkFaint};

// A frosted-glass card. Real background blur would need a native module, so
// this is translucent white with a bright edge and a soft shadow.
export const glass = {
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.glassEdge,
  ...shadow.md,
};
