import { Module } from "@nestjs/common";
import { PermissionsController } from "./permissions.controller";
import { PermissionsService } from "./permissions.service";

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService], // Export for use in guards
})
export class PermissionsModule {}
