import React from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { SPACING, RADIUS } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PromoBanner = () => {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity activeOpacity={0.9} style={styles.container}>
        <Image 
          source={require('../../assets/promo_banner.png')} 
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    width: '100%',
  },
  container: {
    width: '100%',
    aspectRatio: 2.1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#064e3b',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
});
