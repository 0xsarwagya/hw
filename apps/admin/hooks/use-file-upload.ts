"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, FileUploadResponse } from "@/lib/api";

interface UseFileUploadOptions {
  prefix?: string;
  compressionOptions?: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    format?: "webp" | "jpeg" | "png";
  };
  onSuccess?: (response: FileUploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options?: UseFileUploadOptions) {
  return useMutation({
    mutationFn: async (file: File): Promise<FileUploadResponse> => {
      return adminApi.uploadFile(
        file,
        options?.prefix,
        options?.compressionOptions,
      );
    },
    onSuccess: (data) => {
      toast.success("File uploaded successfully");
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload file");
      options?.onError?.(error);
    },
  });
}

export function useBatchFileUpload(options?: UseFileUploadOptions) {
  return useMutation({
    mutationFn: async (files: File[]): Promise<FileUploadResponse[]> => {
      return adminApi.uploadFiles(
        files,
        options?.prefix,
        options?.compressionOptions,
      );
    },
    onSuccess: (data) => {
      toast.success(`${data.length} file(s) uploaded successfully`);
      for (const file of data) {
        options?.onSuccess?.(file);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload files");
      options?.onError?.(error);
    },
  });
}
