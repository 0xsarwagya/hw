"use client";

import { useParams } from "next/navigation";
import React from "react";
import BundleNew from "../BundleNew";

/**
 * Bundle route 2: /bundle-2/:slug
 * Uses BundleNew component with slug-based routing
 */
const Bundle2: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  // Extract pack size from slug or use default
  // For now, redirect to bundle-new with pack size
  // In future, can fetch bundle by slug and extract pack size
  return <BundleNew slug={slug} />;
};

export default Bundle2;
