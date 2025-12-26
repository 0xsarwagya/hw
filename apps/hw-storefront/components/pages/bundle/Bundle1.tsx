"use client";

import { useParams } from "next/navigation";
import React from "react";
import Bundle from "../Bundle";

/**
 * Bundle route 1: /bundle/:slug
 * Wrapper for Bundle component with slug-based routing
 */
const Bundle1: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  return <Bundle slug={slug} />;
};

export default Bundle1;
