"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Upload, Copy, ExternalLink, Image as ImageIcon, Eye, X } from "lucide-react";
import { useAdminStorageList } from "@/hooks/storage/use-admin-storage-list";
import { useAdminStorageDelete } from "@/hooks/storage/use-admin-storage-delete";
import { endpoints } from "@/lib/endpoints";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorDisplay } from "@/components/ui/error-display";
import { toast } from "sonner";
import type { FetchError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function StoragePage() {
  const [prefix, setPrefix] = useState("");
  const [debouncedPrefix, setDebouncedPrefix] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [fileToPreview, setFileToPreview] = useState<{ key: string; url: string; size?: number; contentType?: string } | null>(null);
  const { data, isLoading, error, refetch } = useAdminStorageList({ prefix: debouncedPrefix || undefined });
  const deleteFile = useAdminStorageDelete();

  // Debounce prefix input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrefix(prefix);
    }, 300);

    return () => clearTimeout(timer);
  }, [prefix]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const isImageFile = (key: string): boolean => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    return imageExtensions.some((ext) => key.toLowerCase().endsWith(ext));
  };

  const truncateUrl = (url: string, maxLength: number = 50): string => {
    if (url.length <= maxLength) return url;
    return `${url.substring(0, maxLength)}...`;
  };

  const handleDeleteClick = (key: string) => {
    setFileToDelete(key);
    setDeleteDialogOpen(true);
  };

  const handlePreviewClick = (file: { key: string; url: string; size?: number; contentType?: string }) => {
    setFileToPreview(file);
    setPreviewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
      try {
        await deleteFile.mutateAsync(fileToDelete);
        refetch();
        setDeleteDialogOpen(false);
        setFileToDelete(null);
      } catch (error) {
        // Error already handled by hook
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    if (prefix) formData.append("prefix", prefix);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_URL}${endpoints.storage.upload}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        toast.success("File uploaded successfully");
        refetch();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to upload file");
      }
    } catch (error) {
      toast.error("Error uploading file. Please try again.");
    }
  };

  return (
    <AdminPageLayout
      title="Storage"
      description="Manage uploaded files"
    >
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteFile.isPending}
      />

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="font-mono text-sm truncate flex-1 mr-4">{fileToPreview?.key}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {fileToPreview && (
            <div className="space-y-4">
              {isImageFile(fileToPreview.key) ? (
                <div className="flex items-center justify-center bg-muted rounded-lg p-4 max-h-[70vh] overflow-auto">
                  <img
                    src={fileToPreview.url}
                    alt={fileToPreview.key}
                    className="max-w-full max-h-[70vh] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<p className="text-muted-foreground">Failed to load image</p>';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center bg-muted rounded-lg p-12">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">Preview not available</p>
                    <p className="text-sm text-muted-foreground">This file type cannot be previewed</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">File Size</p>
                  <p className="text-sm">
                    {fileToPreview.size ? (
                      fileToPreview.size < 1024
                        ? `${fileToPreview.size} B`
                        : fileToPreview.size < 1024 * 1024
                        ? `${(fileToPreview.size / 1024).toFixed(2)} KB`
                        : `${(fileToPreview.size / (1024 * 1024)).toFixed(2)} MB`
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Content Type</p>
                  <p className="text-sm">{fileToPreview.contentType || <span className="text-muted-foreground">Unknown</span>}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">URL</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono truncate flex-1">{fileToPreview.url}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(fileToPreview.url, "URL")}
                    >
                      <Copy className="h-3.5 w-3.5 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(fileToPreview.url, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {error && (
        <ErrorDisplay error={error as FetchError} onRetry={() => refetch()} className="mb-4" />
      )}

      <div className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="prefix">Filter by prefix</Label>
            <Input
              id="prefix"
              placeholder="products, categories, collections, etc."
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
            {debouncedPrefix && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing files with prefix: <span className="font-mono">{debouncedPrefix}</span>
              </p>
            )}
          </div>
          <div className="flex items-end gap-2">
            {data && (
              <Badge variant="secondary" className="h-10 px-3">
                {data.total} {data.total === 1 ? "file" : "files"}
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
                onChange={handleUpload}
              />
            </Label>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="h-12 animate-pulse bg-muted" />
                    <TableCell className="h-12 animate-pulse bg-muted" />
                    <TableCell className="h-12 animate-pulse bg-muted" />
                    <TableCell className="h-12 animate-pulse bg-muted" />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
      ) : data && data.files.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {debouncedPrefix ? "No files found with this prefix" : "No files found"}
            </p>
            <p className="text-sm">
              {debouncedPrefix 
                ? "Try a different prefix or upload a new file"
                : "Upload your first file to get started"}
            </p>
            {debouncedPrefix && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setPrefix("")}
              >
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Preview</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="w-[120px]">Size</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.files.map((file) => (
                  <TableRow key={file.key}>
                    <TableCell>
                      {isImageFile(file.key) ? (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-muted">
                          <img
                            src={file.url}
                            alt={file.key}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md border bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm max-w-[300px] truncate" title={file.key}>
                        {file.key}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[400px]">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm truncate flex-1"
                          title={file.url}
                        >
                          {truncateUrl(file.url)}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={() => copyToClipboard(file.url, "URL")}
                          title="Copy URL"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={() => window.open(file.url, "_blank")}
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {file.size ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {file.size < 1024
                              ? `${file.size} B`
                              : file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(2)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                          </span>
                          {file.contentType && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {file.contentType.split("/")[1]?.toUpperCase() || file.contentType}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isImageFile(file.key) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePreviewClick(file)}
                            title="Preview file"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(file.key, "Key")}
                          title="Copy key"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(file.key)}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}

