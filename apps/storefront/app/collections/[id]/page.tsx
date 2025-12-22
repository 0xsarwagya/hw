import { Suspense } from "react";
import { CollectionDetail } from "@/components/collections/collection-detail";

function CollectionDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-64 mb-8" />
        <div className="grid md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i.toString()}`}
              className="h-64 bg-muted rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<CollectionDetailLoading />}>
      <CollectionDetailWrapper params={params} />
    </Suspense>
  );
}

async function CollectionDetailWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetail collectionId={id} />;
}
