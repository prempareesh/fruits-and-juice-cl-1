import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../../theme/tokens';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: Icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.delay(200).springify()} 
        style={styles.iconContainer}
      >
        <View style={styles.glow} />
        <Icon size={64} color={COLORS.primaryGreen} strokeWidth={1.5} />
      </Animated.View>
      
      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      {actionLabel && onAction && (
        <Animated.View entering={FadeInUp.delay(600).springify()}>
          <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  content: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.darkText,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.mutedGray,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: RADIUS.full,
    elevation: 4,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
