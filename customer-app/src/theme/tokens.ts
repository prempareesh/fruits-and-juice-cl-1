import { 
  COLORS as NEW_COLORS, 
  SPACING as NEW_SPACING, 
  RADIUS as NEW_RADIUS,
  SHADOWS as NEW_SHADOWS 
} from './colors';
import { TYPOGRAPHY as NEW_TYPOGRAPHY } from './typography';

// Redirect old tokens to new luxury theme for stability
export const COLORS = {
  ...NEW_COLORS,
  white: '#FFFFFF',
  primaryGreen: '#2E7D32',
  creamBackground: '#FDFCF0',
};

export const TYPOGRAPHY = {
  ...NEW_TYPOGRAPHY,
  subtext: {
    fontFamily: 'Calibri',
    fontSize: 14,
    color: '#6B7280',
  }
};

export const SPACING = NEW_SPACING;
export const RADIUS = NEW_RADIUS;
export const SHADOWS = NEW_SHADOWS;
