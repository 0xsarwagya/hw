/**
 * Centralized API endpoint constants
 * Type-safe endpoint references
 */

export const endpoints = {
  auth: {
    login: "/admin/auth/login",
    me: "/admin/auth/me",
    refresh: "/admin/auth/refresh",
    logout: "/admin/auth/logout",
    sessions: "/admin/auth/sessions",
  },
  products: {
    list: "/admin/products",
    detail: (id: string) => `/products/${id}`,
    create: "/products",
    update: (id: string) => `/products/${id}`,
    delete: (id: string) => `/products/${id}`,
    collections: (id: string) => `/products/${id}/collections`,
    images: {
      list: (id: string) => `/products/${id}/images`,
      add: (id: string) => `/products/${id}/images`,
      delete: (imageId: string) => `/products/images/${imageId}`,
      updateOrder: (imageId: string) => `/products/images/${imageId}/order`,
      update: (imageId: string) => `/products/images/${imageId}`,
      replace: (imageId: string) => `/products/images/${imageId}/replace`,
    },
    variantImages: {
      list: (productId: string, variantId: string) =>
        `/products/${productId}/variants/${variantId}/images`,
    },
    variants: {
      list: (productId: string) => `/products/${productId}/variants`,
      detail: (productId: string, variantId: string) =>
        `/products/${productId}/variants/${variantId}`,
      create: (productId: string) => `/products/${productId}/variants`,
      update: (productId: string, variantId: string) =>
        `/products/${productId}/variants/${variantId}`,
      delete: (productId: string, variantId: string) =>
        `/products/${productId}/variants/${variantId}`,
    },
  },
  storage: {
    upload: "/admin/storage/upload",
    uploadBatch: "/admin/storage/upload/batch",
    list: "/admin/storage/list",
    get: (key: string) => `/admin/storage/${key}`,
    delete: (key: string) => `/admin/storage/${key}`,
    batchDelete: "/admin/storage/batch",
    presignedUrl: "/admin/storage/presigned-url",
  },
  inventory: {
    list: "/admin/inventory",
    detail: (variantId: string) => `/admin/inventory/${variantId}`,
    adjust: (variantId: string) => `/admin/inventory/${variantId}/adjust`,
    bulkAdjust: "/admin/inventory/bulk-adjust",
    logs: (variantId: string) => `/admin/inventory/${variantId}/logs`,
    reservations: (variantId: string) =>
      `/admin/inventory/${variantId}/reservations`,
    reservationsSummary: "/admin/inventory/reservations/summary",
    health: "/admin/inventory/health",
    settings: "/admin/inventory/settings",
    variantsIndex: "/admin/inventory/variants/index",
    metrics: "/inventory/metrics", // Keep for backward compatibility
  },
  admin: {
    stats: "/admin/stats",
  },
  orders: {
    list: "/admin/orders",
    detail: (id: string) => `/orders/${id}`, // Use regular orders endpoint with admin auth
    timeline: (id: string) => `/orders/${id}/timeline`,
    tracking: (id: string) => `/orders/${id}/tracking`,
    reconcile: (paymentIntentId: string) =>
      `/orders/reconcile/${paymentIntentId}`,
    markPaid: (id: string) => `/orders/${id}/mark-paid`,
    refund: (id: string) => `/orders/${id}/refund`,
    refunds: (id: string) => `/orders/${id}/refunds`,
    notes: (id: string) => `/api/orders/${id}/notes`,
    updateAddress: (id: string) => `/api/orders/${id}/addresses`,
  },
  shipping: {
    shiprocketStatus: "/shipping/shiprocket/status",
    shiprocketInitialize: "/shipping/shiprocket/initialize",
    createShipment: "/shipping/shiprocket/shipments",
    pickupLocations: "/api/shipping/shiprocket/pickup-locations",
    courierServiceability: "/api/shipping/shiprocket/courier-serviceability",
    trackShipment: (awb: string) => `/shipping/shiprocket/tracking/${awb}`,
    cancelShipment: (awb: string) => `/shipping/shiprocket/cancel/${awb}`,
    listShipments: "/shipping/shipments",
    getShipment: (id: string) => `/shipping/shipments/${id}`,
  },
  abandonedCheckouts: {
    list: "/admin/abandoned-checkouts",
    detail: (cartId: string) => `/admin/abandoned-checkouts/${cartId}`,
  },
  customers: {
    list: "/admin/customers",
    detail: (id: string) => `/admin/customers/${id}`,
  },
  discounts: {
    list: "/admin/discounts",
    detail: (id: string) => `/admin/discounts/${id}`,
    create: "/admin/discounts",
    update: (id: string) => `/admin/discounts/${id}`,
    delete: (id: string) => `/admin/discounts/${id}`,
    driftReport: "/admin/discounts/drift-report",
    profile: "/admin/discounts/profile",
  },
  bundles: {
    list: "/admin/bundles",
    detail: (id: string) => `/admin/bundles/${id}`,
    create: "/admin/bundles",
    update: (id: string) => `/admin/bundles/${id}`,
    delete: (id: string) => `/admin/bundles/${id}`,
    sets: {
      create: (bundleId: string) => `/admin/bundles/${bundleId}/sets`,
      update: (bundleId: string, setId: string) =>
        `/admin/bundles/${bundleId}/sets/${setId}`,
      delete: (bundleId: string, setId: string) =>
        `/admin/bundles/${bundleId}/sets/${setId}`,
      items: {
        add: (bundleId: string, setId: string) =>
          `/admin/bundles/${bundleId}/sets/${setId}/items`,
        remove: (bundleId: string, setId: string, itemId: string) =>
          `/admin/bundles/${bundleId}/sets/${setId}/items/${itemId}`,
      },
    },
  },
  priceLists: {
    list: "/admin/price-lists",
    active: "/admin/price-lists/active",
    detail: (id: string) => `/admin/price-lists/${id}`,
    create: "/admin/price-lists",
    update: (id: string) => `/admin/price-lists/${id}`,
    delete: (id: string) => `/admin/price-lists/${id}`,
    addItem: (id: string) => `/admin/price-lists/${id}/items`,
    removeItem: (id: string, itemId: string) =>
      `/admin/price-lists/${id}/items/${itemId}`,
    driftReport: "/admin/price-lists/drift-report",
  },
  reviews: {
    list: "/admin/reviews/search",
    pending: "/admin/reviews/pending",
    search: "/admin/reviews/search",
    approve: (reviewId: string) => `/admin/reviews/${reviewId}/approve`,
    reject: (reviewId: string) => `/admin/reviews/${reviewId}/reject`,
    delete: (reviewId: string) => `/admin/reviews/${reviewId}`,
  },
  collections: {
    list: "/admin/collections",
    detail: (id: string) => `/admin/collections/${id}`,
    create: "/admin/collections",
    update: (id: string) => `/admin/collections/${id}`,
    delete: (id: string) => `/admin/collections/${id}`,
    preview: (id: string) => `/admin/collections/${id}/preview`,
    products: {
      list: (id: string) => `/admin/collections/${id}/products`,
      add: (id: string) => `/admin/collections/${id}/products`,
      remove: (id: string, productId: string) =>
        `/admin/collections/${id}/products/${productId}`,
    },
  },
  categories: {
    list: "/categories",
    tree: "/categories/tree",
    detail: (id: string) => `/categories/${id}`,
    create: "/categories",
    update: (id: string) => `/categories/${id}`,
    delete: (id: string) => `/categories/${id}`,
  },
  variantOptionTypes: {
    list: "/products/variant-option-types",
    create: "/products/variant-option-types",
    product: {
      list: (productId: string) =>
        `/products/${productId}/variant-option-types`,
      create: (productId: string) =>
        `/products/${productId}/variant-option-types`,
      delete: (productId: string, optionTypeId: string) =>
        `/products/${productId}/variant-option-types/${optionTypeId}`,
      values: {
        create: (productId: string, optionTypeId: string) =>
          `/products/${productId}/variant-option-types/${optionTypeId}/values`,
        delete: (productId: string, optionTypeId: string, valueId: string) =>
          `/products/${productId}/variant-option-types/${optionTypeId}/values/${valueId}`,
      },
    },
  },
  activityLogs: {
    list: "/admin/activity-logs",
    detail: (id: string) => `/admin/activity-logs/${id}`,
  },
  customerGroups: {
    list: "/admin/customer-groups",
    active: "/admin/customer-groups/active",
    detail: (id: string) => `/admin/customer-groups/${id}`,
    create: "/admin/customer-groups",
    update: (id: string) => `/admin/customer-groups/${id}`,
    delete: (id: string) => `/admin/customer-groups/${id}`,
    assignPriceList: (id: string) =>
      `/admin/customer-groups/${id}/assign-price-list`,
    removePriceList: (id: string, priceListId: string) =>
      `/admin/customer-groups/${id}/price-lists/${priceListId}`,
    members: (id: string) => `/admin/customer-groups/${id}/members`,
  },
  mediaHealth: {
    scan: "/admin/media/health/scan",
    fix: (action: string) => `/admin/media/health/fix/${action}`,
    auditLogs: "/admin/media/health/audit-logs",
  },
} as const;
