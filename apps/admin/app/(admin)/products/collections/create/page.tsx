"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { CollectionForm } from "@/components/collections/collection-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAdminCreateCollection } from "@/hooks/collections/use-admin-create-collection";
import type { CreateCollectionInput, UpdateCollectionInput } from "@/lib/types/collections";

export default function CreateCollectionPage() {
  const router = useRouter();
  const createCollection = useAdminCreateCollection();

  const handleSubmit = async (data: CreateCollectionInput | UpdateCollectionInput) => {
    await createCollection.mutateAsync(data as CreateCollectionInput);
  };

  const handleCancel = () => {
    router.push("/products/collections");
  };

  return (
    <AdminPageLayout
      title="Create Collection"
      description="Create a new product collection"
      breadcrumbs={[
        { label: "Products", href: "/products" },
        { label: "Collections", href: "/products/collections" },
        { label: "Create" },
      ]}
      actions={
        <Button variant="outline" asChild>
          <Link href="/products/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <CollectionForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createCollection.isPending}
      />
    </AdminPageLayout>
  );
}

