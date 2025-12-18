import ComponentCreator from "@docusaurus/ComponentCreator";

export default [
  {
    path: "/vcecom/docs",
    component: ComponentCreator("/vcecom/docs", "588"),
    routes: [
      {
        path: "/vcecom/docs",
        component: ComponentCreator("/vcecom/docs", "7d0"),
        routes: [
          {
            path: "/vcecom/docs",
            component: ComponentCreator("/vcecom/docs", "a42"),
            routes: [
              {
                path: "/vcecom/docs/api-reference/admin-api",
                component: ComponentCreator(
                  "/vcecom/docs/api-reference/admin-api",
                  "81d",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/api-reference/store-api",
                component: ComponentCreator(
                  "/vcecom/docs/api-reference/store-api",
                  "827",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/architecture/dependencies",
                component: ComponentCreator(
                  "/vcecom/docs/architecture/dependencies",
                  "a47",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/architecture/modules",
                component: ComponentCreator(
                  "/vcecom/docs/architecture/modules",
                  "3ad",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/architecture/overview",
                component: ComponentCreator(
                  "/vcecom/docs/architecture/overview",
                  "193",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/authentication/admin-auth",
                component: ComponentCreator(
                  "/vcecom/docs/authentication/admin-auth",
                  "235",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/authentication/storefront-auth",
                component: ComponentCreator(
                  "/vcecom/docs/authentication/storefront-auth",
                  "259",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/bundles/cart-integration",
                component: ComponentCreator(
                  "/vcecom/docs/bundles/cart-integration",
                  "b1f",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/bundles/choice-sets",
                component: ComponentCreator(
                  "/vcecom/docs/bundles/choice-sets",
                  "c2a",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/bundles/definition",
                component: ComponentCreator(
                  "/vcecom/docs/bundles/definition",
                  "af1",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/bundles/overview",
                component: ComponentCreator(
                  "/vcecom/docs/bundles/overview",
                  "5c3",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/bundles/pricing",
                component: ComponentCreator(
                  "/vcecom/docs/bundles/pricing",
                  "cb1",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/catalog/collections",
                component: ComponentCreator(
                  "/vcecom/docs/catalog/collections",
                  "300",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/catalog/inventory",
                component: ComponentCreator(
                  "/vcecom/docs/catalog/inventory",
                  "4db",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/catalog/products",
                component: ComponentCreator(
                  "/vcecom/docs/catalog/products",
                  "cc5",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/catalog/variants",
                component: ComponentCreator(
                  "/vcecom/docs/catalog/variants",
                  "dca",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/checkout/inventory-flow",
                component: ComponentCreator(
                  "/vcecom/docs/checkout/inventory-flow",
                  "dc1",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/checkout/overview",
                component: ComponentCreator(
                  "/vcecom/docs/checkout/overview",
                  "b1b",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/checkout/payment-intent",
                component: ComponentCreator(
                  "/vcecom/docs/checkout/payment-intent",
                  "010",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/checkout/state-machine",
                component: ComponentCreator(
                  "/vcecom/docs/checkout/state-machine",
                  "418",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/checkout/webhooks",
                component: ComponentCreator(
                  "/vcecom/docs/checkout/webhooks",
                  "c65",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/database-schema/erd",
                component: ComponentCreator(
                  "/vcecom/docs/database-schema/erd",
                  "4ee",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/database-schema/overview",
                component: ComponentCreator(
                  "/vcecom/docs/database-schema/overview",
                  "cad",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/database-schema/tables",
                component: ComponentCreator(
                  "/vcecom/docs/database-schema/tables",
                  "513",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/deployment/docker",
                component: ComponentCreator(
                  "/vcecom/docs/deployment/docker",
                  "49e",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/deployment/overview",
                component: ComponentCreator(
                  "/vcecom/docs/deployment/overview",
                  "ea7",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/deployment/production",
                component: ComponentCreator(
                  "/vcecom/docs/deployment/production",
                  "36e",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/deployment/scaling",
                component: ComponentCreator(
                  "/vcecom/docs/deployment/scaling",
                  "1d9",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/discounts/definitions",
                component: ComponentCreator(
                  "/vcecom/docs/discounts/definitions",
                  "7a6",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/discounts/drift-detection",
                component: ComponentCreator(
                  "/vcecom/docs/discounts/drift-detection",
                  "e92",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/discounts/engine",
                component: ComponentCreator(
                  "/vcecom/docs/discounts/engine",
                  "ff0",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/discounts/overview",
                component: ComponentCreator(
                  "/vcecom/docs/discounts/overview",
                  "09e",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/discounts/priority-stacking",
                component: ComponentCreator(
                  "/vcecom/docs/discounts/priority-stacking",
                  "629",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/discounts/snapshots",
                component: ComponentCreator(
                  "/vcecom/docs/discounts/snapshots",
                  "69e",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/introduction",
                component: ComponentCreator("/vcecom/docs/introduction", "23b"),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/observability/context",
                component: ComponentCreator(
                  "/vcecom/docs/observability/context",
                  "615",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/observability/correlation",
                component: ComponentCreator(
                  "/vcecom/docs/observability/correlation",
                  "e0f",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/observability/logging",
                component: ComponentCreator(
                  "/vcecom/docs/observability/logging",
                  "de7",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/observability/tracing",
                component: ComponentCreator(
                  "/vcecom/docs/observability/tracing",
                  "199",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/orders/creation",
                component: ComponentCreator(
                  "/vcecom/docs/orders/creation",
                  "820",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/orders/fulfillment",
                component: ComponentCreator(
                  "/vcecom/docs/orders/fulfillment",
                  "e01",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/orders/overview",
                component: ComponentCreator(
                  "/vcecom/docs/orders/overview",
                  "6c9",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/orders/reconciliation",
                component: ComponentCreator(
                  "/vcecom/docs/orders/reconciliation",
                  "d9e",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/orders/refunds",
                component: ComponentCreator(
                  "/vcecom/docs/orders/refunds",
                  "7b6",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/pricing/customer-groups",
                component: ComponentCreator(
                  "/vcecom/docs/pricing/customer-groups",
                  "57c",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/pricing/drift-detection",
                component: ComponentCreator(
                  "/vcecom/docs/pricing/drift-detection",
                  "58e",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/pricing/overview",
                component: ComponentCreator(
                  "/vcecom/docs/pricing/overview",
                  "5ee",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/pricing/price-lists",
                component: ComponentCreator(
                  "/vcecom/docs/pricing/price-lists",
                  "2ce",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/pricing/pricing-engine",
                component: ComponentCreator(
                  "/vcecom/docs/pricing/pricing-engine",
                  "c1b",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/pricing/snapshots",
                component: ComponentCreator(
                  "/vcecom/docs/pricing/snapshots",
                  "7b3",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/redis/caching-layers",
                component: ComponentCreator(
                  "/vcecom/docs/redis/caching-layers",
                  "72b",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/redis/expirations",
                component: ComponentCreator(
                  "/vcecom/docs/redis/expirations",
                  "0d9",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/redis/key-patterns",
                component: ComponentCreator(
                  "/vcecom/docs/redis/key-patterns",
                  "f5b",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/redis/overview",
                component: ComponentCreator(
                  "/vcecom/docs/redis/overview",
                  "fb4",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/reviews/aggregation",
                component: ComponentCreator(
                  "/vcecom/docs/reviews/aggregation",
                  "1f9",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/reviews/caching",
                component: ComponentCreator(
                  "/vcecom/docs/reviews/caching",
                  "5df",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/reviews/moderation",
                component: ComponentCreator(
                  "/vcecom/docs/reviews/moderation",
                  "7b6",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/reviews/overview",
                component: ComponentCreator(
                  "/vcecom/docs/reviews/overview",
                  "70f",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
              {
                path: "/vcecom/docs/reviews/verified-purchase",
                component: ComponentCreator(
                  "/vcecom/docs/reviews/verified-purchase",
                  "2ab",
                ),
                exact: true,
                sidebar: "docsSidebar",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/vcecom/",
    component: ComponentCreator("/vcecom/", "1d6"),
    exact: true,
  },
  {
    path: "*",
    component: ComponentCreator("*"),
  },
];
