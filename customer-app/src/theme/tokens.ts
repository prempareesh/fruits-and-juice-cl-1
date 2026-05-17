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
  primaryGreen: '#1DA34D',
  background: '#F7F9FB',
  // Backward compatibility aliases
  mutedGray: NEW_COLORS.muted,
  lightGray: NEW_COLORS.border,
  darkText: NEW_COLORS.dark,
  luxuryDark: '#1A1C1E',
  cream: '#FFF1D6',
  primaryOrange: '#FFAB00',
  luxuryGold: '#D4AF37',
  gold: '#FFD700',
  softBeige: '#F5F5DC',
  creamBackground: '#FFF9F0',
};

export const TYPOGRAPHY = {
  ...NEW_TYPOGRAPHY,
  subtext: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#637381',
  }
};

export const SPACING = NEW_SPACING;
export const RADIUS = NEW_RADIUS;
export const SHADOWS = NEW_SHADOWS;
