// mindDoc's palette, sampled from the brand designs: a dark navy page, white
// cards where a screen should feel light, blush pills, and the coral of the
// logo for emphasis. Every screen reads its colours from here, so this file is
// the only place a theme change happens.
const palette = {
  // The page itself stays solid; everything on top of it is glass.
  bg: '#2A2C40',
  // Cards are a thin sheet of light rather than a block of colour. They only
  // read as glass because ScreenBackground puts something behind them.
  surface: 'rgba(255, 255, 255, 0.09)',
  surfaceRaised: 'rgba(255, 255, 255, 0.14)',
  // The lighter sheet the home screen's cards use, and the ink on it.
  card: 'rgba(255, 255, 255, 0.12)',
  onCard: '#F3F1F9',
  onCardSoft: '#C2BFD4',
  ink: '#F3F1F9',
  inkSoft: '#C2BFD4',
  inkFaint: '#9A96AE',
  // A hairline, not a border: it is what gives a glass edge its shape.
  line: 'rgba(255, 255, 255, 0.18)',
  // Blush: the journal pills and the tab bar.
  blush: '#F3CFCE',
  // Coral, from the flowers in the logo, softened to sit in a pastel scheme.
  coral: '#F0968F',
  coralSoft: '#F6B6B1',
  // The pink the insights screens are drawn in.
  accent: '#F7C6D2',
  accentSoft: '#C9A9D8',
  accentWash: 'rgba(247, 198, 210, 0.16)',
  // Text and spinners that sit on top of an accent colour.
  onAccent: '#2A2C40',
  // The ground the logo sits on.
  logoGround: '#6B6A8A',
  alert: '#F4A6A6',
};

export const colors = {
  ...palette,
  // Older names from the light theme, kept so every screen keeps working.
  // They are slots, not descriptions: `forest` is the primary accent and
  // `sage` the secondary one. New code should use accent / accentSoft.
  forest: palette.accent,
  sage: palette.accentSoft,
  sageWash: palette.accentWash,
};

// The five points of the mood scale, in order. Used by the chart, the calendar
// and anywhere a recorded mood is shown as a colour.
export const moodColours = ['#7E7C9A', '#9A8FB8', '#B9A3C8', '#DDB4CB', '#F7C6D2'];
export const moodFaces = ['😞', '🙁', '😐', '🙂', '😊'];

// The learning library's cards are pastel on the dark page, as the design has
// them. Tints cycle, so a library of any length keeps its rhythm.
export const cardTints = [
  {bg: 'rgba(200, 226, 254, 0.14)', icon: 'rgba(200, 226, 254, 0.28)'},
  {bg: 'rgba(252, 235, 182, 0.14)', icon: 'rgba(252, 235, 182, 0.28)'},
  {bg: 'rgba(190, 239, 222, 0.14)', icon: 'rgba(190, 239, 222, 0.28)'},
  {bg: 'rgba(248, 207, 227, 0.14)', icon: 'rgba(248, 207, 227, 0.28)'},
];
// Text and icons that sit on one of those tints.
export const onTint = '#F3F1F9';
export const heart = '#F6A9AC';

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
