import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/__docusaurus/debug',
    component: ComponentCreator('/docs/__docusaurus/debug', 'e58'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/config',
    component: ComponentCreator('/docs/__docusaurus/debug/config', '2ce'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/content',
    component: ComponentCreator('/docs/__docusaurus/debug/content', '11b'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/globalData',
    component: ComponentCreator('/docs/__docusaurus/debug/globalData', 'f13'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/metadata',
    component: ComponentCreator('/docs/__docusaurus/debug/metadata', 'bff'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/registry',
    component: ComponentCreator('/docs/__docusaurus/debug/registry', '830'),
    exact: true
  },
  {
    path: '/docs/__docusaurus/debug/routes',
    component: ComponentCreator('/docs/__docusaurus/debug/routes', '13e'),
    exact: true
  },
  {
    path: '/docs/docs',
    component: ComponentCreator('/docs/docs', '110'),
    routes: [
      {
        path: '/docs/docs',
        component: ComponentCreator('/docs/docs', '8ba'),
        routes: [
          {
            path: '/docs/docs',
            component: ComponentCreator('/docs/docs', '55d'),
            routes: [
              {
                path: '/docs/docs/api-reference/admin-api',
                component: ComponentCreator('/docs/docs/api-reference/admin-api', 'ac1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/api-reference/store-api',
                component: ComponentCreator('/docs/docs/api-reference/store-api', 'f05'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/architecture/dependencies',
                component: ComponentCreator('/docs/docs/architecture/dependencies', '6a2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/architecture/modules',
                component: ComponentCreator('/docs/docs/architecture/modules', 'b15'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/architecture/overview',
                component: ComponentCreator('/docs/docs/architecture/overview', '1be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/authentication/admin-auth',
                component: ComponentCreator('/docs/docs/authentication/admin-auth', '2c2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/authentication/storefront-auth',
                component: ComponentCreator('/docs/docs/authentication/storefront-auth', '204'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/cart-integration',
                component: ComponentCreator('/docs/docs/bundles/cart-integration', 'c3b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/choice-sets',
                component: ComponentCreator('/docs/docs/bundles/choice-sets', '107'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/definition',
                component: ComponentCreator('/docs/docs/bundles/definition', '4cb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/overview',
                component: ComponentCreator('/docs/docs/bundles/overview', '2a4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/bundles/pricing',
                component: ComponentCreator('/docs/docs/bundles/pricing', '54a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/catalog/collections',
                component: ComponentCreator('/docs/docs/catalog/collections', '30b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/catalog/inventory',
                component: ComponentCreator('/docs/docs/catalog/inventory', 'b58'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/catalog/products',
                component: ComponentCreator('/docs/docs/catalog/products', '65b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/catalog/variants',
                component: ComponentCreator('/docs/docs/catalog/variants', '5da'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/guest-checkout',
                component: ComponentCreator('/docs/docs/checkout/guest-checkout', '7ec'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/inventory-flow',
                component: ComponentCreator('/docs/docs/checkout/inventory-flow', '418'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/overview',
                component: ComponentCreator('/docs/docs/checkout/overview', '4c8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/payment-intent',
                component: ComponentCreator('/docs/docs/checkout/payment-intent', 'c18'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/state-machine',
                component: ComponentCreator('/docs/docs/checkout/state-machine', 'b87'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/checkout/webhooks',
                component: ComponentCreator('/docs/docs/checkout/webhooks', 'b4a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/database-schema/erd',
                component: ComponentCreator('/docs/docs/database-schema/erd', '6b4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/database-schema/overview',
                component: ComponentCreator('/docs/docs/database-schema/overview', '24b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/database-schema/tables',
                component: ComponentCreator('/docs/docs/database-schema/tables', 'c87'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/deployment/docker',
                component: ComponentCreator('/docs/docs/deployment/docker', '0f2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/deployment/overview',
                component: ComponentCreator('/docs/docs/deployment/overview', '4ea'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/deployment/production',
                component: ComponentCreator('/docs/docs/deployment/production', '707'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/deployment/scaling',
                component: ComponentCreator('/docs/docs/deployment/scaling', '459'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/definitions',
                component: ComponentCreator('/docs/docs/discounts/definitions', '32a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/drift-detection',
                component: ComponentCreator('/docs/docs/discounts/drift-detection', '7ae'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/engine',
                component: ComponentCreator('/docs/docs/discounts/engine', '99e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/overview',
                component: ComponentCreator('/docs/docs/discounts/overview', '610'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/priority-stacking',
                component: ComponentCreator('/docs/docs/discounts/priority-stacking', '9b9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/discounts/snapshots',
                component: ComponentCreator('/docs/docs/discounts/snapshots', '722'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/introduction',
                component: ComponentCreator('/docs/docs/introduction', '440'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/observability/context',
                component: ComponentCreator('/docs/docs/observability/context', 'aba'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/observability/correlation',
                component: ComponentCreator('/docs/docs/observability/correlation', 'b45'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/observability/logging',
                component: ComponentCreator('/docs/docs/observability/logging', 'e1d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/observability/tracing',
                component: ComponentCreator('/docs/docs/observability/tracing', 'bca'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/creation',
                component: ComponentCreator('/docs/docs/orders/creation', 'd79'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/fulfillment',
                component: ComponentCreator('/docs/docs/orders/fulfillment', '9d7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/overview',
                component: ComponentCreator('/docs/docs/orders/overview', 'baf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/reconciliation',
                component: ComponentCreator('/docs/docs/orders/reconciliation', '9fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/orders/refunds',
                component: ComponentCreator('/docs/docs/orders/refunds', '92a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/customer-groups',
                component: ComponentCreator('/docs/docs/pricing/customer-groups', '8ad'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/drift-detection',
                component: ComponentCreator('/docs/docs/pricing/drift-detection', '4a7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/overview',
                component: ComponentCreator('/docs/docs/pricing/overview', '4ed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/price-lists',
                component: ComponentCreator('/docs/docs/pricing/price-lists', 'a5f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/pricing-engine',
                component: ComponentCreator('/docs/docs/pricing/pricing-engine', 'f1e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/pricing/snapshots',
                component: ComponentCreator('/docs/docs/pricing/snapshots', 'cb9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/redis/caching-layers',
                component: ComponentCreator('/docs/docs/redis/caching-layers', '82e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/redis/expirations',
                component: ComponentCreator('/docs/docs/redis/expirations', 'bf4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/redis/key-patterns',
                component: ComponentCreator('/docs/docs/redis/key-patterns', 'fc3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/redis/overview',
                component: ComponentCreator('/docs/docs/redis/overview', 'e5c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/aggregation',
                component: ComponentCreator('/docs/docs/reviews/aggregation', '020'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/caching',
                component: ComponentCreator('/docs/docs/reviews/caching', '468'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/moderation',
                component: ComponentCreator('/docs/docs/reviews/moderation', '041'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/overview',
                component: ComponentCreator('/docs/docs/reviews/overview', '7c2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/docs/reviews/verified-purchase',
                component: ComponentCreator('/docs/docs/reviews/verified-purchase', 'f8d'),
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
