export interface Product {
  id: number;
  owner_id: number | null;
  name: string;
  category: string;
  price: string;
  discount_percentage: number | null;
  stock: number;
  description: string | null;
  image_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  role: "user" | "seller";
  created_at: string;
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

export interface PromotionItem {
  id: number;
  product_id: number;
  discount_percentage: number;
  product: Product;
}

export interface Promotion {
  id: number;
  title: string;
  image_path: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  items: PromotionItem[];
}

export interface SellerOrderItem {
  id: number;
  quantity: number;
  unit_price: string;
  product: Product;
  order_id: number;
  order_status: string;
  order_created_at: string;
  buyer_username: string;
}
