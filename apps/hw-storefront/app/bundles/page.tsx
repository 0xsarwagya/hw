"use client";

import dynamicImport from "next/dynamic";

// Dynamically import BundlesList to avoid SSR issues with React Query
const BundlesList = dynamicImport(
  () => import("@/components/pages/BundlesList"),
  {
    ssr: false,
  },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function BundlesPage() {
  return <BundlesList />;
}
