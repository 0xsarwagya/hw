import React, { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
  product?: {
    name: string;
    price: string;
    currency: string;
    availability: string;
    condition: string;
    image?: string;
  };
}

export const SEO: React.FC<SEOProps> = ({
  title = "Hush & Wear - Premium Quality Apparel",
  description = "Discover premium quality apparel at Hush & Wear. Shop the latest collections of t-shirts, hoodies, and more.",
  image = "https://s6.imgcdn.dev/YT5tM2.png",
  url,
  type = "website",
  product,
}) => {
  const siteName = "Hush & Wear";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const currentUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to set or update meta tag
    const setMetaTag = (name: string, content: string, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        if (property) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Basic Meta Tags
    setMetaTag("description", description);

    // Open Graph / Facebook
    setMetaTag("og:type", type, true);
    setMetaTag("og:url", currentUrl, true);
    setMetaTag("og:title", fullTitle, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:image", image, true);
    setMetaTag("og:site_name", siteName, true);

    // Twitter
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:url", currentUrl);
    setMetaTag("twitter:title", fullTitle);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", image);

    // Canonical URL
    let canonical = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl);

    // Structured Data
    const structuredData = product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: product.image || image,
          description,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency,
            availability: `https://schema.org/${product.availability}`,
            itemCondition: `https://schema.org/${product.condition}`,
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: typeof window !== "undefined" ? window.location.origin : "",
          description,
        };

    let script = document.querySelector(
      'script[type="application/ld+json"]',
    ) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [
    title,
    description,
    image,
    url,
    type,
    product,
    fullTitle,
    currentUrl,
    siteName,
  ]);

  return null;
};
