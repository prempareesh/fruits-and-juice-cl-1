const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const PRODUCTS = [
  // FRUITS
  {
    name: 'Royal Gala Apples',
    description: 'Crisp, sweet and delicious apples imported from premium orchards.',
    category: 'Fruits',
    price: 180,
    original_price: 220,
    discount_percent: 18,
    stock: 45,
    quantity: '1 kg',
    image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bccb?w=400&q=80',
    is_featured: true,
    is_trending: true
  },
  {
    name: 'Alphonso Mango',
    description: 'The king of mangoes. Extremely sweet and pulpy.',
    category: 'Fruits',
    price: 450,
    original_price: 600,
    discount_percent: 25,
    stock: 20,
    quantity: '1 kg',
    image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
    is_featured: true,
    is_trending: true
  },
  {
    name: 'Robusta Banana',
    description: 'Fresh and energy-packed bananas.',
    category: 'Fruits',
    price: 60,
    original_price: 80,
    discount_percent: 25,
    stock: 100,
    quantity: '1 kg',
    image_url: 'https://images.unsplash.com/photo-1571771894821-ad99026a0947?w=400&q=80',
    is_featured: false,
    is_trending: true
  },
  {
    name: 'Nagpur Orange',
    description: 'Juicy and citrus-rich oranges from Nagpur.',
    category: 'Fruits',
    price: 120,
    original_price: 150,
    discount_percent: 20,
    stock: 60,
    quantity: '1 kg',
    image_url: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
    is_featured: false,
    is_trending: false
  },

  // VEGETABLES
  {
    name: 'Organic Carrots',
    description: 'Crunchy and sweet organic carrots.',
    category: 'Vegetables',
    price: 40,
    original_price: 60,
    discount_percent: 33,
    stock: 80,
    quantity: '1 kg',
    image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
    is_featured: false,
    is_trending: true
  },
  {
    name: 'Hybrid Tomato',
    description: 'Firm and juicy tomatoes, perfect for salads and curries.',
    category: 'Vegetables',
    price: 30,
    original_price: 45,
    discount_percent: 33,
    stock: 150,
    quantity: '1 kg',
    image_url: 'https://images.unsplash.com/photo-1561131245-c9302e082ee8?w=400&q=80',
    is_featured: true,
    is_trending: false
  },
  {
    name: 'Premium Potato',
    description: 'High-quality potatoes for all your cooking needs.',
    category: 'Vegetables',
    price: 25,
    original_price: 35,
    discount_percent: 28,
    stock: 200,
    quantity: '1 kg',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
    is_featured: false,
    is_trending: false
  },

  // JUICES
  {
    name: 'Fresh Mango Juice',
    description: 'Pure alphonso mango nectar with no added sugar.',
    category: 'Juices',
    price: 120,
    original_price: 150,
    discount_percent: 20,
    stock: 30,
    quantity: '350 ml',
    image_url: 'https://images.unsplash.com/photo-1546173159-315724a93c9c?w=400&q=80',
    is_featured: true,
    is_trending: true
  },
  {
    name: 'Banana Protein Shake',
    description: 'A thick and creamy banana shake with protein boost.',
    category: 'Juices',
    price: 150,
    original_price: 180,
    discount_percent: 16,
    stock: 25,
    quantity: '350 ml',
    image_url: 'https://images.unsplash.com/photo-1550583724-b26cc28df5d1?w=400&q=80',
    is_featured: false,
    is_trending: false
  },
  {
    name: 'Fresh Orange Juice',
    description: 'Cold-pressed orange juice, 100% vitamin C.',
    category: 'Juices',
    price: 99,
    original_price: 129,
    discount_percent: 23,
    stock: 40,
    quantity: '350 ml',
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
    is_featured: true,
    is_trending: true
  }
];

async function seed() {
  console.log('Clearing old products...');
  const { error: delError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (delError) {
    console.error('Error clearing products:', delError);
    return;
  }

  console.log('Seeding realistic production products...');
  const { error: insError } = await supabase.from('products').insert(PRODUCTS);

  if (insError) {
    console.error('Error seeding products:', insError);
  } else {
    console.log('SUCCESS: All realistic products seeded!');
  }
}

seed();
