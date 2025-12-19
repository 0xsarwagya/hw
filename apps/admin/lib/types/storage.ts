/**
 * Storage-related TypeScript types
 * Mapped from backend DTOs
 */

export interface FileMetadata {
  key: string;
  url: string;
  size?: number;
  contentType?: string;
  originalName?: string;
}

export interface ListFilesResponse {
  files: FileMetadata[];
  total: number;
  prefix: string;
}

export interface ListFilesParams {
  prefix?: string;
  maxKeys?: number;
}

export interface PresignedUrlResponse {
  key: string;
  url: string;
  expiresIn: number;
}

export interface BatchDeleteResponse {
  deleted: number;
  failed: string[];
}

