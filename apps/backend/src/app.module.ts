import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { HealthLoggerController } from "./common/health/health-logger.controller";
import { HealthTracingController } from "./common/health/health-tracing.controller";
import { ContextModule } from "./common/logging/context.module";
import { LoggerModule } from "./common/logging/logger.module";
import { RateLimitingModule } from "./common/rate-limiting/rate-limiting.module";
import { OtelTracingModule } from "./common/tracing/otel-tracing.module";
import { AddressAutocompleteModule } from "./modules/address-autocomplete/address-autocomplete.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AdminAuthModule } from "./modules/admin-auth/admin-auth.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BundlesModule } from "./modules/bundles/bundles.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { DiscountsModule } from "./modules/discounts/discounts.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { ProductsModule } from "./modules/products/products.module";
import { RedisStoreModule } from "./modules/redis-store/redis-store.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { StorageModule } from "./modules/storage/storage.module";

@Module({
  imports: [
    // Register logging and tracing modules first
    LoggerModule,
    ContextModule,
    OtelTracingModule,
    RateLimitingModule,
    // Register StorageModule first so it's available to other modules
    StorageModule.forRootAsync(),
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CustomersModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    AdminModule,
    AdminAuthModule,
    InvoicesModule,
    AddressAutocompleteModule,
    DiscountsModule,
    PricingModule,
    RedisStoreModule,
    InventoryModule,
    BundlesModule,
    ReviewsModule,
  ],
  controllers: [AppController, HealthLoggerController, HealthTracingController],
})
export class AppModule {}
