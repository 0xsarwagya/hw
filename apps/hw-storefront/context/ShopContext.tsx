import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useAddReview,
  useAuthMe,
  useLogin,
  useLogout,
  useProducts,
  useRegister,
  useReviews,
} from "../hooks/useApi";
import {
  useAddToCart,
  useCart,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "../hooks/useCart";
import { useCustomerProfile } from "../hooks/useCustomer";
import { isAuthenticated } from "../lib/utils/storage";
import { Address, CartItem, Order, Product, Review, User } from "../types";
import { createProductSlug } from "../utils/slug";

interface ShopContextType {
  products: Product[];
  reviews: Review[];
  cart: CartItem[];
  user: User;
  isAuthenticated: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (
    product: Product,
    size: string,
    quantity?: number,
    variantId?: string,
  ) => Promise<void>;
  addCartItems: (
    items: Array<{ product: Product; size: string; quantity?: number }>,
  ) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  addReview: (review: Review) => void;
  addOrder: (order: Order) => void;
  getOrder: (orderId: string) => Order | undefined;
  updateUserProfile: (data: Partial<User>) => void;
  addAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// Helper to map backend product to UI Product type
export const productMapper = (
  backendProduct: any,
  variants: any[] = [],
): Product => {
  // Get images array - handle null, undefined, or empty arrays
  let imagesArray: string[] = [];

  // Handle images - can be array, null, or undefined
  // Check explicitly for null/undefined to handle cases where API returns null
  if (backendProduct.images !== null && backendProduct.images !== undefined) {
    if (Array.isArray(backendProduct.images)) {
      // Filter out null/undefined values and ensure all are strings
      imagesArray = backendProduct.images.filter(
        (img: any) =>
          img !== null &&
          img !== undefined &&
          typeof img === "string" &&
          img.trim() !== "",
      );
    } else if (typeof backendProduct.images === "string") {
      // Single image string
      imagesArray = [backendProduct.images];
    }
  }

  // Fallback to thumbnailUrl if no images array
  if (imagesArray.length === 0 && backendProduct.thumbnailUrl) {
    imagesArray = [backendProduct.thumbnailUrl];
  }

  // Ensure we always have a firstImage (even if empty string)
  const firstImage: string = imagesArray.length > 0 ? imagesArray[0] || "" : "";

  // Debug: Log to see what we're getting
  if (imagesArray.length > 0) {
    console.log("✅ Images found in productMapper:", imagesArray);
  } else {
    console.warn(
      "⚠️ No images found in productMapper. Backend images:",
      backendProduct.images,
    );
  }

  // Determine pricing: use pricelist price if available, otherwise use base price
  // Always use pricelist price if available (regardless of whether it's lower or higher)
  const hasPricelistPrice =
    backendProduct.pricelistPrices &&
    Array.isArray(backendProduct.pricelistPrices) &&
    backendProduct.pricelistPrices.length > 0;

  // Sort by price ascending to get the lowest price (best deal)
  // Store all pricelist prices for display
  const sortedPricelistPrices = hasPricelistPrice
    ? [...backendProduct.pricelistPrices].sort(
        (a: any, b: any) => a.price - b.price,
      )
    : [];

  const pricelistPrice =
    sortedPricelistPrices.length > 0 ? sortedPricelistPrices[0].price : null;

  // Base price: use priceIncludingGst (which is the real price including GST)
  const basePrice =
    backendProduct.priceIncludingGst || backendProduct.price || 0;

  // Main price: pricelist price if available, otherwise base price
  // Always use pricelist price if it exists (even if higher - might be a premium tier)
  const mainPrice = pricelistPrice !== null ? pricelistPrice : basePrice;

  // Original price (strikethrough): show base price if pricelist price is used
  const originalPrice = pricelistPrice !== null ? basePrice : undefined;

  return {
    id: backendProduct.id,
    name: backendProduct.title || backendProduct.name || "",
    price: mainPrice,
    originalPrice: originalPrice,
    image: firstImage,
    images: imagesArray.length > 0 ? imagesArray : undefined,
    category: backendProduct.categoryId || "",
    rating: 0, // Will be calculated from reviews
    reviews: 0, // Will be calculated from reviews
    description: backendProduct.description || "",
    sizes: [], // Will be populated from variants
    colors: [], // Will be populated from variants
    slug: createProductSlug(backendProduct.title || "", backendProduct.id),
    pricelistPrices:
      sortedPricelistPrices.length > 0 ? sortedPricelistPrices : undefined,
  };
};

export const ShopProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Use React Query hooks for Server State
  const { data: productsData } = useProducts();
  const backendProducts = productsData?.data || [];
  // Map backend products to UI format
  const products = useMemo(
    () => backendProducts.map((p) => productMapper(p, [])),
    [backendProducts],
  );
  const { data: reviewsData } = useReviews();
  const reviews = reviewsData?.data || [];
  const addReviewMutation = useAddReview();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  // Auth state
  const hasToken = isAuthenticated();
  const { data: authData } = useAuthMe();
  const { data: customerData } = useCustomerProfile();

  // Cart state from backend
  const { data: backendCart } = useCart();
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

  // Client State
  const [user, setUser] = useState<User>({
    name: customerData?.name || "",
    email: authData?.email || "",
    phone: customerData?.phone || "",
    addresses: [],
    orders: [],
    wishlist: [],
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Update user when customer data changes
  useEffect(() => {
    if (customerData && authData) {
      setUser((prev) => ({
        ...prev,
        name: customerData.name || "",
        email: authData.email,
        phone: customerData.phone || "",
      }));
    }
  }, [customerData, authData]);

  const authenticated = hasToken && !!authData;

  // Convert backend cart items to UI cart items
  // Note: This is a simplified conversion - in production, you'd need to fetch product/variant details
  const cart: CartItem[] = useMemo(() => {
    if (!backendCart?.items) return [];
    // Map backend cart items to UI format
    // This is a placeholder - you'll need to fetch product details for each item
    return backendCart.items.map(
      (item) =>
        ({
          id: item.productVariantId, // Using variant ID as product ID for now
          name: "Product", // Will be replaced with actual product data
          price: item.price,
          image: "",
          category: "",
          rating: 0,
          reviews: 0,
          selectedSize: item.bundleVariantBreakdown?.[0]?.variantId || "",
          quantity: item.quantity,
          cartId: item.id,
        }) as CartItem,
    );
  }, [backendCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = async (
    product: Product,
    size: string,
    quantity = 1,
    variantId?: string,
  ) => {
    // variantId is required - components must fetch variants and pass the correct variantId
    if (!variantId) {
      console.error(
        "addToCart called without variantId. Components must fetch product variants and pass the correct variantId.",
      );
      throw new Error(
        "Variant ID is required. Please select a size/color to add to cart.",
      );
    }

    try {
      await addToCartMutation.mutateAsync({
        variantId,
        quantity,
      });
      openCart();
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error; // Re-throw so components can handle it
    }
  };

  const addCartItems = async (
    items: Array<{ product: Product; size: string; quantity?: number }>,
  ) => {
    // Add items one by one (backend doesn't support batch add)
    for (const { product, size, quantity = 1 } of items) {
      await addToCart(product, size, quantity);
    }
    openCart();
  };

  const removeFromCart = async (cartId: string) => {
    try {
      await removeCartItemMutation.mutateAsync(cartId);
    } catch (error) {
      console.error("Failed to remove from cart:", error);
    }
  };

  const updateQuantity = async (cartId: string, delta: number) => {
    const cartItem = cart.find((item) => item.cartId === cartId);
    if (!cartItem) return;

    const newQuantity = Math.max(1, cartItem.quantity + delta);
    try {
      await updateCartItemMutation.mutateAsync({
        itemId: cartId,
        quantity: newQuantity,
      });
    } catch (error) {
      console.error("Failed to update cart item:", error);
    }
  };

  const clearCart = async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const addReview = (review: Review) => {
    addReviewMutation.mutate(review);
  };

  const addOrder = (order: Order) => {
    setUser((prev) => ({
      ...prev,
      orders: [order, ...prev.orders],
    }));
  };

  const getOrder = (orderId: string): Order | undefined => {
    return user.orders.find((order) => order.id === orderId);
  };

  const updateUserProfile = (data: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const addAddress = (address: Address) => {
    setUser((prev) => ({
      ...prev,
      addresses: [...prev.addresses, address],
    }));
  };

  const deleteAddress = (id: string) => {
    setUser((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((a) => a.id !== id),
    }));
  };

  const toggleWishlist = (product: Product) => {
    setUser((prev) => {
      const exists = prev.wishlist.find((item) => item.id === product.id);
      if (exists) {
        return {
          ...prev,
          wishlist: prev.wishlist.filter((item) => item.id !== product.id),
        };
      } else {
        return {
          ...prev,
          wishlist: [...prev.wishlist, product],
        };
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return user.wishlist.some((item) => item.id === productId);
  };

  // Auth Methods using Mutations
  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync({ email, password: pass });
      return true;
    } catch (e) {
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
  ): Promise<boolean> => {
    try {
      // Backend register only takes email/password, name is set via customer profile
      await registerMutation.mutateAsync({ email, password: pass });
      // Update profile with name after registration
      if (customerData) {
        // Name will be updated via customer profile update
        setUser((prev) => ({ ...prev, name, email }));
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      // Continue with logout even if API call fails
      console.error("Logout error:", e);
    }
    setUser({
      name: "",
      email: "",
      phone: "",
      addresses: [],
      orders: [],
      wishlist: [],
    });
  };

  return (
    <ShopContext.Provider
      value={{
        products: products as Product[],
        reviews: reviews as Review[],
        cart,
        user,
        isAuthenticated: authenticated,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        addCartItems,
        removeFromCart,
        updateQuantity,
        clearCart,
        addReview,
        addOrder,
        getOrder,
        updateUserProfile,
        addAddress,
        deleteAddress,
        toggleWishlist,
        isInWishlist,
        login,
        register,
        logout,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};
