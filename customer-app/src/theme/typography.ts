import { Platform, TextStyle } from 'react-native';

export const TYPOGRAPHY = {
  // Premium Plus Jakarta Sans for Headers
  h1: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: '700',
    fontSize: 42,
    lineHeight: 48,
    color: '#1A1A1A',
  } as TextStyle,
  h2: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: '700',
    fontSize: 28, // Scaled down slightly for modern UI
    lineHeight: 34,
    color: '#1A1A1A',
  } as TextStyle,
  h3: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#1A1A1A',
  } as TextStyle,
  
  // Inter for Body & Labels
  body: {
    fontFamily: '"Inter", sans-serif',
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  } as TextStyle,
  label: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: '#1DA34D',
  } as const as TextStyle,
  price: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: '700',
    fontSize: 18,
    color: '#1A1A1A',
  } as TextStyle,
  subtext: {
    fontFamily: '"Inter", sans-serif',
    fontSize: 13,
    color: '#6B7280',
  } as TextStyle,
  caption: {
    fontFamily: '"Inter", sans-serif',
    fontSize: 12,
    color: '#6B7280',
  } as TextStyle,
};
