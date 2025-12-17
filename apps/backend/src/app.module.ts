import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AddressAutocompleteModule } from "./modules/address-autocomplete/address-autocomplete.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BundlesModule } from "./modules/bundles/bundles.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { DiscountsModule } from "./modules/discounts/discounts.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ProductsModule } from "./modules/products/products.module";
import { RedisStoreModule } from "./modules/redis-store/redis-store.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { StorageModule } from "./modules/storage/storage.module";

@Module({
  imports: [
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CustomersModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    AdminModule,
    InvoicesModule,
    AddressAutocompleteModule,
    DiscountsModule,
    StorageModule,
    RedisStoreModule,
    InventoryModule,
    BundlesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
