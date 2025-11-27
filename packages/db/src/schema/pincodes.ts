import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const shippingZoneEnum = pgEnum("shipping_zone", [
  "metro",
  "zone_a",
  "zone_b",
  "zone_c",
  "zone_d",
  "zone_e",
]);

export const pincodes = pgTable(
  "pincodes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    pincode: text("pincode").notNull().unique(),
    officeName: text("office_name").notNull(),
    district: text("district").notNull(),
    state: text("state").notNull(),
    stateCode: text("state_code").notNull(),
    region: text("region"),
    division: text("division"),
    taluk: text("taluk"),
    circle: text("circle"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    isServiceable: boolean("is_serviceable").notNull().default(true),
    codAvailable: boolean("cod_available").notNull().default(true),
    shippingZone: shippingZoneEnum("shipping_zone").notNull().default("zone_c"),
    estimatedDeliveryDays: integer("estimated_delivery_days")
      .notNull()
      .default(3),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pincodeIdx: index("pincodes_pincode_idx").on(table.pincode),
    stateIdx: index("pincodes_state_idx").on(table.state),
    districtIdx: index("pincodes_district_idx").on(table.district),
    serviceableIdx: index("pincodes_serviceable_idx").on(table.isServiceable),
    shippingZoneIdx: index("pincodes_shipping_zone_idx").on(table.shippingZone),
    codIdx: index("pincodes_cod_idx").on(table.codAvailable),
  }),
);

export type Pincode = typeof pincodes.$inferSelect;
export type NewPincode = typeof pincodes.$inferInsert;
