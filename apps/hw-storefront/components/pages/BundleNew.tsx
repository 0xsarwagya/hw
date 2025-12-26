"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import ImageSlider from "../../components/ImageSlider";
import InfoModal from "../../components/InfoModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { SEO } from "../../components/SEO";
import { useShop } from "../../context/ShopContext";
import { useProducts } from "../../hooks/useApi";
import { useBundleBySlug, useBundles } from "../../hooks/useBundles";
import { useAvailableVariants } from "../../hooks/useVariants";
import { Product } from "../../types";
import { formatCurrency } from "../../utils";
import { getColorHexWithFallback } from "../../utils/color-map";
import { findVariantBySizeColor } from "../../utils/variant-helpers";

interface BundleNewProps {
  slug?: string;
}

const BundleNew: React.FC<BundleNewProps> = ({ slug }) => {
  const params = useParams();
  const bundleSize = params?.bundleSize as string | undefined;
  const router = useRouter();
  const { addToCart, openCart } = useShop();
  const { data: variantsData, isLoading: variantsLoading } =
    useAvailableVariants();
  const { data: bundlesData, isLoading: bundlesLoading } = useBundles(1, 50); // Fetch more bundles
  const { data: productsData } = useProducts({ limit: 100 }); // Fetch products to match

  // If slug provided, find bundle by slug
  const { data: bundleBySlug } = useBundleBySlug(slug || "");

  // Extract available colors and sizes from variants
  const availableColors = useMemo(
    () => variantsData?.colors || [],
    [variantsData],
  );
  const availableSizes = useMemo(
    () => variantsData?.sizes || [],
    [variantsData],
  );
  const allVariants = useMemo(
    () => variantsData?.variants || [],
    [variantsData],
  );

  // Extract pack sizes from bundles that contain the same product
  // Group bundles by the product they contain (using first variant's productId from first set)
  const bundlesByProduct = useMemo(() => {
    if (!bundlesData?.data || !allVariants.length) {
      return new Map<
        string,
        Array<NonNullable<typeof bundlesData>["data"][0]>
      >();
    }

    const productMap = new Map<string, Array<(typeof bundlesData.data)[0]>>();

    bundlesData.data.forEach((bundle) => {
      // Get all variant IDs from bundle sets
      const variantIds = new Set<string>();
      bundle.sets.forEach((set) => {
        set.items.forEach((item) => {
          variantIds.add(item.variantId);
        });
      });

      // Find the product ID from the first variant
      const firstVariantId = Array.from(variantIds)[0];
      if (firstVariantId) {
        const variant = allVariants.find((v) => v.id === firstVariantId);
        if (variant) {
          const productId = variant.productId;
          if (!productMap.has(productId)) {
            productMap.set(productId, []);
          }
          productMap.get(productId)!.push(bundle);
        }
      }
    });

    return productMap;
  }, [bundlesData?.data, allVariants]);

  // Get bundles for the current product (use first product's bundles as default, or match by title)
  // For "Solid Pack", we'll use bundles that match the pattern
  const relevantBundles = useMemo(() => {
    if (!bundlesData?.data) return [];

    // Filter bundles that are active and match "Solid Pack" or similar pattern
    // Also extract pack size from bundle title or sum of maxQuantity
    return bundlesData.data
      .filter((bundle) => bundle.isActive)
      .map((bundle) => {
        // Extract pack size from title (e.g., "3 Pack", "4 Pack") or sum maxQuantity
        const titleMatch = bundle.title.match(/(\d+)\s*pack/i);
        const packSize =
          titleMatch && titleMatch[1]
            ? parseInt(titleMatch[1], 10)
            : bundle.sets.reduce((sum, set) => sum + set.maxQuantity, 0);

        return {
          ...bundle,
          packSize,
        };
      })
      .filter((b) => b.packSize > 0)
      .sort((a, b) => a.packSize - b.packSize);
  }, [bundlesData?.data]);

  // Create pack size options from relevant bundles
  const packSizeOptions = useMemo(() => {
    return relevantBundles.map((bundle) => ({
      count: bundle.packSize,
      bundleId: bundle.id,
      bundle: bundle,
    }));
  }, [relevantBundles]);

  // State
  const activeCount = bundleSize
    ? parseInt(bundleSize)
    : packSizeOptions[0]?.count || 4;
  const activeBundleOption =
    packSizeOptions.find((b) => b.count === activeCount) || packSizeOptions[0];
  const activeBundle = activeBundleOption?.bundle;

  // Update URL if bundleSize param doesn't match any available pack size
  useEffect(() => {
    if (bundleSize && packSizeOptions.length > 0) {
      const parsedSize = parseInt(bundleSize);
      const exists = packSizeOptions.some((opt) => opt.count === parsedSize);
      if (!exists && packSizeOptions[0]) {
        router.replace(`/bundle-new/${packSizeOptions[0].count}`);
      }
    }
  }, [bundleSize, packSizeOptions, router]);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [activeColorPickerIndex, setActiveColorPickerIndex] = useState<
    number | null
  >(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Initialize/Reset colors when count changes
  useEffect(() => {
    if (availableColors.length === 0) return; // Wait for variants

    setSelectedColors((prev) => {
      const newColors = [...prev];
      // Adjust length
      if (newColors.length < activeCount) {
        // Fill missing with empty string (indicating "Pick Any")
        return [
          ...newColors,
          ...Array(activeCount - newColors.length).fill(""),
        ];
      } else {
        return newColors.slice(0, activeCount);
      }
    });

    // Set default size from available sizes
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      const defaultSize =
        availableSizes.find((s) => s === "M") || availableSizes[0];
      if (defaultSize) {
        setSelectedSize(defaultSize);
      }
    }
  }, [activeCount, availableColors, availableSizes, selectedSize]);

  const handleColorSelect = (index: number, colorName: string) => {
    const newColors = [...selectedColors];
    newColors[index] = colorName;
    setSelectedColors(newColors);
    setActiveColorPickerIndex(null); // Close picker
  };

  const handleAddToCart = async () => {
    // Validate all colors picked? Or assume defaults?
    // Let's enforce picking.
    if (selectedColors.some((c) => !c)) {
      alert("Please select a color for all items in the pack.");
      return;
    }

    setIsAdding(true);

    try {
      // Find variants for each color and add to cart
      for (const colorName of selectedColors) {
        if (!colorName) continue;

        // Find variant matching color and size
        const variant = findVariantBySizeColor(
          allVariants,
          selectedSize,
          colorName,
        );

        if (!variant) {
          console.warn(
            `Variant not found for ${colorName} ${selectedSize}, skipping...`,
          );
          continue;
        }

        // Create a minimal Product object with required fields
        const bundleProduct: Product = {
          // Backend Product fields (required)
          id: variant.productId,
          description: null,
          price: variant.price,
          gstRate: 0,
          pricingType: "exclusive" as const,
          gstAmount: 0,
          priceExcludingGst: variant.price,
          priceIncludingGst: variant.price,
          hsnCode: null,
          status: "active" as const,
          categoryId: null,
          images: null,
          pricelistPrices: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          // UI-specific fields
          name: `Solid Pack Item - ${colorName}`,
          image: "",
          category: "",
          rating: 0,
          reviews: 0,
          selectedColor: colorName,
        } as Product;

        await addToCart(bundleProduct, selectedSize, 1, variant.id);
      }
      openCart();
    } catch (error) {
      console.error("Failed to add bundle to cart:", error);
      alert("Failed to add bundle to cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Determine which images to show in slider based on the first selected color
  const firstColor = selectedColors[0];
  // Use placeholder images - in production, these would come from product images
  const defaultImg = `https://via.placeholder.com/500?text=${encodeURIComponent(firstColor || "Bundle")}`;
  const galleryImages = [defaultImg, defaultImg, defaultImg, defaultImg];

  if (variantsLoading || bundlesLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // If no pack size options available, show message
  if (packSizeOptions.length === 0) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            No bundles available for this product.
          </p>
          <button
            onClick={() => router.push("/shop")}
            className="bg-primary text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 font-sans animate-[fade-in_0.5s_ease-out]">
      <SEO
        title={activeBundle?.title || `Solid Pack Bundle`}
        description={
          activeBundle?.description ||
          "Create your perfect solid pack bundle. Select sizes and colors to build your custom pack."
        }
      />
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        defaultTab="size"
      />

      {/* Breadcrumb */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          Home &gt; Bundles &gt; Solid Pack of {activeCount}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Image Slider */}
        <div className="lg:sticky lg:top-24 self-start">
          <ImageSlider
            images={galleryImages}
            aspectRatio="9:16"
            className="shadow-sm max-w-lg mx-auto"
          />
        </div>

        {/* Right: Details & Config */}
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight mb-2">
            {activeBundle?.title || `Solid Pack of ${activeCount}`}
          </h1>
          {activeBundle?.description && (
            <p className="text-sm text-gray-600 mb-2">
              {activeBundle.description}
            </p>
          )}
          {/* Price would come from bundle pricing - for now show placeholder */}
          <div className="flex items-end gap-3 mb-2">
            <span className="text-3xl font-bold">
              {activeBundle ? "Price from bundle" : formatCurrency(0)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">inclusive of all taxes</p>

          <div className="flex text-accent text-sm mb-6">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="material-icons">
                star
              </span>
            ))}
            <span className="text-gray-400 ml-2">(128 Reviews)</span>
          </div>

          <div className="border-t border-b border-gray-100 py-6 mb-6">
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-2 text-sm font-bold underline hover:text-primary transition-colors"
            >
              <span className="material-icons text-base">straighten</span> Size
              Chart, Shipping & Washing Instruction
            </button>
          </div>

          {/* Pack Size Selection */}
          {packSizeOptions.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-bold mb-3">Pack Size</p>
              <div className="flex flex-wrap gap-3">
                {packSizeOptions.map((option) => (
                  <button
                    key={option.count}
                    onClick={() => router.push(`/bundle-new/${option.count}`)}
                    className={`w-12 h-12 flex items-center justify-center rounded border font-bold transition-all ${
                      activeCount === option.count
                        ? "bg-black text-white border-black shadow-lg"
                        : "bg-white text-gray-700 border-gray-300 hover:border-black"
                    }`}
                  >
                    {option.count}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {availableSizes.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-bold mb-3">Size</p>
              <div className="flex flex-wrap gap-3">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 flex items-center justify-center rounded border font-bold transition-all ${
                      selectedSize === size
                        ? "bg-black text-white border-black shadow-lg"
                        : "bg-white text-gray-700 border-gray-300 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Slots Grid */}
          <div className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: activeCount }).map((_, idx) => {
                const colorName = selectedColors[idx];

                return (
                  <div key={idx} className="relative">
                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase">
                      Color {idx + 1}
                    </p>
                    <button
                      onClick={() =>
                        setActiveColorPickerIndex(
                          idx === activeColorPickerIndex ? null : idx,
                        )
                      }
                      className={`w-full h-12 border rounded px-3 flex items-center justify-between bg-white hover:border-black transition-colors ${activeColorPickerIndex === idx ? "border-black ring-1 ring-black" : "border-gray-300"}`}
                    >
                      {colorName ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border-gray-200"
                            style={{
                              backgroundColor: colorName
                                .toLowerCase()
                                .includes("black")
                                ? "#000"
                                : colorName.toLowerCase().includes("white")
                                  ? "#fff"
                                  : colorName.toLowerCase().includes("gray") ||
                                      colorName.toLowerCase().includes("grey")
                                    ? "#808080"
                                    : colorName.toLowerCase().includes("red")
                                      ? "#ff0000"
                                      : colorName.toLowerCase().includes("blue")
                                        ? "#0000ff"
                                        : colorName
                                              .toLowerCase()
                                              .includes("green")
                                          ? "#008000"
                                          : "#ccc",
                            }}
                          ></div>
                          <span className="text-xs font-bold truncate">
                            {colorName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">
                          PICK ANY
                        </span>
                      )}
                      <span className="material-icons text-sm text-gray-400">
                        expand_more
                      </span>
                    </button>

                    {/* Dropdown Color Picker */}
                    {activeColorPickerIndex === idx &&
                      availableColors.length > 0 && (
                        <div className="absolute top-full left-0 z-20 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg p-3 max-h-60 overflow-y-auto animate-[fade-in_0.2s_ease-out]">
                          <div className="grid grid-cols-4 gap-2">
                            {availableColors.map((colorName) => {
                              // Use color map for proper hex values
                              const colorHex = getColorHexWithFallback(colorName);
                              return (
                                <button
                                  key={colorName}
                                  onClick={() =>
                                    handleColorSelect(idx, colorName)
                                  }
                                  className="aspect-square rounded-full border border-gray-200 hover:scale-110 transition-transform relative group"
                                  style={{ backgroundColor: colorHex }}
                                  title={colorName}
                                >
                                  {selectedColors[idx] === colorName && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                      <span className="material-icons text-white text-xs drop-shadow-md">
                                        check
                                      </span>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add To Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full bg-primary text-white text-lg font-bold py-4 rounded-full uppercase tracking-widest hover:bg-black transition-colors shadow-xl disabled:opacity-75 disabled:cursor-wait"
          >
            {isAdding ? "Adding Bundle..." : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Overlay to close picker if clicked outside */}
      {activeColorPickerIndex !== null && (
        <div
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setActiveColorPickerIndex(null)}
        ></div>
      )}
    </div>
  );
};

export default BundleNew;
