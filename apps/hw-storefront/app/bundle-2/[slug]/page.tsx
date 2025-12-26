"use client";

import dynamicImport from "next/dynamic";
import { use } from "react";

// Dynamically import Bundle2 to avoid SSR issues with React Query
const Bundle2 = dynamicImport(
  () => import("@/components/pages/bundle/Bundle2"),
  { ssr: false },
);

// Force dynamic rendering since this page uses React Query hooks
export const dynamic = "force-dynamic";

export default function Bundle2Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <Bundle2 />;
}
