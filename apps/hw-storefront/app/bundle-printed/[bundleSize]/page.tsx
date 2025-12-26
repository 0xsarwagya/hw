"use client";

import dynamicImport from "next/dynamic";
import { use } from "react";

// Dynamically import BundlePrinted to avoid SSR issues with React Query
const BundlePrinted = dynamicImport(
  () => import("@/components/pages/BundlePrinted"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function BundlePrintedPage({
  params,
}: {
  params: Promise<{ bundleSize: string }>;
}) {
  const { bundleSize } = use(params);
  return <BundlePrinted />;
}
