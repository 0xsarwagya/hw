"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { useAdminCreateCollection } from "@/hooks/collections/use-admin-create-collection";
import { BREADCRUMB_LABELS, ROUTES } from "@/lib/constants/routes.constants";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/types/collections";
import { CollectionForm } from "./collection-form";

export function CollectionFormPageClient() {
  const router = useRouter();
  const createCollection = useAdminCreateCollection();

  const handleSubmit = async (
    data: CreateCollectionInput | UpdateCollectionInput,
  ) => {
    await createCollection.mutateAsync(data as CreateCollectionInput);
  };

  const handleCancel = () => {
    router.push(ROUTES.PRODUCTS.COLLECTIONS.LIST);
  };

  return (
    <AdminPageLayout
      title={BREADCRUMB_LABELS.CREATE_COLLECTION}
      description="Create a new product collection"
      breadcrumbs={[
        { label: BREADCRUMB_LABELS.PRODUCTS, href: ROUTES.PRODUCTS.LIST },
        {
          label: BREADCRUMB_LABELS.COLLECTIONS,
          href: ROUTES.PRODUCTS.COLLECTIONS.LIST,
        },
        { label: BREADCRUMB_LABELS.CREATE_COLLECTION },
      ]}
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.PRODUCTS.COLLECTIONS.LIST}>
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
