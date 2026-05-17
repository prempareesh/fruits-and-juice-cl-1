import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@/src/theme/tokens';
import Animated, { FadeInRight } from 'react-native-reanimated';

const CATEGORIES = [
  { 
    id: 'fruit', 
    label: 'Fruits', 
    image: require('../../../assets/categories/cat_fruits.png')
  },
  { 
    id: 'vegetable', 
    label: 'Veggies', 
    image: require('../../../assets/categories/cat_veggies.png')
  },
  { 
    id: 'juice', 
    label: 'Juices', 
    image: require('../../../assets/categories/cat_juices.png')
  },
  { 
    id: 'others', 
    label: 'Others', 
    image: require('../../../assets/categories/cat_others.png')
  }
];

export const CategoryBar = ({ selected, onSelect }: { selected: string, onSelect: (id: string) => void }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity 
          style={styles.catCard}
          onPress={() => onSelect('all')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, selected === 'all' && styles.iconWrapperActive]}>
            <Image 
              source={require('../../../assets/categories/cat_all.png')} 
              style={styles.icon} 
            />
          </View>
          <Text style={[styles.catLabel, selected === 'all' && styles.catLabelActive]}>All Items</Text>
        </TouchableOpacity>

        {CATEGORIES.map((cat, idx) => (
          <Animated.View 
            key={cat.id}
            entering={FadeInRight.delay(idx * 100)}
          >
            <TouchableOpacity 
              style={styles.catCard}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, selected === cat.id && styles.iconWrapperActive]}>
                <Image source={cat.image} style={styles.icon} />
              </View>
              <Text style={[styles.catLabel, selected === cat.id && styles.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  catCard: {
    alignItems: 'center',
    width: 76,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...SHADOWS.sm,
    marginBottom: 8,
  },
  iconWrapperActive: {
    borderColor: COLORS.primaryGreen,
    backgroundColor: COLORS.primaryGreenLight,
  },
  icon: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  catLabelActive: {
    color: COLORS.primaryGreen,
    fontWeight: '800',
  },
});
