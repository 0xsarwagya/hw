"use client";

import { useParams } from "next/navigation";
import React from "react";
import BundlePrinted from "../BundlePrinted";

/**
 * Bundle route 3: /bundle-3/:slug
 * Uses BundlePrinted component with slug-based routing
 */
const Bundle3: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  // Extract pack size from slug or use default
  return <BundlePrinted slug={slug} />;
};

export default Bundle3;
