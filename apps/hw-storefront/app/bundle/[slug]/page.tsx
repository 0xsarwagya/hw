"use client";

import dynamicImport from "next/dynamic";
import { use } from "react";

// Dynamically import Bundle1 to avoid SSR issues with React Query
const Bundle1 = dynamicImport(
  () => import("@/components/pages/bundle/Bundle1"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function BundleSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <Bundle1 />;
}
