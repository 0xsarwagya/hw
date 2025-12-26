/**
 * Hook for uploading files to storage
 * Extracted upload logic for reusability
 */

import { useState } from "react";
import { toast } from "sonner";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "@/lib/constants/messages.constants";
import { endpoints } from "@/lib/endpoints";

interface UseStorageUploadOptions {
  prefix?: string;
  onSuccess?: () => void;
}

/**
 * Hook for handling file uploads to storage
 */
export function useStorageUpload(options: UseStorageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (options.prefix) {
        formData.append("prefix", options.prefix);
      }

      // Use Next.js API proxy route to ensure cookies are properly forwarded
      const response = await fetch("/api/admin/storage/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(SUCCESS_MESSAGES.FILE_UPLOADED);
        options.onSuccess?.();
        return data;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || ERROR_MESSAGES.FAILED_TO_UPLOAD_FILE,
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.ERROR_UPLOADING_FILE,
      );
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
  };
}
