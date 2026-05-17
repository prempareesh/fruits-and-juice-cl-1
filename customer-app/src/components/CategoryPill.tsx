import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../theme/tokens';
import { scale, moderateScale } from '../utils/responsive';

interface CategoryPillProps {
  label: string;
  image?: string;
  color?: string;
  active: boolean;
  onPress: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  label,
  image,
  color = '#F8FAFC',
  active,
  onPress,
}) => {
  const scaleAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handlePressIn = useCallback(() => {
    scaleAnim.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.touchable}
      >
        <View 
          style={[
            styles.card, 
            { backgroundColor: active ? '#F0FDF4' : color },
            active && styles.activeCard
          ]}
        >
          <View style={styles.imageContainer}>
            {image && (
              Platform.OS === 'web' ? (
                <img 
                  src={image} 
                  alt={label} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              ) : (
                <Image source={{ uri: image }} style={styles.image} />
              )
            )}
          </View>
        </View>
        <Text style={[styles.label, active && styles.activeLabel]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  touchable: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: scale(60),
    height: scale(60),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px -4px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease',
      } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  activeCard: {
    borderColor: COLORS.primaryGreen,
    borderWidth: 2,
  },
  imageContainer: {
    width: '75%',
    height: '75%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  label: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    width: '100%',
  },
  activeLabel: {
    color: COLORS.primaryGreen,
    fontWeight: '800',
  },
});
