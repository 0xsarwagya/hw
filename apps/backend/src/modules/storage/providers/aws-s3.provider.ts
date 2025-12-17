import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { StorageProvider } from "../interfaces/storage-provider.interface";

@Injectable()
export class AwsS3Provider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor(private readonly logger: PinoLogger) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.region =
      process.env.AWS_REGION || process.env.STORAGE_REGION || "us-east-1";
    this.bucket = process.env.STORAGE_BUCKET || "vcecom";

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS S3 configuration missing: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required",
      );
    }

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.client.send(command);
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
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
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
    // For public buckets, return public URL
    // For private buckets, return presigned URL (valid for 1 hour)
    const publicUrl = process.env.AWS_S3_PUBLIC_URL;
    if (publicUrl) {
      return `${publicUrl}/${key}`;
    }

    // Generate presigned URL for private buckets
    return this.getPresignedUrl(key, 3600);
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
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
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix: string, maxKeys = 1000): Promise<string[]> {
    try {
      const keys: string[] = [];
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          MaxKeys: Math.min(maxKeys - keys.length, 1000),
          ContinuationToken: continuationToken,
        });

        const response = await this.client.send(command);
        if (response.Contents) {
          keys.push(
            ...response.Contents.map((obj) => obj.Key || "").filter(Boolean),
          );
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken && keys.length < maxKeys);

      return keys;
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
