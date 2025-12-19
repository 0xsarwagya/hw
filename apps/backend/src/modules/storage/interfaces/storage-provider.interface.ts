/**
 * Unified interface for S3-compatible storage providers
 * Supports MINIO, Supabase Storage, and Amazon S3
 */
export interface StorageProvider {
  /**
   * Upload a file to storage
   * @param key - File key/path in storage
   * @param buffer - File buffer
   * @param contentType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;

  /**
   * Delete a file from storage
   * @param key - File key/path in storage
   */
  delete(key: string): Promise<void>;

  /**
   * Get public URL for a file
   * @param key - File key/path in storage
   * @returns Public URL
   */
  getUrl(key: string): Promise<string>;

  /**
   * Generate a presigned URL for direct upload
   * @param key - File key/path in storage
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @returns Presigned URL
   */
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Check if a file exists
   * @param key - File key/path in storage
   * @returns True if file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * List files in a prefix
   * @param prefix - Prefix to list files under
   * @param maxKeys - Maximum number of keys to return
   * @returns Array of file keys
   */
  list(prefix: string, maxKeys?: number): Promise<string[]>;

  /**
   * Get file metadata (size, content type)
   * @param key - File key/path in storage
   * @returns File metadata with size and content type
   */
  getMetadata(key: string): Promise<{ size: number; contentType?: string }>;
}

export type StorageProviderType = "minio" | "supabase" | "aws";
