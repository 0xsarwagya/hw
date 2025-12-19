import { Injectable } from "@nestjs/common";
import * as Minio from "minio";
import { PinoLogger } from "nestjs-pino";
import { AppConfigService } from "../../../common/config/app.config.service";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { StorageProvider } from "../interfaces/storage-provider.interface";

@Injectable()
export class MinioProvider implements StorageProvider {
  private client: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
    private readonly appConfigService: AppConfigService,
  ) {
    const config = this.appConfigService.getMinioConfig();
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;

    this.client = new Minio.Client({
      endPoint: config.endpoint.split(":")[0],
      port: parseInt(config.endpoint.split(":")[1] || "9000", 10),
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });

    // Only ensure bucket exists if not in test environment
    if (!this.appConfigService.isTestEnvironment()) {
      this.ensureBucketExists().catch((error) => {
        this.logger.error(
          createErrorContext(this.contextService, "ensureBucketExists", error, {
            bucket: this.bucket,
          }),
          "Failed to ensure bucket exists",
        );
      });
    }
  }

  private async ensureBucketExists(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, "us-east-1");
      this.logger.info(
        createLogContext(this.contextService, "ensureBucketExists", {
          bucket: this.bucket,
        }),
        "Created bucket",
      );
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      await this.client.putObject(this.bucket, key, buffer, buffer.length, {
        "Content-Type": contentType,
      });
      return this.getUrl(key);
    } catch (error) {
      this.logger.error(
        `Failed to upload file ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
    } catch (error) {
      this.logger.error(
        `Failed to delete file ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getUrl(key: string): Promise<string> {
    return `${this.publicUrl}/${key}`;
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      return await this.client.presignedPutObject(this.bucket, key, expiresIn);
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix: string, maxKeys = 1000): Promise<string[]> {
    try {
      const objects: string[] = [];
      const stream = this.client.listObjects(this.bucket, prefix, true);

      return new Promise((resolve, reject) => {
        stream.on("data", (obj) => {
          if (objects.length < maxKeys) {
            objects.push(obj.name || "");
          }
          if (objects.length >= maxKeys) {
            stream.destroy();
            resolve(objects);
          }
        });

        stream.on("end", () => {
          resolve(objects);
        });

        stream.on("error", (error) => {
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to list files with prefix ${prefix}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `Failed to list files: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getMetadata(
    key: string,
  ): Promise<{ size: number; contentType?: string }> {
    try {
      const stat = await this.client.statObject(this.bucket, key);
      return {
        size: stat.size,
        contentType:
          stat.metaData?.["content-type"] || stat.metaData?.["Content-Type"],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get metadata for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `Failed to get file metadata: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
