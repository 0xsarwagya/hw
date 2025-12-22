import "dotenv/config";
import { Injectable } from "@nestjs/common";

/**
 * Application configuration service
 * Centralizes access to environment variables and configuration values
 * This ensures configurable data is at high levels and follows dependency injection principles
 */
@Injectable()
export class AppConfigService {
  /**
   * Get seller state (defaults to Maharashtra)
   */
  getSellerState(): string {
    return process.env.SELLER_STATE || "Maharashtra";
  }

  /**
   * Get storage provider type
   */
  getStorageProvider(): string {
    return process.env.STORAGE_PROVIDER || "minio";
  }

  /**
   * Get storage bucket name
   */
  getStorageBucket(): string {
    return process.env.STORAGE_BUCKET || "vcecom";
  }

  /**
   * Get AWS S3 configuration
   */
  getAwsS3Config(): {
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    region: string;
    bucket: string;
    publicUrl: string | undefined;
  } {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region:
        process.env.AWS_REGION || process.env.STORAGE_REGION || "us-east-1",
      bucket: this.getStorageBucket(),
      publicUrl: process.env.AWS_S3_PUBLIC_URL,
    };
  }

  /**
   * Get Supabase configuration
   */
  getSupabaseConfig(): {
    url: string | undefined;
    storageKey: string | undefined;
    anonKey: string | undefined;
    bucket: string;
  } {
    return {
      url: process.env.SUPABASE_URL,
      storageKey: process.env.SUPABASE_STORAGE_KEY,
      anonKey: process.env.SUPABASE_ANON_KEY,
      bucket: this.getStorageBucket(),
    };
  }

  /**
   * Get MinIO configuration
   */
  getMinioConfig(): {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    useSSL: boolean;
    bucket: string;
    publicUrl: string;
  } {
    const endpoint = process.env.MINIO_ENDPOINT || "localhost:9000";
    return {
      endpoint,
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
      useSSL: process.env.MINIO_USE_SSL === "true",
      bucket: this.getStorageBucket(),
      publicUrl:
        process.env.MINIO_PUBLIC_URL ||
        `http://${endpoint}/${this.getStorageBucket()}`,
    };
  }

  /**
   * Get Shiprocket configuration
   */
  getShiprocketConfig(): {
    email: string | undefined;
    password: string | undefined;
  } {
    return {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    };
  }

  /**
   * Get Nimbus Post configuration
   */
  getNimbusPostConfig(): {
    apiKey: string | undefined;
    apiSecret: string | undefined;
  } {
    return {
      apiKey: process.env.NIMBUS_POST_API_KEY,
      apiSecret: process.env.NIMBUS_POST_API_SECRET,
    };
  }

  /**
   * Get Razorpay configuration
   */
  getRazorpayConfig(): {
    keyId: string | undefined;
    keySecret: string | undefined;
    timeout: number;
  } {
    // Default timeout: 10 seconds (10000ms)
    // Can be overridden via RAZORPAY_TIMEOUT_MS environment variable
    const timeout = process.env.RAZORPAY_TIMEOUT_MS
      ? parseInt(process.env.RAZORPAY_TIMEOUT_MS, 10)
      : 10000;

    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      timeout,
    };
  }

  /**
   * Check if running in test environment
   */
  isTestEnvironment(): boolean {
    return process.env.NODE_ENV === "test";
  }
}
