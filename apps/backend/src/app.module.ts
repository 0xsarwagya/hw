import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AddressAutocompleteModule } from "./modules/address-autocomplete/address-autocomplete.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ProductsModule } from "./modules/products/products.module";
import { ShippingModule } from "./modules/shipping/shipping.module";

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
  ],
  controllers: [AppController],
})
export class AppModule {}
