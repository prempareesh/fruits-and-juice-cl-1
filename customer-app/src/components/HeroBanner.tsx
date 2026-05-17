import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, useWindowDimensions, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

export const HeroBanner = () => {
  const { width: windowWidth } = useWindowDimensions();
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  
  const isLargeScreen = windowWidth > 768;
  const imageSize = isLargeScreen ? 200 : 120;
  const imageHeight = isLargeScreen ? 260 : 160;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 2500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, isLargeScreen && { maxWidth: 1200, alignSelf: 'center', width: '100%' }]}>
      <LinearGradient
        colors={['#FFF1D6', '#FFE4B5']}
        style={[styles.gradient, isLargeScreen && { padding: SPACING.xl }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.leftContent}>
          <Text style={[styles.title, isLargeScreen && { fontSize: 32, lineHeight: 40 }]}>There is a juice for every occasion.</Text>
          <Text style={[styles.subtext, isLargeScreen && { fontSize: 18 }]}>Freshly squeezed with love and care.</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>10%</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>0%</Text>
              <Text style={styles.statLabel}>Sugar</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>90%</Text>
              <Text style={styles.statLabel}>Vitamins</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
            <Text style={styles.ctaText}>ORDER NOW</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.imageContainer, { transform: [{ translateY: floatAnim }] }]}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=400' }} 
            style={[styles.heroImage, { width: imageSize, height: imageHeight }]}
            resizeMode="contain"
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  gradient: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 220,
  },
  leftContent: {
    flex: 1,
    zIndex: 2,
  },
  title: {
    ...TYPOGRAPHY.h2,
    lineHeight: 28,
    marginBottom: SPACING.xs,
    color: '#3d2b1f',
  },
  subtext: {
    ...TYPOGRAPHY.subtext,
    marginBottom: SPACING.md,
    color: '#5c4d42',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryOrange,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.mutedGray,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 12,
  },
  ctaButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    elevation: 4,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  imageContainer: {
    flex: 0.5,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  heroImage: {
    // Width and height handled dynamically
  },
});
