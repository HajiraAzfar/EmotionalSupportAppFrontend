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
