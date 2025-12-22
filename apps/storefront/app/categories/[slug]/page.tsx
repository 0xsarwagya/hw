import { Suspense } from "react";
import { CategoryDetail } from "@/components/categories/category-detail";

function CategoryDetailLoading() {
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

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<CategoryDetailLoading />}>
      <CategoryDetailWrapper params={params} />
    </Suspense>
  );
}

async function CategoryDetailWrapper({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryDetail slug={slug} />;
}
