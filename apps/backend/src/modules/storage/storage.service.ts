import "dotenv/config";
import { Injectable, OnModuleInit, Optional } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import { createLogContext } from "../../common/logging/logging.helper";
import {
  StorageProvider,
  StorageProviderType,
} from "./interfaces/storage-provider.interface";
import { AwsS3Provider } from "./providers/aws-s3.provider";
import { MinioProvider } from "./providers/minio.provider";
import { SupabaseProvider } from "./providers/supabase.provider";

@Injectable()
export class StorageService implements OnModuleInit {
  private provider: StorageProvider;

  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
    @Optional() private readonly minioProvider?: MinioProvider,
    @Optional() private readonly supabaseProvider?: SupabaseProvider,
    @Optional() private readonly awsS3Provider?: AwsS3Provider,
  ) {}

  onModuleInit() {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    const providerType = (
      process.env.STORAGE_PROVIDER || this.detectProvider()
    ).toLowerCase() as StorageProviderType;

    switch (providerType) {
      case "minio":
        if (!this.minioProvider) {
          throw new Error(
            "MINIO provider not registered. Please ensure STORAGE_PROVIDER=minio or provide MINIO credentials.",
          );
        }
        this.provider = this.minioProvider;
        this.logger.info(
          createLogContext(this.contextService, "onModuleInit", {
            provider: "minio",
          }),
          "Using MINIO storage provider",
        );
        break;
      case "supabase":
        if (!this.supabaseProvider) {
          throw new Error(
            "Supabase provider not registered. Please ensure STORAGE_PROVIDER=supabase or provide Supabase credentials.",
          );
        }
        this.provider = this.supabaseProvider;
        this.logger.info(
          createLogContext(this.contextService, "onModuleInit", {
            provider: "supabase",
          }),
          "Using Supabase storage provider",
        );
        break;
      case "aws":
        if (!this.awsS3Provider) {
          throw new Error(
            "AWS S3 provider not registered. Please ensure STORAGE_PROVIDER=aws or provide AWS credentials.",
          );
        }
        this.provider = this.awsS3Provider;
        this.logger.info(
          createLogContext(this.contextService, "onModuleInit", {
            provider: "aws",
          }),
          "Using AWS S3 storage provider",
        );
        break;
      default:
        this.logger.warn(
          createLogContext(this.contextService, "onModuleInit", {
            provider: providerType,
          }),
          "Unknown storage provider, falling back to MINIO",
        );
        if (!this.minioProvider) {
          throw new Error(
            "MINIO provider not registered and no valid provider found.",
          );
        }
        this.provider = this.minioProvider;
    }
  }

  private detectProvider(): StorageProviderType {
    // Check for AWS credentials
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return "aws";
    }

    // Check for Supabase credentials
    if (
      process.env.SUPABASE_URL &&
      (process.env.SUPABASE_STORAGE_KEY || process.env.SUPABASE_ANON_KEY)
    ) {
      return "supabase";
    }

    // Check for MINIO credentials (or use defaults)
    if (process.env.MINIO_ENDPOINT || process.env.MINIO_ACCESS_KEY) {
      return "minio";
    }

    // Default to MINIO
    return "minio";
  }

  /**
   * Upload a file to storage
   */
  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    return this.provider.upload(key, buffer, contentType);
  }

  /**
   * Delete a file from storage
   */
  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  /**
   * Get public URL for a file
   */
  async getUrl(key: string): Promise<string> {
    return this.provider.getUrl(key);
  }

  /**
   * Generate a presigned URL for direct upload
   */
  async getPresignedUrl(key: string, expiresIn?: number): Promise<string> {
    return this.provider.getPresignedUrl(key, expiresIn);
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  /**
   * List files in a prefix
   */
  async list(prefix: string, maxKeys?: number): Promise<string[]> {
    return this.provider.list(prefix, maxKeys);
  }

  /**
   * Get the current storage provider type
   */
  getProviderType(): StorageProviderType {
    const providerType = (
      process.env.STORAGE_PROVIDER || this.detectProvider()
    ).toLowerCase() as StorageProviderType;
    return providerType;
  }
}
