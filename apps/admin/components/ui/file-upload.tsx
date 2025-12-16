"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete?: (url: string, key: string) => void;
  prefix?: string;
  maxSize?: number; // in bytes
  accept?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  prefix = "products",
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = "image/*",
  disabled = false,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useFileUpload({
    prefix,
    compressionOptions: {
      quality: 60,
      maxWidth: 1280,
      format: "webp",
    },
    onSuccess: (response) => {
      onUploadComplete?.(response.url, response.key);
      setSelectedFile(null);
      setPreview(null);
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > maxSize) {
        toast.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }

      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [maxSize],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files?.[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile],
  );

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* biome-ignore lint/a11y/useSemanticElements: Div needed for drag-and-drop functionality */}
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive && "border-primary bg-primary/5",
          !dragActive && "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || uploadMutation.isPending}
          className="hidden"
          id="file-upload-input"
        />
        <label
          htmlFor="file-upload-input"
          className={cn(
            "cursor-pointer flex flex-col items-center gap-2",
            (disabled || uploadMutation.isPending) && "cursor-not-allowed",
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Click to upload
            </span>{" "}
            or drag and drop
          </div>
          <div className="text-xs text-muted-foreground">
            {accept === "image/*" ? "Images" : "Files"} up to{" "}
            {maxSize / 1024 / 1024}MB
          </div>
        </label>
      </div>

      {preview && (
        <div className="relative group">
          {/* biome-ignore lint/performance/noImgElement: Preview from FileReader */}
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-full rounded-md border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={uploadMutation.isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {selectedFile && !preview && (
        <div className="flex items-center justify-between p-3 border rounded-md">
          <span className="text-sm truncate">{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={uploadMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedFile && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
      )}
    </div>
  );
}
