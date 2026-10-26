// The Reframe theme (the "Calmora" brand board, 26 Oct): a warm ivory page, white cards with
// soft forest-tinted shadows, deep forest ink, a sage green primary, and pale
// sage, soft peach and muted lavender as the soft accents. Every screen reads
// its colours, fonts, radii and shadows from here, so this file is the only
// place a theme change happens.
//
// The token names are older than this palette and describe a role, not a hue:
// `sage` is the medium accent for selected borders, spinners and charts, `sky`
// is the second tone (muted lavender), and `coral` / `blush` are the peach.
const palette = {
  // The page itself: warm ivory. ScreenBackground fades it into bgDeep.
  bg: '#FAF6EE',
  bgDeep: '#EFF1E7',
  // Cards are plain white, set off from the page by a hairline.
  surface: '#FFFFFF',
  // A pressed card, a chip, or a cell set into one: a shade off white.
  surfaceRaised: '#F3F5EF',
  // Frosted glass: translucent white with a brighter edge.
  glass: 'rgba(255, 255, 255, 0.78)',
  glassEdge: 'rgba(255, 255, 255, 0.92)',
  // Deep forest text.
  ink: '#2E4232',
  inkSoft: '#4F5F52',
  // Deep enough to pass AA as small text on white and on the ivory page.
  inkFaint: '#66726A',
  // A hairline, not a border: the edge of a white card on the page.
  line: '#E7EAE0',
  // Tracks, dividers and empty dots.
  muted: '#D5DCCF',
  // Soft peach: fills behind cards and notes.
  blush: '#FCEDE2',
  // Peach: decoration and emphasis. Too light for text on white.
  coral: '#F7C9AA',
  coralSoft: '#FCEDE2',
  // Sage green primary: buttons, the user's chat bubbles, links. White text
  // on it passes AA (5.9:1).
  accent: '#4F6B53',
  // The light end of the primary gradient; white text still passes AA on it.
  accentLight: '#5A7A5E',
  // Pale sage: disabled buttons, soft fills.
  accentSoft: '#B9CBB5',
  accentWash: 'rgba(79, 107, 83, 0.10)',
  // Text and spinners that sit on top of an accent colour.
  onAccent: '#FFFFFF',
  // Sage: selected borders, spinners and charts; the wash is the pill colour.
  sage: '#8BA38D',
  sageWash: '#DCE6D9',
  // Sage green: botanical accents and calm, positive moments.
  leaf: '#C9D8C2',
  // A sage deep enough for icons and large text on white.
  leafDeep: '#5E7A57',
  // Muted lavender: the second tone, for the page wash and charts.
  sky: '#CDBCE6',
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
  dawn: 'linear-gradient(180deg, #DCE6D9 0%, #FCEDE2 60%, #FAF6EE 100%)',
  // Soft card fills: the featured card (`lavender`, now pale sage; the name is
  // older than the palette) and a quiet note (peach).
  lavender: 'linear-gradient(135deg, #DCE6D9 0%, #EAF0E6 55%, #F6F1E6 100%)',
  blush: 'linear-gradient(135deg, #FCEDE2 0%, #FBF3EA 60%, #FAF6EE 100%)',
};

// The five points of the mood scale, in order from Very low to Great, in the
// brand's emoji set: rose, lavender, warm yellow, pink, sage. Used by the
// chart, the calendar and anywhere a recorded mood is shown as a colour.
// Light enough for ink text to sit on them.
// Each point's face is drawn by components/MoodFace in the same colour.
export const moodColours = ['#F5C4BC', '#D9CCEE', '#FBE1B6', '#F4D2DC', '#C6DABD'];

// The learning library's cards: soft pastels on the page (lavender, peach,
// sage, warm yellow). Tints cycle, so a library of any length keeps its rhythm.
export const cardTints = [
  {bg: '#F2EEF8', icon: '#E2D9F1'},
  {bg: '#FDF0E6', icon: '#FADCC7'},
  {bg: '#EEF3EA', icon: '#DCE6D9'},
  {bg: '#FBF5E4', icon: '#F3E5BF'},
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

// Soft, forest-tinted shadows, drawn natively by React Native's boxShadow.
export const shadow = {
  sm: {boxShadow: '0px 2px 8px rgba(46, 66, 50, 0.06)'},
  md: {boxShadow: '0px 8px 24px rgba(79, 107, 83, 0.10)'},
  button: {boxShadow: '0px 8px 20px rgba(79, 107, 83, 0.28)'},
  // Cast upwards, for the tab bar along the bottom edge.
  bar: {boxShadow: '0px -4px 20px rgba(79, 107, 83, 0.08)'},
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
