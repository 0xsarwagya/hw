import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/vcecom/docs',
    component: ComponentCreator('/vcecom/docs', '731'),
    routes: [
      {
        path: '/vcecom/docs',
        component: ComponentCreator('/vcecom/docs', '4cf'),
        routes: [
          {
            path: '/vcecom/docs',
            component: ComponentCreator('/vcecom/docs', 'c4e'),
            routes: [
              {
                path: '/vcecom/docs/api-reference/admin-api',
                component: ComponentCreator('/vcecom/docs/api-reference/admin-api', 'd3f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/api-reference/store-api',
                component: ComponentCreator('/vcecom/docs/api-reference/store-api', 'a7c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/architecture/dependencies',
                component: ComponentCreator('/vcecom/docs/architecture/dependencies', 'ebd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/architecture/modules',
                component: ComponentCreator('/vcecom/docs/architecture/modules', '068'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/architecture/overview',
                component: ComponentCreator('/vcecom/docs/architecture/overview', '6a4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/authentication/admin-auth',
                component: ComponentCreator('/vcecom/docs/authentication/admin-auth', 'c96'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/authentication/storefront-auth',
                component: ComponentCreator('/vcecom/docs/authentication/storefront-auth', '3ad'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/bundles/cart-integration',
                component: ComponentCreator('/vcecom/docs/bundles/cart-integration', '998'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/bundles/choice-sets',
                component: ComponentCreator('/vcecom/docs/bundles/choice-sets', '790'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/bundles/definition',
                component: ComponentCreator('/vcecom/docs/bundles/definition', '47d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/bundles/overview',
                component: ComponentCreator('/vcecom/docs/bundles/overview', 'fec'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/bundles/pricing',
                component: ComponentCreator('/vcecom/docs/bundles/pricing', 'e73'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/catalog/collections',
                component: ComponentCreator('/vcecom/docs/catalog/collections', '6cf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/catalog/inventory',
                component: ComponentCreator('/vcecom/docs/catalog/inventory', '278'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/catalog/products',
                component: ComponentCreator('/vcecom/docs/catalog/products', '7f8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/catalog/variants',
                component: ComponentCreator('/vcecom/docs/catalog/variants', '91c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/checkout/guest-checkout',
                component: ComponentCreator('/vcecom/docs/checkout/guest-checkout', '1f0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/checkout/inventory-flow',
                component: ComponentCreator('/vcecom/docs/checkout/inventory-flow', '251'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/checkout/overview',
                component: ComponentCreator('/vcecom/docs/checkout/overview', 'f7a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/checkout/payment-intent',
                component: ComponentCreator('/vcecom/docs/checkout/payment-intent', 'f67'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/checkout/state-machine',
                component: ComponentCreator('/vcecom/docs/checkout/state-machine', 'fee'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/checkout/webhooks',
                component: ComponentCreator('/vcecom/docs/checkout/webhooks', 'b61'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/database-schema/erd',
                component: ComponentCreator('/vcecom/docs/database-schema/erd', 'bd2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/database-schema/overview',
                component: ComponentCreator('/vcecom/docs/database-schema/overview', '6ed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/database-schema/tables',
                component: ComponentCreator('/vcecom/docs/database-schema/tables', '2b4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/deployment/docker',
                component: ComponentCreator('/vcecom/docs/deployment/docker', 'd4b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/deployment/overview',
                component: ComponentCreator('/vcecom/docs/deployment/overview', '4f7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/deployment/production',
                component: ComponentCreator('/vcecom/docs/deployment/production', '193'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/deployment/scaling',
                component: ComponentCreator('/vcecom/docs/deployment/scaling', 'b8f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/discounts/definitions',
                component: ComponentCreator('/vcecom/docs/discounts/definitions', '1eb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/discounts/drift-detection',
                component: ComponentCreator('/vcecom/docs/discounts/drift-detection', 'de9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/discounts/engine',
                component: ComponentCreator('/vcecom/docs/discounts/engine', '44a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/discounts/overview',
                component: ComponentCreator('/vcecom/docs/discounts/overview', 'c6f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/discounts/priority-stacking',
                component: ComponentCreator('/vcecom/docs/discounts/priority-stacking', 'd55'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/discounts/snapshots',
                component: ComponentCreator('/vcecom/docs/discounts/snapshots', '0d4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/introduction',
                component: ComponentCreator('/vcecom/docs/introduction', '39f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/observability/context',
                component: ComponentCreator('/vcecom/docs/observability/context', '8ef'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/observability/correlation',
                component: ComponentCreator('/vcecom/docs/observability/correlation', '22f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/observability/logging',
                component: ComponentCreator('/vcecom/docs/observability/logging', '12e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/observability/tracing',
                component: ComponentCreator('/vcecom/docs/observability/tracing', 'c2b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/orders/creation',
                component: ComponentCreator('/vcecom/docs/orders/creation', 'f91'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/orders/fulfillment',
                component: ComponentCreator('/vcecom/docs/orders/fulfillment', '0c3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/orders/overview',
                component: ComponentCreator('/vcecom/docs/orders/overview', '19e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/orders/reconciliation',
                component: ComponentCreator('/vcecom/docs/orders/reconciliation', '23c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/orders/refunds',
                component: ComponentCreator('/vcecom/docs/orders/refunds', '1f0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/pricing/customer-groups',
                component: ComponentCreator('/vcecom/docs/pricing/customer-groups', 'd4d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/pricing/drift-detection',
                component: ComponentCreator('/vcecom/docs/pricing/drift-detection', '182'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/pricing/overview',
                component: ComponentCreator('/vcecom/docs/pricing/overview', '5c4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/pricing/price-lists',
                component: ComponentCreator('/vcecom/docs/pricing/price-lists', '302'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/pricing/pricing-engine',
                component: ComponentCreator('/vcecom/docs/pricing/pricing-engine', '65f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/pricing/snapshots',
                component: ComponentCreator('/vcecom/docs/pricing/snapshots', 'e0c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/redis/caching-layers',
                component: ComponentCreator('/vcecom/docs/redis/caching-layers', '0be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/redis/expirations',
                component: ComponentCreator('/vcecom/docs/redis/expirations', '554'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/redis/key-patterns',
                component: ComponentCreator('/vcecom/docs/redis/key-patterns', 'cdf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/redis/overview',
                component: ComponentCreator('/vcecom/docs/redis/overview', '4af'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/reviews/aggregation',
                component: ComponentCreator('/vcecom/docs/reviews/aggregation', '9a2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/reviews/caching',
                component: ComponentCreator('/vcecom/docs/reviews/caching', '9f3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/reviews/moderation',
                component: ComponentCreator('/vcecom/docs/reviews/moderation', '702'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/reviews/overview',
                component: ComponentCreator('/vcecom/docs/reviews/overview', '16b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/vcecom/docs/reviews/verified-purchase',
                component: ComponentCreator('/vcecom/docs/reviews/verified-purchase', '595'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/vcecom/',
    component: ComponentCreator('/vcecom/', '1d6'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
