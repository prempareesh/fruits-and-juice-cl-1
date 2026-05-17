import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import PremiumCard from './PremiumCard';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (WINDOW_WIDTH - 48) / 2;

interface JuiceCardProps {
  id?: string;
  index?: number;
  imageUrl: string;
  category: string;
  title: string;
  price: number;
  onPress: () => void;
  onAddToCart?: () => void;
}

export const DestinationCard = ({
  id = 'juice',
  index = 0,
  imageUrl,
  category,
  title,
  price,
  onPress,
  onAddToCart,
}: JuiceCardProps) => {
  return (
    <PremiumCard
      id={id}
      index={index}
      title={title}
      price={price}
      imageUrl={imageUrl}
      onPress={onPress}
      onAddToCart={onAddToCart}
      category={category}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    marginBottom: 16,
  },
});
