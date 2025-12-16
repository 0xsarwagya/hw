import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { collections } from "./collections";
import { products } from "./products";
import { tags } from "./tags";

/**
 * Discount type enum
 * - STANDARD: Regular discount (amount/percentage off)
 * - BUY_GET: Buy X get Y discount
 */
export const discountTypeEnum = pgEnum("discount_type", [
  "STANDARD",
  "BUY_GET",
]);

/**
 * Discount application type enum
 * - AUTOMATIC: Applied automatically when conditions are met
 * - MANUAL: Requires manual code entry
 */
export const discountApplicationTypeEnum = pgEnum("discount_application_type", [
  "AUTOMATIC",
  "MANUAL",
]);

/**
 * Discount value type enum
 * - AMOUNT: Fixed amount discount (e.g., ₹100 off)
 * - PERCENTAGE: Percentage discount (e.g., 10% off)
 */
export const discountValueTypeEnum = pgEnum("discount_value_type", [
  "AMOUNT",
  "PERCENTAGE",
]);

/**
 * Discount scope enum
 * - ORDER: Discount applies to entire order
 * - PRODUCT: Discount applies to specific products
 */
export const discountScopeEnum = pgEnum("discount_scope", ["ORDER", "PRODUCT"]);

/**
 * Main discounts table
 */
export const discounts = pgTable(
  "discounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    type: discountTypeEnum("type").notNull(), // STANDARD or BUY_GET
    applicationType: discountApplicationTypeEnum("application_type")
      .notNull()
      .default("MANUAL"), // AUTOMATIC or MANUAL

    // Discount value
    valueType: discountValueTypeEnum("value_type").notNull(), // AMOUNT or PERCENTAGE
    value: real("value").notNull(), // Amount in INR or percentage (0-100)
    minOrderAmount: real("min_order_amount"), // Minimum order amount to apply discount
    maxDiscountAmount: real("max_discount_amount"), // Maximum discount cap (for percentage discounts)

    // Scope
    scope: discountScopeEnum("scope").notNull().default("PRODUCT"), // ORDER or PRODUCT

    // Standard discount fields
    // For STANDARD type: applies to products/categories/collections/tags
    // For BUY_GET type: buy products/categories/collections/tags, get discount on order/product

    // Expiry and limits
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").notNull().default(true),
    usageLimit: integer("usage_limit"), // Total usage limit (null = unlimited)
    usageCount: integer("usage_count").notNull().default(0), // Current usage count
    perUserLimit: integer("per_user_limit"), // Limit per user (null = unlimited)

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("discounts_code_idx").on(table.code),
    typeIdx: index("discounts_type_idx").on(table.type),
    applicationTypeIdx: index("discounts_application_type_idx").on(
      table.applicationType,
    ),
    isActiveIdx: index("discounts_is_active_idx").on(table.isActive),
    startDateIdx: index("discounts_start_date_idx").on(table.startDate),
    endDateIdx: index("discounts_end_date_idx").on(table.endDate),
  }),
);

/**
 * Discount to Products (many-to-many)
 * For STANDARD: products that discount applies to
 * For BUY_GET: products to buy
 */
export const discountProducts = pgTable(
  "discount_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_products_discount_id_idx").on(
      table.discountId,
    ),
    productIdIdx: index("discount_products_product_id_idx").on(table.productId),
    uniqueDiscountProduct: index("discount_products_unique_idx").on(
      table.discountId,
      table.productId,
    ),
  }),
);

/**
 * Discount to Categories (many-to-many)
 * For STANDARD: categories that discount applies to
 * For BUY_GET: categories to buy from
 */
export const discountCategories = pgTable(
  "discount_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_categories_discount_id_idx").on(
      table.discountId,
    ),
    categoryIdIdx: index("discount_categories_category_id_idx").on(
      table.categoryId,
    ),
    uniqueDiscountCategory: index("discount_categories_unique_idx").on(
      table.discountId,
      table.categoryId,
    ),
  }),
);

/**
 * Discount to Collections (many-to-many)
 * For STANDARD: collections that discount applies to
 * For BUY_GET: collections to buy from
 */
export const discountCollections = pgTable(
  "discount_collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_collections_discount_id_idx").on(
      table.discountId,
    ),
    collectionIdIdx: index("discount_collections_collection_id_idx").on(
      table.collectionId,
    ),
    uniqueDiscountCollection: index("discount_collections_unique_idx").on(
      table.discountId,
      table.collectionId,
    ),
  }),
);

/**
 * Discount to Tags (many-to-many)
 * For STANDARD: tags that discount applies to
 * For BUY_GET: tags to buy from
 */
export const discountTags = pgTable(
  "discount_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_tags_discount_id_idx").on(table.discountId),
    tagIdIdx: index("discount_tags_tag_id_idx").on(table.tagId),
    uniqueDiscountTag: index("discount_tags_unique_idx").on(
      table.discountId,
      table.tagId,
    ),
  }),
);

/**
 * Buy Get specific: Products to get (for BUY_GET type)
 * When buying certain products, get discount on these products
 */
export const discountGetProducts = pgTable(
  "discount_get_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_get_products_discount_id_idx").on(
      table.discountId,
    ),
    productIdIdx: index("discount_get_products_product_id_idx").on(
      table.productId,
    ),
  }),
);

/**
 * Buy Get specific: Categories to get discount on
 */
export const discountGetCategories = pgTable(
  "discount_get_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_get_categories_discount_id_idx").on(
      table.discountId,
    ),
    categoryIdIdx: index("discount_get_categories_category_id_idx").on(
      table.categoryId,
    ),
  }),
);

/**
 * Buy Get specific: Collections to get discount on
 */
export const discountGetCollections = pgTable(
  "discount_get_collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_get_collections_discount_id_idx").on(
      table.discountId,
    ),
    collectionIdIdx: index("discount_get_collections_collection_id_idx").on(
      table.collectionId,
    ),
  }),
);

/**
 * Buy Get specific: Tags to get discount on
 */
export const discountGetTags = pgTable(
  "discount_get_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_get_tags_discount_id_idx").on(
      table.discountId,
    ),
    tagIdIdx: index("discount_get_tags_tag_id_idx").on(table.tagId),
  }),
);

/**
 * Discount usage tracking (for usage limits)
 */
export const discountUsages = pgTable(
  "discount_usages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discountId: uuid("discount_id")
      .notNull()
      .references(() => discounts.id, { onDelete: "cascade" }),
    userId: uuid("user_id"), // null for guest users
    orderId: uuid("order_id"), // Track which order used the discount
    usedAt: timestamp("used_at").defaultNow().notNull(),
  },
  (table) => ({
    discountIdIdx: index("discount_usages_discount_id_idx").on(
      table.discountId,
    ),
    userIdIdx: index("discount_usages_user_id_idx").on(table.userId),
    orderIdIdx: index("discount_usages_order_id_idx").on(table.orderId),
  }),
);

/**
 * Relations
 */
export const discountsRelations = relations(discounts, ({ many }) => ({
  products: many(discountProducts),
  categories: many(discountCategories),
  collections: many(discountCollections),
  tags: many(discountTags),
  getProducts: many(discountGetProducts),
  getCategories: many(discountGetCategories),
  getCollections: many(discountGetCollections),
  getTags: many(discountGetTags),
  usages: many(discountUsages),
}));

export const discountProductsRelations = relations(
  discountProducts,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountProducts.discountId],
      references: [discounts.id],
    }),
    product: one(products, {
      fields: [discountProducts.productId],
      references: [products.id],
    }),
  }),
);

export const discountCategoriesRelations = relations(
  discountCategories,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountCategories.discountId],
      references: [discounts.id],
    }),
    category: one(categories, {
      fields: [discountCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const discountCollectionsRelations = relations(
  discountCollections,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountCollections.discountId],
      references: [discounts.id],
    }),
    collection: one(collections, {
      fields: [discountCollections.collectionId],
      references: [collections.id],
    }),
  }),
);

export const discountTagsRelations = relations(discountTags, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountTags.discountId],
    references: [discounts.id],
  }),
  tag: one(tags, {
    fields: [discountTags.tagId],
    references: [tags.id],
  }),
}));

export const discountGetProductsRelations = relations(
  discountGetProducts,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountGetProducts.discountId],
      references: [discounts.id],
    }),
    product: one(products, {
      fields: [discountGetProducts.productId],
      references: [products.id],
    }),
  }),
);

export const discountGetCategoriesRelations = relations(
  discountGetCategories,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountGetCategories.discountId],
      references: [discounts.id],
    }),
    category: one(categories, {
      fields: [discountGetCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const discountGetCollectionsRelations = relations(
  discountGetCollections,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountGetCollections.discountId],
      references: [discounts.id],
    }),
    collection: one(collections, {
      fields: [discountGetCollections.collectionId],
      references: [collections.id],
    }),
  }),
);

export const discountGetTagsRelations = relations(
  discountGetTags,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountGetTags.discountId],
      references: [discounts.id],
    }),
    tag: one(tags, {
      fields: [discountGetTags.tagId],
      references: [tags.id],
    }),
  }),
);

export const discountUsagesRelations = relations(discountUsages, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountUsages.discountId],
    references: [discounts.id],
  }),
}));
