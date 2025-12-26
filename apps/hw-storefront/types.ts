/**
 * Type exports from Zod validation schemas
 * All backend-aligned types come from validation schemas
 */

// Re-export backend types with aliases for clarity
import type {
  Address as BackendAddressType,
  CartItem as BackendCartItemType,
  Order as BackendOrderType,
  Product as BackendProductType,
} from "./lib/validations";

export type {
  Address,
  // Auth & Customer
  AuthResponse,
  // Bundles
  Bundle,
  BundleSet,
  BundleSetItem,
  BundleVariantBreakdown,
  // Cart (backend types)
  Cart as BackendCart,
  CartGstBreakdown,
  CartItem as BackendCartItem,
  // Checkout
  CheckoutAddress,
  CheckoutAddressInput,
  CheckoutConfirmResponse,
  CheckoutSession,
  CustomerProfile,
  // Orders
  Order as BackendOrder,
  OrderItem,
  PaginatedProducts,
  PaginatedReviews,
  PaymentFeeBreakdown as OrderPaymentFeeBreakdown,
  PaymentFeeBreakdown as CheckoutPaymentFeeBreakdown,
  PaymentMethod,
  // Product & Variants (backend types)
  Product as BackendProduct,
  Review as BackendReview,
  ReviewAggregate,
  ShippingMethod,
  UserBundleSelection,
  Variant,
} from "./lib/validations";

/**
 * UI-specific types that extend backend types for frontend display
 */

// UI Product type - extends backend Product with UI-specific fields
export interface Product extends Omit<BackendProductType, "title"> {
  name: string; // Maps from backend 'title'
  originalPrice?: number; // For showing strikethrough prices
  image: string; // First image from images array
  category: string; // Maps from categoryId (or fetched category name)
  rating: number; // Calculated from reviews
  reviews: number; // Count of reviews
  slug?: string; // Generated slug for routing
  selectedColor?: string; // UI state
  sizes?: string[]; // Extracted from variants
  colors?: string[]; // Extracted from variants
}

// UI CartItem type - extends Product with cart-specific fields
export interface CartItem extends Product {
  cartId: string; // Maps from backend cart item 'id'
  selectedSize: string; // Extracted from variant
  quantity: number;
}

// UI Review type - simplified for display
export interface Review {
  id: string;
  author: string; // Maps from customerName
  rating: number;
  date: string; // Formatted createdAt
  title: string; // Maps from title or empty
  content: string; // Maps from body
  avatar?: string; // Optional avatar URL
}

// UI Order type - can extend BackendOrder if needed
export type Order = BackendOrderType;

// UI state for user (combines customer profile with UI-specific fields)
export interface User {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: BackendAddressType[];
  orders: Order[];
  wishlist: Product[]; // UI Product type
}

// UI helper for color options (not from backend)
export interface ColorOption {
  name: string;
  hex: string;
  image: string;
}

// Note: BundleConfig removed - use Bundle type from backend instead
// Note: PricelistPrice is exported from product validation schema
