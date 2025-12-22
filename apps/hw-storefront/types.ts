export interface PricelistPrice {
  priceListId: string;
  priceListName: string;
  price: number;
  overrideType: string;
  overrideValue: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  images?: string[];
  description?: string;
  sizes?: string[];
  colors?: string[];
  selectedColor?: string;
  slug?: string; // URL-friendly slug for routing
  pricelistPrices?: PricelistPrice[]; // All available pricelist prices
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  avatar?: string;
}

export interface CartItem extends Product {
  cartId: string; // Unique ID for this specific instance in cart (combines id + size + color)
  selectedSize: string;
  quantity: number;
}

export interface BundleConfig {
  count: number;
  price: number;
  originalPrice: number;
  savings: string;
  image: string;
}

export interface ColorOption {
  name: string;
  hex: string;
  image: string;
}

export interface Address {
  id: string;
  type: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedSize: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
}

export interface User {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  orders: Order[];
  wishlist: Product[];
}
