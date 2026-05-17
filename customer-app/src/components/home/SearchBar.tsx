import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Search, Mic } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS, RADIUS } from '@/src/theme/tokens';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
} from 'react-native-reanimated';

const PLACEHOLDERS = [
  'Search "fresh fruits"',
  'Search "organic vegetables"',
  'Search "cold pressed juices"',
  'Search "daily essentials"',
  'Search "farm fresh deals"'
];

export const SearchBar = ({ value, onChangeText }: { value: string, onChangeText: (t: string) => void }) => {
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 400 })
      );
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: withTiming(opacity.value === 1 ? 0 : -5, { duration: 400 }) }]
  }));

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Search size={20} color={COLORS.primaryGreen} strokeWidth={2.5} style={styles.icon} />
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder=""
            placeholderTextColor="transparent"
          />
          {!value && (
            <Animated.View pointerEvents="none" style={[styles.placeholderOverlay, animatedStyle]}>
              <Text style={styles.placeholderText}>{PLACEHOLDERS[index]}</Text>
            </Animated.View>
          )}
        </View>
        <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
          <Mic size={20} color={COLORS.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  placeholderOverlay: {
    position: 'absolute',
    left: 0,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: '500',
  },
  micBtn: {
    paddingLeft: SPACING.md,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    marginLeft: SPACING.sm,
  },
});
