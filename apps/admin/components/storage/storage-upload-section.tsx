"use client";

import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StorageUploadSectionProps {
  prefix: string;
  onPrefixChange: (prefix: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileCount?: number;
}

export function StorageUploadSection({
  prefix,
  onPrefixChange,
  onUpload,
  fileCount,
}: StorageUploadSectionProps) {
  return (
    <div className="flex gap-4 items-end">
      <div className="flex-1">
        <Label htmlFor="prefix">Filter by prefix</Label>
        <Input
          id="prefix"
          placeholder="products, categories, collections, etc."
          value={prefix}
          onChange={(e) => onPrefixChange(e.target.value)}
        />
        {prefix && (
          <p className="text-xs text-muted-foreground mt-1">
            Showing files with prefix:{" "}
            <span className="font-mono">{prefix}</span>
          </p>
        )}
      </div>
      <div className="flex items-end gap-2">
        {fileCount !== undefined && (
          <Badge variant="secondary" className="h-10 px-3">
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </Badge>
        )}
        <Label htmlFor="upload" className="cursor-pointer">
          <Button asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </span>
          </Button>
          <Input
            id="upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
        </Label>
      </div>
    </div>
  );
}
