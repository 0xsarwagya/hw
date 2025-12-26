"use client";

import { Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Shop from "@/components/pages/Shop";

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function ShopPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Shop />
    </Suspense>
  );
}
