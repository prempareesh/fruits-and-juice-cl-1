"use client";

import React, { useMemo } from 'react';
import { Platform, View, Text, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { ProductService } from '../../services/ProductService';
import { COLORS } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';
import { BREAKPOINTS } from '../../theme/responsive';

interface ImageAutoSliderProps {
  products?: Array<{ image_url?: string } & Record<string, any>>;
}

export const ImageAutoSlider = ({ products = [] }: ImageAutoSliderProps) => {
  const { width: windowWidth } = useWindowDimensions();

  const images = useMemo(() => {
    if (products.length > 0) {
      return products.slice(0, 6).map(p => ProductService.getOptimizedImage(p.image_url, 600));
    }
    return [
      "https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=800&auto=format",
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=800&auto=format",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format",
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=800&auto=format",
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=800&auto=format",
      "https://images.unsplash.com/photo-1524799526615-766a9833dec0?q=80&w=800&auto=format"
    ];
  }, [products]);

  const duplicatedImages = [...images, ...images, ...images];

  // Luxury Redesign: Compact & Elegant proportions
  const cardSize = useMemo(() => {
    if (windowWidth >= BREAKPOINTS.LAPTOP) {
      return { width: 280, height: 350 };
    }
    if (windowWidth >= BREAKPOINTS.TABLET) {
      return { width: 240, height: 300 };
    }
    return { width: 180, height: 240 };
  }, [windowWidth]);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.outerWrapper}>
      <style>{`
        @keyframes scroll-right-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .infinite-scroll-v3 {
          animation: scroll-right-infinite 40s linear infinite;
        }
        .infinite-scroll-v3:hover {
          animation-play-state: paused;
        }
        .scroll-container-v3 {
          mask: linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask: linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%);
        }
        .image-item-v3 {
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .image-item-v3:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.2) !important;
        }
      `}</style>
      
      <View style={styles.header}>
        <Text style={styles.title}>Top Trending Freshness</Text>
        <Text style={styles.subtitle}>Curated selections for the sophisticated palate</Text>
      </View>

      <div className="scroll-container-v3" style={{ width: '100%', overflow: 'hidden', padding: '20px 0' }}>
        <div className="infinite-scroll-v3" style={{ display: 'flex', gap: '24px', width: 'max-content', padding: '0 40px' }}>
          {duplicatedImages.map((image, index) => (
            <div
              key={index}
              className="image-item-v3"
              style={{
                flexShrink: 0,
                width: `${cardSize.width}px`,
                height: `${cardSize.height}px`,
                borderRadius: '24px',
                overflow: 'hidden',
                backgroundColor: COLORS.softBeige,
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.03)'
              }}
            >
              <img
                src={image}
                alt={`Premium Selection ${index}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  filter: 'brightness(0.98)'
                }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingVertical: 40,
    backgroundColor: 'transparent',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 28,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.luxuryDark,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    ...TYPOGRAPHY.subtext,
    fontSize: 14,
    color: COLORS.mutedGray,
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
