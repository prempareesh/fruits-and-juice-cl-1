export interface Product {
  id: string;
  name: string;
  description?: string;
  category: 'Fruits' | 'Vegetables' | 'Juices' | 'Others';
  price: number;
  original_price: number;
  discount_percent: number;
  stock: number;
  quantity: string;
  image_url: string;
  is_featured: boolean;
  is_trending: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  inventoryValue: number;
  outOfStockCount: number;
  lowStockCount: number;
}
