import React from "react";
import { useParams } from "react-router-dom";
import BundleNew from "../BundleNew";

/**
 * Bundle route 2: /bundle-2/:slug
 * Uses BundleNew component with slug-based routing
 */
const Bundle2: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  // Extract pack size from slug or use default
  // For now, redirect to bundle-new with pack size
  // In future, can fetch bundle by slug and extract pack size
  return <BundleNew slug={slug} />;
};

export default Bundle2;
