import React from 'react';
import PremiumCard from './ui/PremiumCard';

interface ProductCardProps {
  id?: string;
  index?: number;
  name: string;
  price: number;
  image: string;
  onPress: () => void;
  onAddToCart: () => void;
  isAvailable?: boolean;
  category?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id = 'product',
  index = 0,
  name,
  price,
  image,
  onPress,
  onAddToCart,
  isAvailable = true,
  category = 'Fresh Harvest',
}) => {
  return (
    <PremiumCard
      id={id}
      index={index}
      title={name}
      price={price}
      imageUrl={image}
      onPress={onPress}
      onAddToCart={onAddToCart}
      stock={isAvailable ? 1 : 0}
      category={category}
    />
  );
};

export default ProductCard;
