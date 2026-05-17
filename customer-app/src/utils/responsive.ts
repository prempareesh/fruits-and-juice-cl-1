import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const wp = (widthPercent: string | number) => {
  const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_WIDTH * elemWidth / 100);
};

export const hp = (heightPercent: string | number) => {
  const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_HEIGHT * elemHeight / 100);
};

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isTablet = SCREEN_WIDTH >= 768;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
