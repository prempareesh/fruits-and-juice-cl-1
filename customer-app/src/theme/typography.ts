import { Platform, TextStyle } from 'react-native';

export const TYPOGRAPHY = {
  // Premium Calibri Bold for Headers
  h1: {
    fontFamily: 'Calibri',
    fontWeight: '700',
    fontSize: 42,
    lineHeight: 48,
    color: '#1A1A1A',
  } as TextStyle,
  h2: {
    fontFamily: 'Calibri',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38,
    color: '#1A1A1A',
  } as TextStyle,
  h3: {
    fontFamily: 'Calibri',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 30,
    color: '#1A1A1A',
  } as TextStyle,
  
  // Calibri for Body & Labels
  body: {
    fontFamily: 'Calibri',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  } as TextStyle,
  label: {
    fontFamily: 'Calibri',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: '#E67E22',
  } as const as TextStyle,
  price: {
    fontFamily: 'Calibri',
    fontWeight: '700',
    fontSize: 18,
    color: '#1A1A1A',
  } as TextStyle,
  subtext: {
    fontFamily: 'Calibri',
    fontSize: 14,
    color: '#6B7280',
  } as TextStyle,
  caption: {
    fontFamily: 'Calibri',
    fontSize: 12,
    color: '#6B7280',
  } as TextStyle,
};
