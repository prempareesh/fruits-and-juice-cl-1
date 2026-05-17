import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ImageBackground, 
  Animated,
  Platform
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const SLIDE_HEIGHT = 220;

const slides = [
  {
    img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=800",
    text: ["FRESH SQUEEZED", "PERFECTION"],
    subtext: "Taste the Nature's Best"
  },
  {
    img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800",
    text: ["BUY 1 GET 1", "FREE OFFER"],
    subtext: "Exclusive Summer Deal"
  },
  {
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    text: ["100% ORGANIC", "INGREDIENTS"],
    subtext: "Pure, Healthy, & Delicious"
  },
  {
    img: "https://images.unsplash.com/photo-1622597467827-4309112bba21?auto=format&fit=crop&q=80&w=800",
    text: ["FAST DOORSTEP", "DELIVERY"],
    subtext: "Chilled & Ready to Drink"
  },
];

export default function Slideshow() {
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const transition = useCallback((nextIndex: number) => {
    // Fade out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start(() => {
      setCurrent(nextIndex);
      slideAnim.setValue(20);
      
      // Fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: Platform.OS !== 'web',
        })
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const nextSlide = () => transition((current + 1) % slides.length);
  const prevSlide = () => transition((current - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000); // Slow slide every 5 seconds
    return () => clearInterval(timer);
  }, [current, nextSlide]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.slideWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <ImageBackground
          source={{ uri: slides[current].img }}
          style={styles.backgroundImage}
          imageStyle={{ borderRadius: RADIUS.lg }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          >
            <View style={styles.textContainer}>
              <View>
                {slides[current].text.map((t, j) => (
                  <Text key={j} style={styles.slideText}>{t}</Text>
                ))}
              </View>
              <Text style={styles.subtext}>{slides[current].subtext}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.navBtn} onPress={prevSlide}>
          <ChevronLeft color={COLORS.white} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={nextSlide}>
          <ChevronRight color={COLORS.white} size={24} />
        </TouchableOpacity>
      </View>

      {/* Indicators */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.indicator, 
              i === current && styles.indicatorActive
            ]} 
          />
        ))}
      </View>

      {/* Counter */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          0{current + 1} <Text style={{ color: 'rgba(255,255,255,0.5)' }}>/ 0{slides.length}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    height: SLIDE_HEIGHT,
    position: 'relative',
    marginTop: SPACING.sm,
  },
  slideWrapper: {
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  backgroundImage: {
    flex: 1,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'flex-end',
  },
  textContainer: {
    gap: 4,
  },
  slideText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  subtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  controls: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    marginTop: -20,
    zIndex: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: COLORS.white,
  },
  counter: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  counterText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
