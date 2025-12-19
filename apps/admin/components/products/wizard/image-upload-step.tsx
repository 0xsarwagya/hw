"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WIZARD_STEPS } from "@/lib/constants/wizard.constants";

interface ImageUploadStepProps {
  pendingImages: File[];
  onImageUpload: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
}

/**
 * Step 3: Image Upload
 * Handles product image uploads with preview
 */
export function ImageUploadStep({
  pendingImages,
  onImageUpload,
  onRemoveImage,
}: ImageUploadStepProps) {
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onImageUpload(event.target.files);
    },
    [onImageUpload],
  );

  const handleDropZoneClick = useCallback(() => {
    document.getElementById("image-upload-wizard")?.click();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{WIZARD_STEPS[2].title}</CardTitle>
        <CardDescription>{WIZARD_STEPS[2].description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ImageDropZone
            onClick={handleDropZoneClick}
            onFileChange={handleFileInputChange}
          />
          {pendingImages.length > 0 && (
            <ImagePreviewGrid images={pendingImages} onRemove={onRemoveImage} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ImageDropZoneProps {
  onClick: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Image drop zone component
 */
function ImageDropZone({ onClick, onFileChange }: ImageDropZoneProps) {
  return (
    <>
      <button
        type="button"
        className="w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-primary/50 cursor-pointer bg-transparent"
        onClick={onClick}
        aria-label="Upload images"
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Click to select images or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          Images will be uploaded after product creation
        </p>
      </button>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onFileChange}
        className="hidden"
        id="image-upload-wizard"
      />
    </>
  );
}

interface ImagePreviewGridProps {
  images: File[];
  onRemove: (index: number) => void;
}

/**
 * Grid of image previews with remove functionality
 */
function ImagePreviewGrid({ images, onRemove }: ImagePreviewGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((file, index) => (
        <ImagePreviewItem
          key={`image-preview-${index}-${file.name}`}
          file={file}
          index={index}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface ImagePreviewItemProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}

/**
 * Single image preview item
 */
function ImagePreviewItem({ file, index, onRemove }: ImagePreviewItemProps) {
  const handleRemove = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onRemove(index);
    },
    [index, onRemove],
  );

  return (
    <div className="relative group">
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
          onClick={handleRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
    </div>
  );
}
