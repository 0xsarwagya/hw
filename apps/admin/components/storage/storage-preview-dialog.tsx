"use client";

import { Copy, ExternalLink, Image as ImageIcon, X } from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCopyToClipboard } from "@/hooks/common/use-copy-to-clipboard";
import { formatFileSize, isImageFile } from "@/lib/utils/file-utils";

interface StoragePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    key: string;
    url: string;
    size?: number;
    contentType?: string;
  } | null;
}

export function StoragePreviewDialog({
  open,
  onOpenChange,
  file,
}: StoragePreviewDialogProps) {
  const { copyToClipboard } = useCopyToClipboard();

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="font-mono text-sm truncate flex-1 mr-4">
              {file.key}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isImageFile(file.key) ? (
            <div className="flex items-center justify-center bg-muted rounded-lg p-4 max-h-[70vh] overflow-auto relative w-full h-[70vh]">
              <NextImage
                src={file.url}
                alt={file.key}
                fill
                className="object-contain"
                unoptimized
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML =
                      '<p className="text-muted-foreground">Failed to load image</p>';
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-muted rounded-lg p-12">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Preview not available
                </p>
                <p className="text-sm text-muted-foreground">
                  This file type cannot be previewed
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                File Size
              </p>
              <p className="text-sm">
                {file.size ? (
                  formatFileSize(file.size)
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Content Type
              </p>
              <p className="text-sm">
                {file.contentType || (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                URL
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono truncate flex-1">{file.url}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(file.url, "URL")}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Open
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
