import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Platform, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';

interface FinancialHeroProps {
  title: React.ReactNode;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl1: string;
  imageUrl2: string;
  className?: string;
}

export const FinancialHero = ({
  title,
  description,
  buttonText,
  imageUrl1,
  imageUrl2,
}: FinancialHeroProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]).start();
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.section}>
      <View style={styles.gridOverlay} />
      <View style={styles.gradientOverlay} />

      <View style={styles.container}>
        {/* Left Content */}
        <Animated.View
          style={[styles.leftContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.descriptionText}>{description}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>{buttonText}</Text>
              <ArrowRight color="white" size={20} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Right Images */}
        <Animated.View
          style={[styles.rightContent, { opacity: fadeAnim }]}
        >
          <View style={styles.imageWrapper2}>
            <Image source={{ uri: imageUrl2 }} style={styles.heroImage} />
          </View>
          <View style={styles.imageWrapper1}>
            <Image source={{ uri: imageUrl1 }} style={styles.heroImage} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const isSmallWeb =
  Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth < 768;

const styles = StyleSheet.create({
  section: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 600,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  container: {
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 80,
    flexWrap: 'wrap',
  },
  leftContent: {
    flex: 1,
    minWidth: 320,
    paddingRight: 20,
  },
  titleText: {
    fontSize: isSmallWeb ? 32 : 64,
    fontWeight: '800',
    color: COLORS.luxuryDark,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    lineHeight: isSmallWeb ? 38 : 70,
  },
  descriptionText: {
    fontSize: 18,
    color: COLORS.mutedGray,
    marginTop: 24,
    maxWidth: 500,
    lineHeight: 28,
    fontFamily: TYPOGRAPHY.body.fontFamily,
  },
  buttonContainer: {
    marginTop: 40,
  },
  button: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.label.fontFamily,
  },
  rightContent: {
    flex: 1,
    minWidth: 320,
    height: isSmallWeb ? 300 : 500,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallWeb ? 40 : 0,
  },
  imageWrapper1: {
    position: 'absolute',
    width: 280,
    height: 380,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: COLORS.white,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    transform: [{ rotate: '8deg' }, { translateX: -50 }] as any,
  },
  imageWrapper2: {
    position: 'absolute',
    width: 280,
    height: 380,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: COLORS.white,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    transform: [{ rotate: '-12deg' }, { translateX: 50 }] as any,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
