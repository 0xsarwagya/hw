import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./products";
import { variantOptionValueAssignments } from "./variant-option-types";

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    price: real("price").notNull(),
    compareAtPrice: real("compare_at_price"), // For showing discount percentage
    currency: text("currency").notNull().default("INR"), // Type-safe currency (INR only for now)
    salePrice: real("sale_price"), // Optional sale price override
    saleStartDate: timestamp("sale_start_date"), // Scheduled sale start
    saleEndDate: timestamp("sale_end_date"), // Scheduled sale end
    inventory: integer("inventory").notNull().default(0),
    size: text("size"),
    color: text("color"),
    weight: real("weight"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_variants_product_id_idx").on(table.productId),
    skuIdx: index("product_variants_sku_idx").on(table.sku),
  }),
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    optionValueAssignments: many(variantOptionValueAssignments),
  }),
);

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
