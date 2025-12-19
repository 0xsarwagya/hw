"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  dropZoneText?: string;
  dropZoneSubtext?: string;
  showPreview?: boolean;
  maxFiles?: number;
}

/**
 * Reusable file upload component with drag-and-drop support
 */
export function FileUpload({
  onFileSelect,
  accept = "image/*",
  multiple = false,
  disabled = false,
  className,
  dropZoneText = "Click to select files or drag and drop",
  dropZoneSubtext,
  showPreview = true,
  maxFiles,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        const filesToUse =
          maxFiles && fileArray.length > maxFiles
            ? fileArray.slice(0, maxFiles)
            : fileArray;
        setPreviewFiles((prev) => [...prev, ...filesToUse]);
        onFileSelect(files);
      }
    },
    [onFileSelect, maxFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        const filesToUse =
          maxFiles && fileArray.length > maxFiles
            ? fileArray.slice(0, maxFiles)
            : fileArray;
        setPreviewFiles((prev) => [...prev, ...filesToUse]);
        onFileSelect(files);
      }
    },
    [onFileSelect, disabled, maxFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemovePreview = useCallback((index: number) => {
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDropZoneClick = useCallback(() => {
    if (!disabled) {
      document.getElementById("file-upload-input")?.click();
    }
  }, [disabled]);

  return (
    <div className={cn("space-y-4", className)}>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer bg-transparent",
          isDragging && "border-primary",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-primary/50",
        )}
        onClick={handleDropZoneClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="Upload files"
      >
        <Upload
          className={cn(
            "mx-auto h-8 w-8 mb-2",
            isDragging ? "text-primary" : "text-muted-foreground",
          )}
        />
        <p className="text-sm text-muted-foreground mb-2">{dropZoneText}</p>
        {dropZoneSubtext && (
          <p className="text-xs text-muted-foreground">{dropZoneSubtext}</p>
        )}
      </button>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        id="file-upload-input"
        disabled={disabled}
      />
      {showPreview && previewFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewFiles.map((file, index) => (
            <div
              key={`file-preview-${index}-${file.name}`}
              className="relative group"
            >
              {file.type.startsWith("image/") ? (
                <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePreview(index);
                    }}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center p-2">
                    {file.name}
                  </p>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePreview(index);
                    }}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
