"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { productMapper } from "../../context/ShopContext";
import { useProducts } from "../../hooks/useApi";
import type { Product as BackendProduct } from "../../lib/validations/product";
import { Product } from "../../types";
import { formatCurrency } from "../../utils";
import LoadingSpinner from "../LoadingSpinner";

interface BestSellersProps {
  products?: Product[]; // Optional - if not provided, will fetch from API
}

const BestSellers: React.FC<BestSellersProps> = ({
  products: propProducts,
}) => {
  const router = useRouter();

  // Fetch products from API if not provided via props
  const { data: productsData, isLoading } = useProducts({ limit: 12 });
  const backendProducts: BackendProduct[] = productsData?.data || [];

  // Map backend products to UI format
  const products = useMemo(() => {
    // Use prop products if provided, otherwise map from API
    if (propProducts) {
      return propProducts;
    }
    return backendProducts.map((p) => productMapper(p, []));
  }, [propProducts, backendProducts]);

  const handleQuickAdd = (product: Product) => {
    // Navigate to product page for proper variant selection
    // Quick add requires variant selection, so redirect to product page
    router.push(`/product/${product.id}`);
  };

  // Loading state
  if (isLoading && !propProducts) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-row items-end justify-between gap-4">
            <h2 className="text-3xl md:text-6xl font-bold uppercase tracking-tighter text-black leading-none">
              Best
              <br />
              <span className="text-primary">Sellers</span>
            </h2>
            <Link
              href="/shop"
              className="px-4 py-2 md:px-8 md:py-3 border-2 border-black rounded-full font-bold uppercase hover:bg-black hover:text-white transition-colors tracking-wide text-xs md:text-base whitespace-nowrap"
            >
              View All Products
            </Link>
          </div>
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-row items-end justify-between gap-4">
            <h2 className="text-3xl md:text-6xl font-bold uppercase tracking-tighter text-black leading-none">
              Best
              <br />
              <span className="text-primary">Sellers</span>
            </h2>
            <Link
              href="/shop"
              className="px-4 py-2 md:px-8 md:py-3 border-2 border-black rounded-full font-bold uppercase hover:bg-black hover:text-white transition-colors tracking-wide text-xs md:text-base whitespace-nowrap"
            >
              View All Products
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No products available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-row items-end justify-between gap-4">
          <h2 className="text-3xl md:text-6xl font-bold uppercase tracking-tighter text-black leading-none">
            Best
            <br />
            <span className="text-primary">Sellers</span>
          </h2>
          <Link
            href="/shop"
            className="px-4 py-2 md:px-8 md:py-3 border-2 border-black rounded-full font-bold uppercase hover:bg-black hover:text-white transition-colors tracking-wide text-xs md:text-base whitespace-nowrap"
          >
            View All Products
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-hide">
          {products.map((product, idx) => (
            <div
              key={product.id}
              className="min-w-[60%] sm:min-w-[40%] md:min-w-[30%] lg:min-w-[22%] xl:min-w-[18%] snap-start group flex flex-col"
            >
              <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-4 aspect-[9/16]">
                <Link href={`/product/${product.id}`}>
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                </Link>
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {idx < 3 && (
                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                      <span className="material-icons text-[12px]">
                        local_fire_department
                      </span>{" "}
                      HOT
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleQuickAdd(product)}
                  className="absolute bottom-4 left-4 right-4 bg-white text-black font-bold py-3 rounded shadow-lg translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 uppercase text-xs flex items-center justify-center gap-2 hover:bg-primary hover:text-white"
                >
                  <span className="material-icons text-sm">shopping_bag</span>{" "}
                  Quick Add
                </button>
              </div>

              <div className="flex-1 flex flex-col">
                <Link href={`/product/${product.id}`} className="block">
                  <h3 className="font-bold text-lg uppercase leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-lg font-bold">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="flex text-accent">
                    <span className="material-icons text-sm">star</span>
                    <span className="text-xs text-gray-500 font-bold ml-1">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
