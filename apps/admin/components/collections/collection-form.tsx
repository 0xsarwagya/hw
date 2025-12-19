"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCollectionSchema, updateCollectionSchema } from "@/lib/validations/collections";
import type { Collection, CreateCollectionInput, UpdateCollectionInput } from "@/lib/types/collections";
import { useState } from "react";
import { Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

interface CollectionFormProps {
  collection?: Collection;
  onSubmit: (data: CreateCollectionInput | UpdateCollectionInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CollectionForm({
  collection,
  onSubmit,
  onCancel,
  isLoading = false,
}: CollectionFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(collection?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CreateCollectionInput | UpdateCollectionInput>({
    resolver: zodResolver(collection ? updateCollectionSchema : createCollectionSchema),
    defaultValues: collection
      ? {
          name: collection.name,
          slug: collection.slug,
          description: collection.description || undefined,
          imageUrl: collection.imageUrl || undefined,
        }
      : {
          name: "",
          slug: "",
          description: "",
          imageUrl: undefined,
        },
  });

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", "collections");

      // Upload directly to backend using native fetch - cookies sent automatically
      // Don't use api.post as it stringifies FormData to JSON
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const uploadResponse = await fetch(`${API_URL}${endpoints.storage.upload}`, {
        method: "POST",
        body: formData,
        credentials: "include", // Include httpOnly cookies
        // Don't set Content-Type - browser will set it with boundary for FormData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      const url = uploadData.url || uploadData.key;
      setImageUrl(url);
      form.setValue("imageUrl", url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    form.setValue("imageUrl", undefined);
  };

  const handleSubmit = async (data: CreateCollectionInput | UpdateCollectionInput) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Collection Information</CardTitle>
            <CardDescription>Basic details about the collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Sale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="summer-sale" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    URL-friendly identifier (auto-generated from name if not provided)
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hot summer deals and discounts"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collection Image</CardTitle>
            <CardDescription>Upload a cover image for the collection</CardDescription>
          </CardHeader>
          <CardContent>
            {imageUrl ? (
              <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Collection cover"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a collection cover image
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                  id="collection-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("collection-image-upload")?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Select Image"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isUploading}>
            {isLoading ? "Saving..." : collection ? "Update Collection" : "Create Collection"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

