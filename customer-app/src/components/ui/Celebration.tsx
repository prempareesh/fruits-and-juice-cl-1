import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const EMOJIS = ['🎉', '🍊', '🍎', '✨', '🥤', '🥳', '🍓'];

export const Celebration = ({ onComplete }: { onComplete?: () => void }) => {
  const particles = useRef([...Array(25)].map(() => ({
    x: new Animated.Value(width / 2),
    y: new Animated.Value(height / 2),
    opacity: new Animated.Value(1),
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    scale: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    const animations = particles.map((p) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 200 + 100;
      const destX = width / 2 + Math.cos(angle) * distance;
      const destY = height / 2 + Math.sin(angle) * distance;

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: destX,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(p.y, {
          toValue: destY,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 1000,
          delay: 500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(p.scale, {
          toValue: Math.random() * 1.5 + 1,
          useNativeDriver: Platform.OS !== 'web',
        })
      ]);
    });

    Animated.parallel(animations).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale }
              ],
              opacity: p.opacity,
            }
          ]}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
});
