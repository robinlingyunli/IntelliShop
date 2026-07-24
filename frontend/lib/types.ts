export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  description: string | null;
  image_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  product: Product;
}

export interface Order {
  id: number;
  status: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}
