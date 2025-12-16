import { Injectable, Logger } from "@nestjs/common";
import * as Minio from "minio";
import { StorageProvider } from "../interfaces/storage-provider.interface";

@Injectable()
export class MinioProvider implements StorageProvider {
  private readonly logger = new Logger(MinioProvider.name);
  private client: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || "localhost:9000";
    const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
    const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
    const useSSL = process.env.MINIO_USE_SSL === "true";
    this.bucket = process.env.STORAGE_BUCKET || "vcecom";
    this.publicUrl =
      process.env.MINIO_PUBLIC_URL || `http://${endpoint}/${this.bucket}`;

    this.client = new Minio.Client({
      endPoint: endpoint.split(":")[0],
      port: parseInt(endpoint.split(":")[1] || "9000", 10),
      useSSL,
      accessKey,
      secretKey,
    });

    // Only ensure bucket exists if not in test environment
    if (process.env.NODE_ENV !== "test") {
      this.ensureBucketExists().catch((error) => {
        this.logger.error(`Failed to ensure bucket exists: ${error.message}`);
      });
    }
  }

  private async ensureBucketExists(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, "us-east-1");
      this.logger.log(`Created bucket: ${this.bucket}`);
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
}
