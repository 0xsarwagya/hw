import { Injectable, Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { StorageProvider } from "../interfaces/storage-provider.interface";

@Injectable()
export class SupabaseProvider implements StorageProvider {
  private readonly logger = new Logger(SupabaseProvider.name);
  private client: SupabaseClient;
  private bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_STORAGE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Supabase configuration missing: SUPABASE_URL and SUPABASE_STORAGE_KEY are required",
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey);
    this.bucket = process.env.STORAGE_BUCKET || "vcecom";

    // Only ensure bucket exists if not in test environment
    if (process.env.NODE_ENV !== "test") {
      this.ensureBucketExists().catch((error) => {
        this.logger.error(`Failed to ensure bucket exists: ${error.message}`);
      });
    }
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const { data, error } = await this.client.storage.listBuckets();
      if (error) throw error;

      const bucketExists = data?.some((b) => b.name === this.bucket);
      if (!bucketExists) {
        const { error: createError } = await this.client.storage.createBucket(
          this.bucket,
          {
            public: true,
          },
        );
        if (createError) throw createError;
        this.logger.log(`Created bucket: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.warn(
        `Bucket check/create failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      const { error } = await this.client.storage
        .from(this.bucket)
        .upload(key, buffer, {
          contentType,
          upsert: true,
        });

      if (error) throw error;

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
      const { error } = await this.client.storage
        .from(this.bucket)
        .remove([key]);
      if (error) throw error;
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
    try {
      const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
      return data.publicUrl;
    } catch (error) {
      this.logger.error(
        `Failed to get URL for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(
        `Failed to get URL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .createSignedUploadUrl(key, {
          upsert: true,
        });

      if (error) throw error;
      return data.signedUrl;
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
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list(key.split("/").slice(0, -1).join("/"));
      if (error) return false;
      const fileName = key.split("/").pop();
      return data?.some((file) => file.name === fileName) ?? false;
    } catch {
      return false;
    }
  }

  async list(prefix: string, maxKeys = 1000): Promise<string[]> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .list(prefix, {
          limit: maxKeys,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) throw error;

      return (data || []).map((file) =>
        `${prefix}/${file.name}`.replace(/\/\//g, "/"),
      );
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
