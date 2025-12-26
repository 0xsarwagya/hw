"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useBundles } from "../../hooks/useBundles";
import LoadingSpinner from "../LoadingSpinner";
import { SEO } from "../SEO";

const BundlesList: React.FC = () => {
  const { data: bundlesData, isLoading } = useBundles(1, 50);
  const bundles = bundlesData?.data || [];

  // Create bundle slug for linking
  const getBundleSlug = (bundle: (typeof bundles)[0]) => {
    return `${bundle.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")}-${bundle.id.slice(-8)}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 animate-[fade-in_0.5s_ease-out]">
      <SEO
        title="Value Bundles - Save Up To 45%"
        description="Browse our curated bundles and save up to 45%. Mix and match sizes and colors to build your custom pack."
      />
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">
          Value Bundles
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
          Save up to 45% with our curated multi-packs. Choose your perfect
          bundle and customize it to your liking.
        </p>
      </div>

      {bundles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No bundles available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {bundles.map((bundle) => {
            const bundleSlug = getBundleSlug(bundle);
            const totalItems = bundle.sets.reduce(
              (sum, set) => sum + set.items.length,
              0,
            );
            const minQuantity = Math.min(
              ...bundle.sets.map((set) => set.minQuantity),
            );
            const maxQuantity = Math.max(
              ...bundle.sets.map((set) => set.maxQuantity),
            );

            return (
              <Link
                key={bundle.id}
                href={`/bundle/${bundleSlug}`}
                className="group relative rounded-2xl overflow-hidden bg-gray-100 h-[500px] flex flex-col shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/40"
              >
                <div className="h-3/5 overflow-hidden relative">
                  {bundle.image || bundle.thumbnailUrl ? (
                    <Image
                      src={bundle.image || bundle.thumbnailUrl || ""}
                      alt={bundle.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-6xl font-bold text-gray-400 uppercase">
                        {bundle.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    {bundle.sets.length} Set
                    {bundle.sets.length !== 1 ? "s" : ""}
                  </div>
                  {bundle.allowMixAndMatch && (
                    <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white">
                      Mix & Match
                    </div>
                  )}
                </div>
                <div className="flex-1 p-6 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
                      {bundle.title}
                    </h3>
                    {bundle.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {bundle.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>
                        {minQuantity === maxQuantity
                          ? `${minQuantity} Items`
                          : `${minQuantity}-${maxQuantity} Items`}
                      </span>
                      <span>•</span>
                      <span>{totalItems} Variants</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase text-primary">
                      View Bundle
                    </span>
                    <span className="material-icons text-primary group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BundlesList;
