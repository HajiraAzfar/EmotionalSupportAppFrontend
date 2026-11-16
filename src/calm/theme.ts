// The Calm module's whole look: colours, type, spacing, sizes and timings.
// Every Calm component reads from here and nowhere else, so restyling the
// module is an edit to this one file.
//
// Colours and fonts map to the app's shared theme in this file only; the sizes
// and timings are neutral placeholders until the module has its own design.
import {cardTints, colors as app, font as appFont, gradient as appGradient, shadow as appShadow} from '../theme';

export const colors = {
  bg: app.bg,
  surface: app.surface,
  ink: app.ink,
  inkSoft: app.inkSoft,
  inkFaint: app.inkFaint,
  line: app.line,
  primary: app.accent,
  onPrimary: app.onAccent,
  // A chosen option, and the soft fill behind a secondary button.
  selected: app.accentWash,
  // The breathing circle: a soft fill with a stronger edge.
  circle: app.accentSoft,
  circleEdge: app.accent,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  title: 24,
  heading: 18,
  body: 15,
  small: 13,
  countdown: 40,
};

export const radius = {
  card: 16,
  pill: 999,
};

export const border = {
  width: 1,
};

// Buttons and options stay at least this tall, so they are easy to hit.
export const touch = {
  minHeight: 48,
};

export const icon = {
  size: 20,
};

// The exercise tiles: a soft circle behind each icon (lavender, peach, sage,
// warm yellow, cycling) and the app's soft card shadow.
export const tints = [cardTints[2].icon, cardTints[0].icon, cardTints[1].icon, cardTints[3].icon];
export const tileShadow = appShadow.sm;

// The primary button's soft gradient and lift, and the step card's shadow.
export const gradient = {primary: appGradient.primary};
export const buttonShadow = appShadow.button;
export const cardShadow = appShadow.md;

// The breathing flower: six petals in the brand's soft tones, see-through so
// where they overlap reads deeper; and the halo behind them.
export const petals = [
  'rgba(139, 163, 141, 0.55)',
  'rgba(205, 188, 230, 0.55)',
  'rgba(247, 201, 170, 0.55)',
  'rgba(139, 163, 141, 0.55)',
  'rgba(205, 188, 230, 0.55)',
  'rgba(247, 201, 170, 0.55)',
];
export const halo = app.sageWash;
export const ringTrack = app.line;

// The breathing circle's diameter at the bottom and top of a breath.
export const circle = {
  min: 120,
  max: 240,
};

export const motion = {
  // With reduce motion on, the circle keeps its size and fades instead.
  fadeLow: 0.45,
  fadeHigh: 1,
  // A disabled control.
  disabledOpacity: 0.5,
  pressedOpacity: 0.85,
};

export const text = {
  title: {fontFamily: appFont.serifBold, fontSize: fontSize.title, color: colors.ink},
  heading: {fontFamily: appFont.serif, fontSize: fontSize.heading, color: colors.ink},
  body: {
    fontFamily: appFont.regular,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    color: colors.inkSoft,
  },
  small: {fontFamily: appFont.medium, fontSize: fontSize.small, color: colors.inkFaint},
  button: {fontFamily: appFont.semibold, fontSize: fontSize.body},
  link: {fontFamily: appFont.semibold, fontSize: fontSize.small, color: colors.primary},
  countdown: {fontFamily: appFont.bold, fontSize: fontSize.countdown, color: colors.ink},
};
