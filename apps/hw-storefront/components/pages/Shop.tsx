"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import QuickViewModal from "../../components/QuickViewModal";
import { SEO } from "../../components/SEO";
import ShopFilters from "../../components/shop/ShopFilters";
import { productMapper } from "../../context/ShopContext";
import {
  useCollection,
  useCollectionProducts,
  useCollections,
  useProducts,
} from "../../hooks/useApi";
import type { Product as BackendProduct } from "../../lib/validations/product";
import { Product } from "../../types";
import { formatCurrency } from "../../utils";

const ITEMS_PER_PAGE = 12;

const Shop: React.FC = () => {
  const pathname = usePathname();
  const searchParamsObj = useSearchParams();
  const searchParams = new URLSearchParams(searchParamsObj?.toString() || "");
  const initialCategoryId =
    searchParams.get("categoryId") || searchParams.get("category");
  const collectionId = searchParams.get("collectionId");
  const searchQuery = searchParams.get("search");

  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("Best Sellers");

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Quick View State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );

  // Fetch collection info if collectionId is present
  const { data: collection } = useCollection(collectionId || undefined);

  // Fetch all collections for filter display
  const { data: allCollections = [] } = useCollections();

  // Initialize Category and Collection from URL
  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategories([initialCategoryId]);
    }
    if (collectionId) {
      setSelectedCollections([collectionId]);
    }
  }, [initialCategoryId, collectionId]);

  // Map sort option to backend params
  const sortParams = useMemo(() => {
    switch (sortOption) {
      case "Price: Low to High":
        return { sortBy: "price", sortOrder: "asc" };
      case "Price: High to Low":
        return { sortBy: "price", sortOrder: "desc" };
      case "Newest":
        return { sortBy: "date", sortOrder: "desc" };
      case "Best Sellers":
      default:
        return { sortBy: "date", sortOrder: "desc" }; // Backend doesn't have reviews sort, use date
    }
  }, [sortOption]);

  // Build filter params for backend
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      ...sortParams,
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    if (selectedCategories.length > 0) {
      // Backend expects single categoryId, use first selected
      params.categoryId = selectedCategories[0];
    }

    if (priceRange[0] > 0) {
      params.minPrice = priceRange[0];
    }
    if (priceRange[1] < 5000) {
      params.maxPrice = priceRange[1];
    }

    // Note: Color and size filtering would need variant-level filtering
    // For now, we'll do client-side filtering on these
    return params;
  }, [currentPage, sortParams, searchQuery, selectedCategories, priceRange]);

  // Fetch products from backend with filters or from collection
  // If a collection is selected via filter (not URL), use collection products endpoint
  const selectedCollectionId =
    selectedCollections.length > 0 ? selectedCollections[0] : collectionId;

  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useProducts(selectedCollectionId ? undefined : filterParams);

  const {
    data: collectionProductsData,
    isLoading: isLoadingCollectionProducts,
    error: collectionError,
  } = useCollectionProducts(
    selectedCollectionId || undefined,
    selectedCollectionId
      ? { page: currentPage, limit: ITEMS_PER_PAGE }
      : undefined,
  );

  const isLoading = selectedCollectionId
    ? isLoadingCollectionProducts
    : isLoadingProducts;
  const error = selectedCollectionId ? collectionError : productsError;
  const backendProducts: BackendProduct[] = selectedCollectionId
    ? collectionProductsData?.data || []
    : productsData?.data || [];

  const totalPages = selectedCollectionId
    ? collectionProductsData?.totalPages || 1
    : productsData?.totalPages || 1;

  // Debug logging
  useEffect(() => {
    if (productsError) {
      console.error("Products fetch error:", productsError);
    }
    console.log("Products data:", productsData);
    console.log("Backend products:", backendProducts);
  }, [productsError, productsData, backendProducts]);

  // Map backend products to UI format
  const displayedProducts = useMemo(() => {
    let mapped = backendProducts.map((p) => productMapper(p, [])); // Variants would be fetched separately if needed

    // Client-side filtering for colors and sizes (until backend supports variant filtering)
    if (selectedColors.length > 0) {
      mapped = mapped.filter(
        (p) => p.colors && p.colors.some((c) => selectedColors.includes(c)),
      );
    }

    if (selectedSizes.length > 0) {
      mapped = mapped.filter(
        (p) => p.sizes && p.sizes.some((s) => selectedSizes.includes(s)),
      );
    }

    return mapped;
  }, [backendProducts, selectedColors, selectedSizes]);

  const paginatedProducts = displayedProducts;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedCollections([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, 5000]);
  };

  const toggleFilter = (
    item: string,
    current: string[],
    set: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    if (current.includes(item)) {
      set(current.filter((i) => i !== item));
    } else {
      set([...current, item]);
    }
  };

  return (
    <div className="bg-white min-h-screen animate-[fade-in_0.5s_ease-out]">
      <SEO
        title={
          searchQuery
            ? `Search Results for "${searchQuery}"`
            : initialCategoryId
              ? "Collection"
              : "Shop All Products"
        }
        description={
          searchQuery
            ? `Search results for ${searchQuery}`
            : "Browse our complete collection of premium quality apparel"
        }
        type="website"
      />
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      <div className="bg-primary text-white py-8 md:py-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight px-4">
          {searchQuery
            ? `Results for "${searchQuery}"`
            : collection
              ? collection.name
              : initialCategoryId
                ? "Collection"
                : "Shop All"}
        </h1>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="font-bold text-lg">Filters</h2>
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-500 hover:text-primary underline"
                >
                  Clear All
                </button>
              </div>
              <ShopFilters
                products={displayedProducts}
                selectedCategories={selectedCategories}
                selectedCollections={selectedCollections}
                selectedColors={selectedColors}
                selectedSizes={selectedSizes}
                priceRange={priceRange}
                setSelectedCategories={setSelectedCategories}
                setSelectedCollections={setSelectedCollections}
                setSelectedColors={setSelectedColors}
                setSelectedSizes={setSelectedSizes}
                setPriceRange={setPriceRange}
              />
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 sticky top-16 bg-white/95 backdrop-blur z-30 lg:static lg:bg-transparent">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-bold uppercase border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50"
              >
                <span className="material-icons text-sm">tune</span>
                Filters
                {selectedCategories.length +
                  selectedCollections.length +
                  selectedColors.length +
                  selectedSizes.length >
                  0 && (
                  <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    {selectedCategories.length +
                      selectedCollections.length +
                      selectedColors.length +
                      selectedSizes.length}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <label
                  htmlFor="sort"
                  className="hidden sm:block text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Sort By:
                </label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="text-sm font-bold border-none focus:ring-0 cursor-pointer bg-transparent text-right hover:text-primary transition-colors"
                >
                  <option>Best Sellers</option>
                  <option>Newest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>

            {(selectedCategories.length > 0 ||
              selectedCollections.length > 0 ||
              selectedColors.length > 0 ||
              selectedSizes.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCollections.map((collectionId) => {
                  const collection = allCollections.find(
                    (c) => c.id === collectionId,
                  );
                  return (
                    <button
                      key={collectionId}
                      onClick={() =>
                        toggleFilter(
                          collectionId,
                          selectedCollections,
                          setSelectedCollections,
                        )
                      }
                      className="flex items-center gap-1 bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      {collection?.name || collectionId}{" "}
                      <span className="material-icons text-[10px]">close</span>
                    </button>
                  );
                })}
                {selectedCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      toggleFilter(
                        cat,
                        selectedCategories,
                        setSelectedCategories,
                      )
                    }
                    className="flex items-center gap-1 bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    {cat}{" "}
                    <span className="material-icons text-[10px]">close</span>
                  </button>
                ))}
                {selectedColors.map((col) => (
                  <button
                    key={col}
                    onClick={() =>
                      toggleFilter(col, selectedColors, setSelectedColors)
                    }
                    className="flex items-center gap-1 bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    {col}{" "}
                    <span className="material-icons text-[10px]">close</span>
                  </button>
                ))}
                {selectedSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      toggleFilter(size, selectedSizes, setSelectedSizes)
                    }
                    className="flex items-center gap-1 bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    {size}{" "}
                    <span className="material-icons text-[10px]">close</span>
                  </button>
                ))}
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-500 underline ml-2 hover:text-primary"
                >
                  Clear All
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : productsError ? (
              <div className="col-span-full text-center py-12">
                <p className="text-red-600 mb-4">
                  Error loading products:{" "}
                  {productsError instanceof Error
                    ? productsError.message
                    : "Unknown error"}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-white rounded"
                >
                  Retry
                </button>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-x-8 md:gap-y-12">
                {paginatedProducts.map((product, idx) => (
                  <div key={product.id} className="group relative">
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="w-full overflow-hidden rounded-lg bg-white mb-4 shadow-sm group-hover:shadow-md transition-shadow relative aspect-[9/16]">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">
                              No Image
                            </span>
                          </div>
                        )}
                        {product.colors && product.colors.length > 1 && (
                          <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                            {product.colors.slice(0, 3).map((c, i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-black/20 backdrop-blur-sm"
                              ></div>
                            ))}
                            {product.colors.length > 3 && (
                              <span className="text-[8px] text-gray-600">
                                +
                              </span>
                            )}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {idx % 7 === 0 && (
                            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                              SALE
                            </div>
                          )}
                          {idx % 11 === 0 && (
                            <div className="bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                              FEW LEFT
                            </div>
                          )}
                        </div>

                        <div className="absolute inset-0 flex items-end justify-center pb-4 transition-opacity duration-300 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 pointer-events-none">
                          <div className="flex gap-2 pointer-events-auto transform translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 transition-transform duration-300">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setQuickViewProduct(product);
                              }}
                              className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-black shadow-lg hover:bg-primary hover:text-white transition-colors tooltip-trigger"
                              title="Quick View"
                            >
                              <span className="material-icons text-xs md:text-sm">
                                visibility
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setQuickViewProduct(product);
                              }}
                              className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-black shadow-lg hover:bg-primary hover:text-white transition-colors"
                              title="Add to Cart"
                            >
                              <span className="material-icons text-xs md:text-sm">
                                shopping_cart
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <div className="flex text-accent text-xs">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`material-symbols-outlined text-[16px] ${i < Math.floor(product.rating) ? "filled" : ""}`}
                            >
                              star
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          ({product.reviews})
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <span className="material-icons text-4xl text-gray-300 mb-2">
                  search_off
                </span>
                <p className="text-lg font-bold">No products found</p>
                <p className="text-gray-500 text-sm mb-4">
                  Try adjusting your filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="text-primary underline font-bold"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-16 flex justify-center border-t border-gray-200 pt-8">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent text-sm font-medium rounded transition-colors"
                  >
                    Prev
                  </button>

                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                            currentPage === pageNum
                              ? "bg-primary text-white hover:opacity-90"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent text-sm font-medium rounded transition-colors"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[60] lg:hidden ${showMobileFilters ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${showMobileFilters ? "opacity-100" : "opacity-0"}`}
          onClick={() => setShowMobileFilters(false)}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto transition-transform duration-300 transform ${showMobileFilters ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <ShopFilters
              products={displayedProducts}
              selectedCategories={selectedCategories}
              selectedCollections={selectedCollections}
              selectedColors={selectedColors}
              selectedSizes={selectedSizes}
              priceRange={priceRange}
              setSelectedCategories={setSelectedCategories}
              setSelectedCollections={setSelectedCollections}
              setSelectedColors={setSelectedColors}
              setSelectedSizes={setSelectedSizes}
              setPriceRange={setPriceRange}
            />
            <div className="mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold uppercase tracking-wide"
              >
                Show {paginatedProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
