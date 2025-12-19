import { CollectionDetailPageClient } from "@/components/collections/collection-detail-page-client";

interface CollectionDetailPageProps {
  params: Promise<{ collectionId: string }>;
}

export default async function CollectionDetailPage({
  params: _params,
}: CollectionDetailPageProps) {
  return <CollectionDetailPageClient />;
}
