import { forwardRef, Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";

@Module({
  imports: [forwardRef(() => ProductsModule)],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
