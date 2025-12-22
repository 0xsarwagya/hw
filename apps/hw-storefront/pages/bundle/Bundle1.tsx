import React from "react";
import { useParams } from "react-router-dom";
import Bundle from "../Bundle";

/**
 * Bundle route 1: /bundle/:slug
 * Wrapper for Bundle component with slug-based routing
 */
const Bundle1: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Bundle slug={slug} />;
};

export default Bundle1;
