import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/docs',
    component: ComponentCreator('/docs/docs', '8ec'),
    routes: [
      {
        path: '/docs/docs',
        component: ComponentCreator('/docs/docs', '568'),
        routes: [
          {
            path: '/docs/docs',
            component: ComponentCreator('/docs/docs', '80f'),
            routes: [
              {
                path: '/docs/docs/api-reference/admin-api',
                component: ComponentCreator('/docs/docs/api-reference/admin-api', 'a58'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/api-reference/store-api',
                component: ComponentCreator('/docs/docs/api-reference/store-api', '84b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/architecture/dependencies',
                component: ComponentCreator('/docs/docs/architecture/dependencies', 'ab6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/architecture/modules',
                component: ComponentCreator('/docs/docs/architecture/modules', '9d4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/architecture/overview',
                component: ComponentCreator('/docs/docs/architecture/overview', 'd3a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/authentication/admin-auth',
                component: ComponentCreator('/docs/docs/authentication/admin-auth', 'b1c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/authentication/storefront-auth',
                component: ComponentCreator('/docs/docs/authentication/storefront-auth', '6b8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/cart-integration',
                component: ComponentCreator('/docs/docs/bundles/cart-integration', '7ac'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/choice-sets',
                component: ComponentCreator('/docs/docs/bundles/choice-sets', '6ae'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/definition',
                component: ComponentCreator('/docs/docs/bundles/definition', '433'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/overview',
                component: ComponentCreator('/docs/docs/bundles/overview', 'ee1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/pricing',
                component: ComponentCreator('/docs/docs/bundles/pricing', '12f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/catalog/collections',
                component: ComponentCreator('/docs/docs/catalog/collections', '5f1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/catalog/inventory',
                component: ComponentCreator('/docs/docs/catalog/inventory', 'bad'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/catalog/products',
                component: ComponentCreator('/docs/docs/catalog/products', 'cef'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/catalog/variants',
                component: ComponentCreator('/docs/docs/catalog/variants', '516'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/guest-checkout',
                component: ComponentCreator('/docs/docs/checkout/guest-checkout', '0bf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/inventory-flow',
                component: ComponentCreator('/docs/docs/checkout/inventory-flow', 'f32'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/overview',
                component: ComponentCreator('/docs/docs/checkout/overview', '732'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/payment-intent',
                component: ComponentCreator('/docs/docs/checkout/payment-intent', 'd1f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/state-machine',
                component: ComponentCreator('/docs/docs/checkout/state-machine', '13b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/webhooks',
                component: ComponentCreator('/docs/docs/checkout/webhooks', '027'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/database-schema/erd',
                component: ComponentCreator('/docs/docs/database-schema/erd', '2fc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/database-schema/overview',
                component: ComponentCreator('/docs/docs/database-schema/overview', 'f8b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/database-schema/tables',
                component: ComponentCreator('/docs/docs/database-schema/tables', '11b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/deployment/docker',
                component: ComponentCreator('/docs/docs/deployment/docker', 'be3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/deployment/overview',
                component: ComponentCreator('/docs/docs/deployment/overview', '624'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/deployment/production',
                component: ComponentCreator('/docs/docs/deployment/production', '0b3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/deployment/scaling',
                component: ComponentCreator('/docs/docs/deployment/scaling', 'e05'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/definitions',
                component: ComponentCreator('/docs/docs/discounts/definitions', '49d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/drift-detection',
                component: ComponentCreator('/docs/docs/discounts/drift-detection', '0d7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/engine',
                component: ComponentCreator('/docs/docs/discounts/engine', 'cb7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/overview',
                component: ComponentCreator('/docs/docs/discounts/overview', '3c8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/priority-stacking',
                component: ComponentCreator('/docs/docs/discounts/priority-stacking', 'e13'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/snapshots',
                component: ComponentCreator('/docs/docs/discounts/snapshots', '3ff'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/introduction',
                component: ComponentCreator('/docs/docs/introduction', '478'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/observability/context',
                component: ComponentCreator('/docs/docs/observability/context', '160'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/observability/correlation',
                component: ComponentCreator('/docs/docs/observability/correlation', '16c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/observability/logging',
                component: ComponentCreator('/docs/docs/observability/logging', 'b47'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/observability/tracing',
                component: ComponentCreator('/docs/docs/observability/tracing', 'ef5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/creation',
                component: ComponentCreator('/docs/docs/orders/creation', '5ab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/fulfillment',
                component: ComponentCreator('/docs/docs/orders/fulfillment', '535'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/overview',
                component: ComponentCreator('/docs/docs/orders/overview', '68f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/reconciliation',
                component: ComponentCreator('/docs/docs/orders/reconciliation', 'a5c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/refunds',
                component: ComponentCreator('/docs/docs/orders/refunds', '289'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/customer-groups',
                component: ComponentCreator('/docs/docs/pricing/customer-groups', '6e5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/drift-detection',
                component: ComponentCreator('/docs/docs/pricing/drift-detection', 'eb5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/overview',
                component: ComponentCreator('/docs/docs/pricing/overview', '3bf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/price-lists',
                component: ComponentCreator('/docs/docs/pricing/price-lists', '1ff'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/pricing-engine',
                component: ComponentCreator('/docs/docs/pricing/pricing-engine', 'd61'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/snapshots',
                component: ComponentCreator('/docs/docs/pricing/snapshots', 'fe3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/redis/caching-layers',
                component: ComponentCreator('/docs/docs/redis/caching-layers', '872'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/redis/expirations',
                component: ComponentCreator('/docs/docs/redis/expirations', '6ff'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/redis/key-patterns',
                component: ComponentCreator('/docs/docs/redis/key-patterns', '36e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/redis/overview',
                component: ComponentCreator('/docs/docs/redis/overview', '9d0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/aggregation',
                component: ComponentCreator('/docs/docs/reviews/aggregation', '8cd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/caching',
                component: ComponentCreator('/docs/docs/reviews/caching', 'c3b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/moderation',
                component: ComponentCreator('/docs/docs/reviews/moderation', '7ec'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/overview',
                component: ComponentCreator('/docs/docs/reviews/overview', '123'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/verified-purchase',
                component: ComponentCreator('/docs/docs/reviews/verified-purchase', '6fc'),
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
    path: '/docs/',
    component: ComponentCreator('/docs/', '2a6'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
