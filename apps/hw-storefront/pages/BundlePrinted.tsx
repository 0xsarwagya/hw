import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImageSlider from "../components/ImageSlider";
import LoadingSpinner from "../components/LoadingSpinner";
import { useShop } from "../context/ShopContext";
import { useBundleBySlug } from "../hooks/useBundles";
import { useAvailableVariants } from "../hooks/useVariants";
import { Product } from "../types";
import { formatCurrency } from "../utils";
import { findVariantBySizeColor } from "../utils/variant-helpers";

interface Selection {
  color: string;
  size: string;
}

interface BundlePrintedProps {
  slug?: string;
}

const BundlePrinted: React.FC<BundlePrintedProps> = ({ slug }) => {
  const { bundleSize } = useParams();
  const navigate = useNavigate();
  const { addToCart, openCart } = useShop();
  const { data: variantsData, isLoading: variantsLoading } =
    useAvailableVariants();

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

  const [isAdding, setIsAdding] = useState(false);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [expandedDropdown, setExpandedDropdown] = useState<number | null>(null);

  // Default to 3 for this specific view based on reference image preference
  const activeCount = bundleSize ? parseInt(bundleSize) : 3;
  // Hardcoded bundle config - could be replaced with backend bundle data
  const activeBundle = {
    count: activeCount,
    price: 0,
    originalPrice: 0,
    savings: "0%",
  };

  // Initialize Selections with defaults
  useEffect(() => {
    if (availableColors.length === 0 || availableSizes.length === 0) return; // Wait for variants

    setSelections((prev) => {
      // If resizing, keep existing selections or fill with defaults
      const defaultColor = availableColors[0] || "Black";
      const defaultSize =
        availableSizes.find((s) => s === "M") || availableSizes[0] || "M";
      const newSelections = Array.from({ length: activeCount }).map((_, i) => {
        // Check if we have a previous selection for this index, otherwise use defaults
        return prev[i] || { color: defaultColor, size: defaultSize };
      });
      return newSelections;
    });
  }, [activeCount, availableColors, availableSizes]);

  const updateSelection = (
    index: number,
    field: keyof Selection,
    value: string,
  ) => {
    const newSelections = [...selections];
    newSelections[index] = { ...newSelections[index], [field]: value };
    setSelections(newSelections);
    if (field === "color") {
      setExpandedDropdown(null);
    }
  };

  const handleAddBundleToCart = async () => {
    setIsAdding(true);

    try {
      // Find variants for each selection and add to cart
      for (const sel of selections) {
        // Find variant matching color and size
        const variant = findVariantBySizeColor(
          allVariants,
          sel.size,
          sel.color,
        );

        if (!variant) {
          console.warn(
            `Variant not found for ${sel.color} ${sel.size}, skipping...`,
          );
          continue;
        }

        // Create a minimal product object for addToCart compatibility
        const bundleProduct: Product = {
          id: variant.productId,
          name: `Bundle Item - ${sel.color}`,
          price: variant.price,
          image: "",
          category: "",
          rating: 0,
          reviews: 0,
          selectedColor: sel.color,
        };

        await addToCart(bundleProduct, sel.size, 1, variant.id);
      }
      openCart();
    } catch (error) {
      console.error("Failed to add bundle to cart:", error);
      alert("Failed to add bundle to cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => setExpandedDropdown(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Construct gallery images for slider - use placeholder images
  const galleryImages = selections.map((sel) => {
    return `https://via.placeholder.com/500?text=${encodeURIComponent(sel.color || "Bundle")}`;
  });

  if (
    variantsLoading ||
    availableColors.length === 0 ||
    availableSizes.length === 0
  ) {
    return (
      <div className="bg-white min-h-screen pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen animate-[fade-in_0.5s_ease-out] pb-20">
      <SEO
        title="Printed Pack Bundle"
        description="Create your perfect printed pack bundle. Select sizes and colors to build your custom pack."
      />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Left Column: Visuals (5 cols width - slightly narrower than half) */}
          <div className="lg:col-span-5 relative">
            <div className="lg:sticky lg:top-24">
              <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8 leading-none">
                Pack of {activeCount}
                <br />
                Regular Fit Tshirts
              </h1>

              {/* Image Slider */}
              <div className="mb-8">
                <ImageSlider
                  images={galleryImages}
                  aspectRatio="aspect-[4/5]"
                  className="shadow-sm rounded-xl"
                />
              </div>

              {/* Available Colors Palette */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Available Colors
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((colorName) => {
                      const colorHex = colorName.toLowerCase().includes("black")
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
                                : colorName.toLowerCase().includes("green")
                                  ? "#008000"
                                  : "#ccc";
                      return (
                        <div
                          key={colorName}
                          className="w-6 h-6 rounded-full border border-gray-200 shadow-sm cursor-help hover:scale-110 transition-transform"
                          style={{ backgroundColor: colorHex }}
                          title={colorName}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Builder (7 cols width - wider area for controls) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-white p-0 md:p-2 h-full flex flex-col relative">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-icons text-orange-500">
                  inventory_2
                </span>
                <h2 className="text-xl font-bold">
                  Build Your Custom Pack Bundle
                </h2>
              </div>

              {/* Pack Size Tabs */}
              <div className="mb-8">
                <p className="text-xs text-gray-500 font-bold mb-2">Pick Any</p>
                <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-lg overflow-x-auto">
                  {[3, 4, 5, 7, 9].map((count) => (
                    <button
                      key={count}
                      onClick={() => navigate(`/bundle-printed/${count}`)}
                      className={`flex-1 min-w-[60px] py-2 text-sm font-bold rounded-md transition-all ${
                        activeCount === count
                          ? "bg-blue-100 text-primary shadow-sm"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Selectors List */}
              <div className="space-y-4 flex-grow mb-20">
                {selections.map((sel, idx) => {
                  const colorHex = sel.color?.toLowerCase().includes("black")
                    ? "#000"
                    : sel.color?.toLowerCase().includes("white")
                      ? "#fff"
                      : sel.color?.toLowerCase().includes("gray") ||
                          sel.color?.toLowerCase().includes("grey")
                        ? "#808080"
                        : sel.color?.toLowerCase().includes("red")
                          ? "#ff0000"
                          : sel.color?.toLowerCase().includes("blue")
                            ? "#0000ff"
                            : sel.color?.toLowerCase().includes("green")
                              ? "#008000"
                              : "#ccc";
                  return (
                    <div
                      key={idx}
                      className="border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow bg-white animate-[slide-up_0.3s_ease-out]"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* New Header: #Number + Image + Label */}
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-50">
                        <span className="text-3xl font-bold text-gray-200">
                          #{idx + 1}
                        </span>
                        <div className="w-12 h-16 bg-gray-100 rounded-md overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: colorHex }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                            Customise Item
                          </p>
                          <h3 className="font-bold text-sm">
                            Select Size & Color
                          </h3>
                        </div>
                      </div>

                      {/* Size Selector */}
                      {availableSizes.length > 0 && (
                        <div className="mb-6">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                            Select Size
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {availableSizes.map((s) => (
                              <button
                                key={s}
                                onClick={() => updateSelection(idx, "size", s)}
                                className={`w-10 h-10 rounded-full text-xs font-bold transition-all flex items-center justify-center border ${
                                  sel.size === s
                                    ? "bg-primary text-white border-primary shadow-md transform scale-105"
                                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Dropdown */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                          Select Color
                        </label>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDropdown(
                              expandedDropdown === idx ? null : idx,
                            );
                          }}
                          className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-400 transition-colors bg-white group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                              style={{ backgroundColor: colorHex }}
                            />
                            <span className="font-medium text-sm text-gray-700 group-hover:text-black">
                              {sel.color}
                            </span>
                          </div>
                          <span
                            className={`material-icons text-gray-400 transition-transform duration-300 ${expandedDropdown === idx ? "rotate-180" : ""}`}
                          >
                            expand_more
                          </span>
                        </button>

                        {/* Dropdown Menu */}
                        {expandedDropdown === idx &&
                          availableColors.length > 0 && (
                            <div
                              className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto p-2 grid grid-cols-1 gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {availableColors.map((colorName) => {
                                const colorHex = colorName
                                  .toLowerCase()
                                  .includes("black")
                                  ? "#000"
                                  : colorName.toLowerCase().includes("white")
                                    ? "#fff"
                                    : colorName
                                          .toLowerCase()
                                          .includes("gray") ||
                                        colorName.toLowerCase().includes("grey")
                                      ? "#808080"
                                      : colorName.toLowerCase().includes("red")
                                        ? "#ff0000"
                                        : colorName
                                              .toLowerCase()
                                              .includes("blue")
                                          ? "#0000ff"
                                          : colorName
                                                .toLowerCase()
                                                .includes("green")
                                            ? "#008000"
                                            : "#ccc";
                                return (
                                  <button
                                    key={colorName}
                                    onClick={() =>
                                      updateSelection(idx, "color", colorName)
                                    }
                                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors ${
                                      sel.color === colorName
                                        ? "bg-gray-100 font-bold text-black"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                                    }`}
                                  >
                                    <div
                                      className="w-5 h-5 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                                      style={{ backgroundColor: colorHex }}
                                    />
                                    <span className="text-sm">{colorName}</span>
                                    {sel.color === colorName && (
                                      <span className="material-icons text-primary text-sm ml-auto">
                                        check
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floating Cart Button (Fixed at bottom right relative to screen) */}
              <div className="fixed bottom-8 right-8 z-[60]">
                <button
                  onClick={handleAddBundleToCart}
                  disabled={isAdding}
                  className="w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-wait relative group"
                >
                  <span className="material-icons">
                    {isAdding ? "hourglass_empty" : "shopping_bag"}
                  </span>
                  {/* Tooltip price */}
                  <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-black px-4 py-2 rounded-lg shadow-xl border border-gray-100 font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none origin-right transform scale-95 group-hover:scale-100">
                    Add {activeCount} for {formatCurrency(activeBundle.price)}
                    <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white transform rotate-45 -translate-y-1/2 border-t border-r border-gray-100"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundlePrinted;
