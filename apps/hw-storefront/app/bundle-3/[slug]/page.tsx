"use client";

import dynamicImport from "next/dynamic";
import { use } from "react";

// Dynamically import Bundle3 to avoid SSR issues with React Query
const Bundle3 = dynamicImport(
  () => import("@/components/pages/bundle/Bundle3"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function Bundle3Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <Bundle3 />;
}
