"use client";

import { use } from "react";
import ProductDetails from "@/components/pages/ProductDetails";

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProductDetails />;
}
