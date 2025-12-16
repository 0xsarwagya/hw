import { Module } from "@nestjs/common";
import { AwsS3Provider } from "./providers/aws-s3.provider";
import { MinioProvider } from "./providers/minio.provider";
import { SupabaseProvider } from "./providers/supabase.provider";
import { ImageCompressionService } from "./services/image-compression.service";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";

@Module({
  controllers: [StorageController],
  providers: [
    StorageService,
    MinioProvider,
    SupabaseProvider,
    AwsS3Provider,
    ImageCompressionService,
  ],
  exports: [StorageService, ImageCompressionService],
})
export class StorageModule {}
