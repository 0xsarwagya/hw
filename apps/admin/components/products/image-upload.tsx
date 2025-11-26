"use client";

import { Upload, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxImages?: number;
};

export function ImageUpload({ value = [], onChange, maxImages = 5 }: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>(value);
  const [newUrl, setNewUrl] = useState("");

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

  return (
    <div className="space-y-4">
      <Label>Product Images</Label>
      <div className="space-y-2">
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
      </div>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {imageUrls.map((url, index) => (
            <div key={url} className="relative group">
              {/* biome-ignore lint/performance/noImgElement: External URLs may not work with Next.js Image */}
              <img
                src={url}
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
          ))}
        </div>
      )}

      {imageUrls.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No images added. Add image URLs to display product images.
        </p>
      )}
    </div>
  );
}
