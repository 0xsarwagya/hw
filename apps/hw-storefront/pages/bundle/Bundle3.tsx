import React from "react";
import { useParams } from "react-router-dom";
import BundlePrinted from "../BundlePrinted";

/**
 * Bundle route 3: /bundle-3/:slug
 * Uses BundlePrinted component with slug-based routing
 */
const Bundle3: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  // Extract pack size from slug or use default
  return <BundlePrinted slug={slug} />;
};

export default Bundle3;
