// The brand's raster artwork, in one place. The sources are the brand images
// (22 Oct), processed by a script: the mark lifted to white-on-clear so it can
// be tinted, the watercolours as JPEG, the lavender sprig cut out of its page.
export const brandImages = {
  // The head-and-leaf mark, white on transparent: tint it with tintColor.
  mark: require('./mind-mark.png'),
  // Dawn over lavender hills: welcome, splash, article headers.
  landscape: require('./landscape.jpg'),
  // A woman writing at a window: journalling.
  journaling: require('./journaling.jpg'),
  // The same scene cropped wide (5:3) around her face, for banners.
  journalingWide: require('./journaling-wide.jpg'),
  // A lavender sprig on transparent: decoration.
  lavender: require('./lavender.png'),
};
