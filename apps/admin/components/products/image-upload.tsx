"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

type Props = {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxImages?: number;
  prefix?: string;
};

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  prefix = "products",
}: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>(value);
  const [newUrl, setNewUrl] = useState("");
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
      const updated = [...imageUrls, response.key]; // Store S3 key
      setImageUrls(updated);
      onChange?.(updated);
      setSelectedFile(null);
      setPreview(null);
    },
  });

  const handleAddUrl = () => {
    if (newUrl.trim() && imageUrls.length < maxImages) {
      const updated = [...imageUrls, newUrl.trim()];
      setImageUrls(updated);
      onChange?.(updated);
      setNewUrl("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updated);
    onChange?.(updated);
  };

  const handleFile = useCallback((file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

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
    if (selectedFile && imageUrls.length < maxImages) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  // Helper to get display URL (resolve S3 keys or use as-is)
  const getDisplayUrl = (urlOrKey: string): string => {
    // If it's an S3 key (starts with prefix and no http), we'll need to resolve it
    // For now, return as-is - the backend will resolve it when fetching product images
    return urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")
      ? urlOrKey
      : urlOrKey; // S3 keys will be resolved by backend
  };

  return (
    <div className="space-y-4">
      <Label>Product Images</Label>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="url">Enter URL</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
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
              (imageUrls.length >= maxImages || uploadMutation.isPending) &&
                "opacity-50 cursor-not-allowed",
            )}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              disabled={
                imageUrls.length >= maxImages || uploadMutation.isPending
              }
              className="hidden"
              id="image-upload-input"
            />
            <label
              htmlFor="image-upload-input"
              className={cn(
                "cursor-pointer flex flex-col items-center gap-2",
                (imageUrls.length >= maxImages || uploadMutation.isPending) &&
                  "cursor-not-allowed",
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
                Images up to 10MB (will be compressed automatically)
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
                onClick={handleRemoveFile}
                disabled={uploadMutation.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {selectedFile && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={
                uploadMutation.isPending || imageUrls.length >= maxImages
              }
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
                  Upload Image
                </>
              )}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter image URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              disabled={imageUrls.length >= maxImages}
            />
            <Button
              type="button"
              onClick={handleAddUrl}
              disabled={!newUrl.trim() || imageUrls.length >= maxImages}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {imageUrls.length >= maxImages && (
            <p className="text-sm text-muted-foreground">
              Maximum {maxImages} images allowed
            </p>
          )}
        </TabsContent>
      </Tabs>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {imageUrls.map((urlOrKey, index) => {
            const displayUrl = getDisplayUrl(urlOrKey);
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: Index needed for remove handler and alt text
                key={`${urlOrKey}-${index}`}
                className="relative group"
              >
                {/* biome-ignore lint/performance/noImgElement: External URLs may not work with Next.js Image */}
                <img
                  src={displayUrl}
                  alt={`Product ${index + 1}`}
                  className={cn(
                    "h-32 w-full rounded-md border object-cover",
                    "group-hover:opacity-75 transition-opacity",
                  )}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E";
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveUrl(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {imageUrls.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No images added. Upload files or add image URLs to display product
          images.
        </p>
      )}
    </div>
  );
}
