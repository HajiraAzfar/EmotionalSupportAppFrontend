// The brand's raster artwork, in one place. The sources are the brand images
// (22 Oct), processed by a script: the mark lifted to white-on-clear so it can
// be tinted, the watercolours as JPEG, the sprig cut out of its page. For the
// Calmora brand board (26 Oct) the watercolours were hue-shifted, lavender to
// sage and pink to peach.
export const brandImages = {
  // The head-and-leaf mark, white on transparent: tint it with tintColor.
  mark: require('./mind-mark.png'),
  // Dawn over misty green hills: welcome, splash, article headers.
  landscape: require('./landscape.jpg'),
  // A woman writing at a window: journalling.
  journaling: require('./journaling.jpg'),
  // The same scene cropped wide (5:3) around her face, for banners.
  journalingWide: require('./journaling-wide.jpg'),
  // A sage sprig on transparent: decoration. (The file name is older.)
  lavender: require('./lavender.png'),
};

// Hajira's illustration sheet (14 Nov), cut into one transparent PNG each
// (scratchpad crop script; boxes by hand, trimmed to alpha). The sheet was
// 1536 × 1024, so the icons are about 100 px: fine up to ~56 dp on screen.
export const illustrations = {
  hero: require('./illustrations/hero.png'),
  robot: require('./illustrations/robot.png'),
  books: require('./illustrations/books.png'),
  headphones: require('./illustrations/headphones.png'),
  journal: require('./illustrations/journal.png'),
  mug: require('./illustrations/mug.png'),
  calendar: require('./illustrations/calendar.png'),
  growthChart: require('./illustrations/growth-chart.png'),
  arch: require('./illustrations/arch.png'),
  cat: require('./illustrations/cat.png'),
  stones: require('./illustrations/stones.png'),
  lavender: require('./illustrations/lavender.png'),
  butterfly: require('./illustrations/butterfly.png'),
  notAlone: require('./illustrations/not-alone.png'),
  iconHeart: require('./illustrations/icon-heart.png'),
  iconLotus: require('./illustrations/icon-lotus.png'),
  iconLeaf: require('./illustrations/icon-leaf.png'),
  iconHeadHeart: require('./illustrations/icon-head-heart.png'),
  iconMeditate: require('./illustrations/icon-meditate.png'),
  iconStar: require('./illustrations/icon-star.png'),
  iconTrophy: require('./illustrations/icon-trophy.png'),
  iconChart: require('./illustrations/icon-chart.png'),
};
