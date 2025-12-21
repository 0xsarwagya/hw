import { forwardRef, Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { AdminCategoriesController } from "./admin-categories.controller";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";

@Module({
  imports: [forwardRef(() => ProductsModule)],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
