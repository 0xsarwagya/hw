/**
 * Route path constants
 * Centralizes all route paths and breadcrumb labels
 */

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/",
  PRODUCTS: {
    LIST: "/products",
    CREATE: "/products/create",
    DETAIL: (id: string) => `/products/${id}`,
    CATEGORIES: {
      LIST: "/products/categories",
      CREATE: "/products/categories/create",
      DETAIL: (id: string) => `/products/categories/${id}`,
    },
    COLLECTIONS: {
      LIST: "/products/collections",
      CREATE: "/products/collections/create",
      DETAIL: (id: string) => `/products/collections/${id}`,
    },
    VARIANTS: {
      CREATE: (productId: string) => `/products/${productId}/variants/new`,
      DETAIL: (productId: string, variantId: string) =>
        `/products/${productId}/variants/${variantId}`,
    },
  },
  ORDERS: {
    LIST: "/orders",
    DETAIL: (id: string) => `/orders/${id}`,
    ABANDONED: {
      LIST: "/orders/abandoned",
      DETAIL: (cartId: string) => `/orders/abandoned/${cartId}`,
    },
  },
  CUSTOMERS: "/customers",
  DISCOUNTS: {
    LIST: "/discounts",
    CREATE: "/discounts/create",
    DETAIL: (id: string) => `/discounts/${id}`,
  },
  PRICE_LISTS: {
    LIST: "/price-lists",
    CREATE: "/price-lists/create",
    DETAIL: (id: string) => `/price-lists/${id}`,
  },
  BUNDLES: {
    LIST: "/bundles",
    CREATE: "/bundles/create",
    DETAIL: (id: string) => `/bundles/${id}`,
  },
  REVIEWS: "/reviews",
  STORAGE: "/storage",
  SETTINGS: "/settings",
} as const;

export const BREADCRUMB_LABELS = {
  HOME: "Home",
  DASHBOARD: "Dashboard",
  PRODUCTS: "Products",
  CREATE_PRODUCT: "Create Product",
  CATEGORIES: "Categories",
  CREATE_CATEGORY: "Create Category",
  COLLECTIONS: "Collections",
  CREATE_COLLECTION: "Create Collection",
  VARIANTS: "Variants",
  CREATE_VARIANT: "New Variant",
  INVENTORY: "Inventory",
  ORDERS: "Orders",
  ABANDONED_CHECKOUTS: "Abandoned Checkouts",
  CUSTOMERS: "Customers",
  DISCOUNTS: "Discounts",
  CREATE_DISCOUNT: "Create Discount",
  PRICE_LISTS: "Price Lists",
  CREATE_PRICE_LIST: "Create Price List",
  BUNDLES: "Bundles",
  CREATE_BUNDLE: "Create Bundle",
  REVIEWS: "Reviews",
  STORAGE: "Storage",
  SETTINGS: "Settings",
} as const;
