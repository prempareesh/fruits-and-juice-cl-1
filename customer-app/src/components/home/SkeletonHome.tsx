import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Shimmer = ({ style }: { style: any }) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1500 }), -1);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-width, width]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[styles.shimmerBase, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const SkeletonHome = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Shimmer style={styles.badge} />
        <Shimmer style={styles.address} />
      </View>
      <Shimmer style={styles.search} />
      <Shimmer style={styles.banner} />
      <View style={styles.categories}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Shimmer key={i} style={styles.catCircle} />
        ))}
      </View>
      <View style={styles.section}>
        <Shimmer style={styles.title} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} style={styles.card} />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  shimmerBase: { backgroundColor: '#F1F5F9', overflow: 'hidden' },
  header: { padding: 16, gap: 8 },
  badge: { width: 100, height: 16, borderRadius: 4 },
  address: { width: '70%', height: 24, borderRadius: 6 },
  search: { margin: 16, height: 52, borderRadius: 12 },
  banner: { marginHorizontal: 16, height: 180, borderRadius: 20 },
  categories: { flexDirection: 'row', padding: 16, gap: 16 },
  catCircle: { width: 64, height: 64, borderRadius: 32 },
  section: { padding: 16, gap: 16 },
  title: { width: 150, height: 24, borderRadius: 6 },
  card: { width: 160, height: 220, borderRadius: 16, marginRight: 16 },
});
