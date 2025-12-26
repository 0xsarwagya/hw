"use client";

import dynamicImport from "next/dynamic";
import { use } from "react";

// Dynamically import BundleNew to avoid SSR issues with React Query
const BundleNew = dynamicImport(() => import("@/components/pages/BundleNew"), {
  ssr: false,
});

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function BundleNewPage({
  params,
}: {
  params: Promise<{ bundleSize: string }>;
}) {
  const { bundleSize } = use(params);
  return <BundleNew />;
}
