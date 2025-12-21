import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { OrdersModule } from "../orders/orders.module";
import { AddressesController } from "./addresses.controller";
import { AddressesService } from "./addresses.service";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";
import { GstinVerificationService } from "./gstin-verification.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "change-me-in-production",
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      },
    }),
    forwardRef(() => OrdersModule),
  ],
  controllers: [CustomersController, AddressesController],
  providers: [CustomersService, AddressesService, GstinVerificationService],
  exports: [CustomersService, AddressesService, GstinVerificationService],
})
export class CustomersModule {}
