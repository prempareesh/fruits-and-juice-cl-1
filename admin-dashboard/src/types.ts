export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'juice' | 'fruit';
  image_url: string;
  is_available: boolean;
  price_per_kg?: number;
  stock_kg?: number;
  juice_variants?: JuiceVariant[];
}

export interface JuiceVariant {
  id: string;
  product_id: string;
  variant_type: 'normal' | 'very_pure';
  price: number;
  ml: number;
  stock_units: number;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  subtotal: number;
  products?: Product;
}

export interface Order {
  id: string;
  created_at: string;
  user_id: string;
  status: 'received' | 'processing' | 'completed' | 'cancelled';
  payment_type: 'online' | 'cod';
  address: string;
  formatted_address?: string;
  landmark?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  total_amount: number;
  profiles?: Profile;
  order_items?: OrderItem[];
}
