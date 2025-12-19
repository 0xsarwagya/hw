import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { productVariants } from "./product-variants";
import { products } from "./products";

/**
 * Global variant option type templates
 * These can be reused across multiple products
 * e.g., "Size", "Color", "Fabric", "Weight"
 */
export const variantOptionTypes = pgTable(
  "variant_option_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("variant_option_types_name_idx").on(table.name),
  }),
);

/**
 * Product-specific variant option types
 * Links a product to variant option types (either from templates or custom)
 */
export const productVariantOptionTypes = pgTable(
  "product_variant_option_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    optionTypeId: uuid("option_type_id").references(
      () => variantOptionTypes.id,
      {
        onDelete: "set null",
      },
    ), // References global template if using one
    name: text("name").notNull(), // Custom name if not using template
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_variant_option_types_product_id_idx").on(
      table.productId,
    ),
    optionTypeIdIdx: index(
      "product_variant_option_types_option_type_id_idx",
    ).on(table.optionTypeId),
  }),
);

/**
 * Values for variant option types
 * e.g., for "Size" option type: "XS", "S", "M", "L", "XL"
 */
export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productVariantOptionTypeId: uuid("product_variant_option_type_id")
      .notNull()
      .references(() => productVariantOptionTypes.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    optionTypeIdIdx: index("variant_option_values_option_type_id_idx").on(
      table.productVariantOptionTypeId,
    ),
    // Ensure unique values per option type
    uniqueValuePerOptionType: unique(
      "variant_option_values_unique_value_per_option_type",
    ).on(table.productVariantOptionTypeId, table.value),
  }),
);

/**
 * Junction table linking variants to their option values
 * A variant can have multiple option values (one per option type)
 */
export const variantOptionValueAssignments = pgTable(
  "variant_option_value_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => variantOptionValues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    variantIdIdx: index("variant_option_value_assignments_variant_id_idx").on(
      table.variantId,
    ),
    optionValueIdIdx: index(
      "variant_option_value_assignments_option_value_id_idx",
    ).on(table.optionValueId),
    // Ensure a variant can only have one value per option type
    uniqueVariantOptionValue: unique(
      "variant_option_value_assignments_unique_variant_option_value",
    ).on(table.variantId, table.optionValueId),
  }),
);

// Relations
export const variantOptionTypesRelations = relations(
  variantOptionTypes,
  ({ many }) => ({
    productVariantOptionTypes: many(productVariantOptionTypes),
  }),
);

export const productVariantOptionTypesRelations = relations(
  productVariantOptionTypes,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariantOptionTypes.productId],
      references: [products.id],
    }),
    optionType: one(variantOptionTypes, {
      fields: [productVariantOptionTypes.optionTypeId],
      references: [variantOptionTypes.id],
    }),
    values: many(variantOptionValues),
  }),
);

export const variantOptionValuesRelations = relations(
  variantOptionValues,
  ({ one, many }) => ({
    productVariantOptionType: one(productVariantOptionTypes, {
      fields: [variantOptionValues.productVariantOptionTypeId],
      references: [productVariantOptionTypes.id],
    }),
    variantAssignments: many(variantOptionValueAssignments),
  }),
);

export const variantOptionValueAssignmentsRelations = relations(
  variantOptionValueAssignments,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [variantOptionValueAssignments.variantId],
      references: [productVariants.id],
    }),
    optionValue: one(variantOptionValues, {
      fields: [variantOptionValueAssignments.optionValueId],
      references: [variantOptionValues.id],
    }),
  }),
);

export type VariantOptionType = typeof variantOptionTypes.$inferSelect;
export type NewVariantOptionType = typeof variantOptionTypes.$inferInsert;

export type ProductVariantOptionType =
  typeof productVariantOptionTypes.$inferSelect;
export type NewProductVariantOptionType =
  typeof productVariantOptionTypes.$inferInsert;

export type VariantOptionValue = typeof variantOptionValues.$inferSelect;
export type NewVariantOptionValue = typeof variantOptionValues.$inferInsert;

export type VariantOptionValueAssignment =
  typeof variantOptionValueAssignments.$inferSelect;
export type NewVariantOptionValueAssignment =
  typeof variantOptionValueAssignments.$inferInsert;
