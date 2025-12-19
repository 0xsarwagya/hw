/**
 * Hook for managing file preview state
 * Extracted preview logic for reusability
 */

import { useState } from "react";
import type { FileMetadata } from "@/lib/types/storage";

interface UseFilePreviewOptions {
  onPreviewChange?: (file: FileMetadata | null) => void;
}

/**
 * Hook for managing file preview dialog state
 */
export function useFilePreview(options: UseFilePreviewOptions = {}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);

  const openPreview = (file: FileMetadata) => {
    setPreviewFile(file);
    setPreviewOpen(true);
    options.onPreviewChange?.(file);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
    options.onPreviewChange?.(null);
  };

  return {
    previewOpen,
    previewFile,
    openPreview,
    closePreview,
  };
}
