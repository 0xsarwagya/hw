"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useCollections } from "../../hooks/useApi";
import { useBundles } from "../../hooks/useBundles";
import LoadingSpinner from "../LoadingSpinner";

const FeaturedCategories: React.FC = () => {
  const { data: collections = [], isLoading: collectionsLoading } =
    useCollections();
  const { data: bundlesData, isLoading: bundlesLoading } = useBundles(1, 1);
  const bundles = bundlesData?.data || [];

  const isLoading = collectionsLoading || bundlesLoading;

  // Take first 2 collections and 1 bundle to display (3 items total)
  const displayCollections = collections.slice(0, 2);
  const displayBundle = bundles[0]; // Get first bundle if available

  if (isLoading) {
    return (
      <section className="py-20 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-black">
            Featured Collections
          </h2>
        </div>
        <LoadingSpinner />
      </section>
    );
  }

  if (displayCollections.length === 0 && !displayBundle) {
    return null; // Don't show section if no collections or bundles
  }

  // Create bundle slug for linking
  const getBundleSlug = (bundle: typeof displayBundle) => {
    if (!bundle) return "";
    return `${bundle.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")}-${bundle.id.slice(-8)}`;
  };

  return (
    <section className="py-20 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-black">
          Shop By Category
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Display Collections */}
        {displayCollections.map((collection) => (
          <Link
            key={collection.id}
            href={`/shop?collectionId=${collection.id}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-2xl mb-6 bg-gray-100 shadow-sm aspect-[9/16]">
              {collection.imageUrl ? (
                <Image
                  src={collection.imageUrl}
                  alt={collection.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400 uppercase">
                    {collection.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                {collection.name}
              </h3>
              <span className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 group-hover:text-black group-hover:border-black transition-all">
                Explore Collection
              </span>
            </div>
          </Link>
        ))}

        {/* Display Bundle as 3rd item - Link to bundles page */}
        {displayBundle && (
          <Link href="/bundles" className="group block">
            <div className="relative overflow-hidden rounded-2xl mb-6 bg-gray-100 shadow-sm aspect-[9/16]">
              {displayBundle.image || displayBundle.thumbnailUrl ? (
                <Image
                  src={displayBundle.image || displayBundle.thumbnailUrl || ""}
                  alt={displayBundle.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB4PwueFyx_SM4ZjCWoo7-L8UznMDSkO8cfhSUCtoB2jDhdOPpVnFVUBZWsZklLQHwmi7UOza52s6e6kuSzAvr0vte2K-edCha53sHE6y1eVI0dbKwKj89t2OB6io_e84qWu3Tcy-GLPN__lWhNuytgtkFN_VkXopjH__TUomHMIi9mftFGH1ImQgEyDBtEXwv3I-1h17M5CMM1pyWnsvQGWNR3MSQRBLtfaE1mscMvnsdKApLb90ukV1MwMW9zL5CpEvo_7x9fkrj"
                  alt="Bundles"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                {displayBundle.title}
              </h3>
              <span className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 group-hover:text-black group-hover:border-black transition-all">
                Save Up To 45%
              </span>
            </div>
          </Link>
        )}

        {/* If no bundle but we have space, show a 3rd collection */}
        {!displayBundle && collections.length >= 3 && (
          <Link
            key={collections[2].id}
            href={`/shop?collectionId=${collections[2].id}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-2xl mb-6 bg-gray-100 shadow-sm aspect-[9/16]">
              {collections[2].imageUrl ? (
                <Image
                  src={collections[2].imageUrl}
                  alt={collections[2].name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400 uppercase">
                    {collections[2].name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                {collections[2].name}
              </h3>
              <span className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 group-hover:text-black group-hover:border-black transition-all">
                Explore Collection
              </span>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;
