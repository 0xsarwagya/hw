import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { VariantsController } from "./variants.controller";
import { VariantsService } from "./variants.service";

@Module({
  imports: [StorageModule],
  controllers: [ProductsController, VariantsController],
  providers: [ProductsService, VariantsService],
  exports: [ProductsService, VariantsService],
})
export class ProductsModule {}
