import { CategoryDetailPageClient } from "@/components/categories/category-detail-page-client";

interface CategoryDetailPageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function CategoryDetailPage({
  params: _params,
}: CategoryDetailPageProps) {
  return <CategoryDetailPageClient />;
}
