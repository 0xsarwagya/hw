import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImageSlider from "../components/ImageSlider";
import LoadingSpinner from "../components/LoadingSpinner";
import { useShop } from "../context/ShopContext";
import { useBundle, useBundleBySlug, useBundles } from "../hooks/useBundles";
import { useAvailableVariants } from "../hooks/useVariants";
import { Product } from "../types";
import { formatCurrency } from "../utils";
import { findVariantBySizeColor } from "../utils/variant-helpers";

interface Selection {
  color: string;
  size: string;
}

interface BundleProps {
  bundleId?: string;
  slug?: string;
}

const Bundle: React.FC<BundleProps> = ({ bundleId, slug }) => {
  const { bundleSize } = useParams();
  const navigate = useNavigate();
  const { addToCart, openCart } = useShop();
  const { data: bundlesData, isLoading: bundlesLoading } = useBundles(1, 20);
  const bundles = bundlesData?.data || [];

  // If slug provided, find bundle by slug
  const { data: bundleBySlug, isLoading: slugLoading } = useBundleBySlug(
    slug || "",
  );
  const resolvedBundleId = bundleId || bundleBySlug?.id;

  // If bundleId provided, fetch that specific bundle
  const { data: specificBundle, isLoading: specificLoading } = useBundle(
    resolvedBundleId || "",
  );
  const currentBundle = resolvedBundleId ? specificBundle : null;

  const { data: variantsData, isLoading: variantsLoading } =
    useAvailableVariants();

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

  // If no bundleSize param and no bundleId/slug, show the landing page selection
  const isLanding = !bundleSize && !resolvedBundleId && !slug;

  // Determine active count from bundle or param
  const activeCount = useMemo(() => {
    if (currentBundle) {
      return currentBundle.sets.reduce((sum, set) => sum + set.maxQuantity, 0);
    }
    return bundleSize ? parseInt(bundleSize) : 4;
  }, [currentBundle, bundleSize]);

  const [isAdding, setIsAdding] = useState(false);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [activeItem, setActiveItem] = useState(0);

  const activeBundle = currentBundle
    ? {
        count: activeCount,
        price: 0, // Would come from bundle pricing
        originalPrice: 0,
        savings: "0%",
        title: currentBundle.title,
        description: currentBundle.description,
      }
    : { count: activeCount, price: 0, originalPrice: 0, savings: "0%" };

  useEffect(() => {
    if (isLanding) return;

    if (availableColors.length === 0 || availableSizes.length === 0) return; // Wait for variants to load

    setSelections((prev) => {
      // If length matches, do nothing to prevent unnecessary renders
      if (prev.length === activeCount) return prev;

      if (prev.length < activeCount) {
        // Fill missing with defaults
        const needed = activeCount - prev.length;
        const defaultColor = availableColors[0] || "Black";
        const defaultSize =
          availableSizes.find((s) => s === "M") || availableSizes[0] || "M";
        const extras = Array.from({ length: needed }, () => ({
          color: defaultColor,
          size: defaultSize,
        }));
        return [...prev, ...extras];
      } else {
        // Truncate if reducing size
        return prev.slice(0, activeCount);
      }
    });
    // Reset active item to 0 when bundle size changes
    setActiveItem(0);
  }, [activeCount, isLanding, availableColors, availableSizes]);

  const updateSelection = (
    index: number,
    field: keyof Selection,
    value: string,
  ) => {
    const newSelections = [...selections];
    newSelections[index] = { ...newSelections[index], [field]: value };
    setSelections(newSelections);
    setActiveItem(index);
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
      openCart(); // Open cart after adding all items
    } catch (error) {
      console.error("Failed to add bundle to cart:", error);
      alert("Failed to add bundle to cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  if (isLanding) {
    if (bundlesLoading || slugLoading || specificLoading) {
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
          description="Create your perfect bundle and save up to 45%. Mix and match sizes and colors to build your custom pack."
        />
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">
            Value Bundles
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Save up to 45% with our curated multi-packs. Choose how you want to
            build your collection.
          </p>
        </div>

        {/* Display bundles from backend if available */}
        {bundles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 max-w-7xl mx-auto">
            {bundles.slice(0, 6).map((bundle) => (
              <Link
                key={bundle.id}
                to={`/bundle/${bundle.id}`}
                className="group relative rounded-2xl overflow-hidden bg-gray-100 h-[450px] flex flex-col shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/40"
              >
                <div className="h-1/2 overflow-hidden relative">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-400 uppercase">
                      {bundle.title.charAt(0)}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    {bundle.sets.length} Sets
                  </div>
                </div>
                <div className="h-1/2 p-8 flex flex-col justify-center bg-white">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Bundle
                  </span>
                  <h3 className="text-2xl font-bold uppercase leading-tight mb-3 group-hover:text-primary transition-colors">
                    {bundle.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed flex-grow line-clamp-2">
                    {bundle.description || "Customize your bundle"}
                  </p>
                  <span className="text-primary font-bold uppercase text-sm tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                    Build Your Pack{" "}
                    <span className="material-icons text-sm">
                      arrow_forward
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Option 1: Classic Custom Builder */}
          <Link
            to="/bundle/4"
            className="group relative rounded-2xl overflow-hidden bg-gray-100 h-[450px] flex flex-col shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-primary/40"
          >
            <div className="h-1/2 overflow-hidden relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3AEFotmLVaCeKFiroqO3nR0fg1kEAQ063Xq7viRYnc6syGuyLplPQBfxzSLiKTiZG06eoEtFMOocr4GD3W1523tuhUeUqUuN34ygdZvc7itoyxgU8w5tBItnw0qeVF8n4tXpcgJWw5e_xgGI9kZGv-uDHYBXVmgVr7Bpxf-DHtrKm6mdHmg4Mv0qIV9VsF_z0EU3AijbtkpQyuHw8Js9ZzyyibAwe5pWSfNaPxaSWdIq1B748PCwg1ArGi59FrGKXKlICqlSNr61B"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt="Mix & Match"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Best for Variety
              </div>
            </div>
            <div className="h-1/2 p-8 flex flex-col justify-center bg-white">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Option 1
              </span>
              <h3 className="text-2xl font-bold uppercase leading-tight mb-3 group-hover:text-primary transition-colors">
                Custom Pack Builder
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                Mix and match different sizes and colors in a single pack. Total
                freedom to customize.
              </p>
              <span className="text-primary font-bold uppercase text-sm tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                Build Your Pack{" "}
                <span className="material-icons text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>

          {/* Option 2: New Solid Pack UI */}
          <Link
            to="/bundle-new/4"
            className="group relative rounded-2xl overflow-hidden bg-gray-900 text-white h-[450px] flex flex-col shadow-sm hover:shadow-2xl transition-all duration-300"
          >
            <div className="h-1/2 overflow-hidden relative order-1">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB4PwueFyx_SM4ZjCWoo7-L8UznMDSkO8cfhSUCtoB2jDhdOPpVnFVUBZWsZklLQHwmi7UOza52s6e6kuSzAvr0vte2K-edCha53sHE6y1eVI0dbKwKj89t2OB6io_e84qWu3Tcy-GLPN__lWhNuytgtkFN_VkXopjH__TUomHMIi9mftFGH1ImQgEyDBtEXwv3I-1h17M5CMM1pyWnsvQGWNR3MSQRBLtfaE1mscMvnsdKApLb90ukV1MwMW9zL5CpEvo_7x9fkrj"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                alt="Solid Packs"
              />
              <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Best Value
              </div>
            </div>
            <div className="h-1/2 p-8 flex flex-col justify-center bg-gray-900 order-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">
                Option 2
              </span>
              <h3 className="text-2xl font-bold uppercase leading-tight mb-3 group-hover:text-primary transition-colors relative z-10">
                Solid Pack Bundle
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed flex-grow relative z-10">
                Quickly select a size and pick your favorite colors for the
                whole pack.
              </p>
              <span className="text-white font-bold uppercase text-sm tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all relative z-10">
                Shop Packs{" "}
                <span className="material-icons text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>

          {/* Option 3: Visual Vertical Builder */}
          <Link
            to="/bundle-printed/4"
            className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 h-[450px] flex flex-col shadow-sm hover:shadow-2xl transition-all duration-300"
          >
            <div className="h-1/2 overflow-hidden relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2wEOkzRKOSQCVmqyRV_fsDmM8EmMOByLrZE5Rz1zF9PBfupEvHkogfAB3Ez0Je3PjnAe1MRRdCdcYxYR_TNuZI4TRcb1W-BHWWMJr-i49wdylbwBsNUJXahyRcVAIdac6BS-CVqiyiRMVOrMxi0IMC-Mo6ghKAVezcZ4oUY4OAZ5sFlvh3OL4sHHUhJK4TDGu-fy6DmW8DmOtKshhS3TzDO90CZy0LOq7AK2JNU33jp1AfJwcZTpUzJy4gJ0b5nL16C8YQshCL4Kr"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt="Visual Builder"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
              <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Vertical View
              </div>
            </div>
            <div className="h-1/2 p-8 flex flex-col justify-center bg-gray-50/50">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Option 3
              </span>
              <h3 className="text-2xl font-bold uppercase leading-tight mb-3 group-hover:text-primary transition-colors">
                Visual Pack Builder
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                Vertical scrolling layout. Configure your plain tee pack item by
                item.
              </p>
              <span className="text-black font-bold uppercase text-sm tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                Build Pack{" "}
                <span className="material-icons text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Identify current active color - use placeholder images for now
  const activeColorName =
    selections[activeItem]?.color || availableColors[0] || "Black";
  // For now, use placeholder images - in production, these would come from product images
  const activeImage = `https://via.placeholder.com/500?text=${encodeURIComponent(activeColorName)}`;
  const galleryImages = [activeImage, activeImage, activeImage, activeImage];

  // Show loading if variants not ready
  if (
    variantsLoading ||
    slugLoading ||
    specificLoading ||
    (availableColors.length === 0 && availableSizes.length === 0)
  ) {
    return (
      <div className="bg-white min-h-screen pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Split Screen Builder UI
  return (
    <div className="bg-white min-h-screen animate-[fade-in_0.5s_ease-out] pb-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Nav */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">
              Build Your Pack
            </h1>
            <p className="text-gray-500">
              Select colors and sizes for each item in your bundle.
            </p>
          </div>
          <Link
            to="/bundles"
            className="text-sm font-bold underline hover:text-primary"
          >
            Back to Options
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column: Sticky Image Slider */}
          <div className="relative">
            <div className="lg:sticky lg:top-24">
              <ImageSlider
                images={galleryImages}
                aspectRatio="aspect-square"
                className="shadow-sm max-w-lg mx-auto"
              />
              <div className="mt-4 text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Previewing
                </p>
                <p className="text-lg font-bold">{activeColorName}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Builder Controls */}
          <div className="flex flex-col gap-6">
            {/* Size Selector Tabs */}
            {variantsLoading ? (
              <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-center border border-gray-100">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl flex flex-wrap gap-2 items-center justify-center border border-gray-100">
                <span className="text-xs font-bold uppercase mr-2 text-gray-500 w-full text-center sm:w-auto">
                  Pack Size:
                </span>
                {[3, 4, 5, 7, 9].map((count) => (
                  <button
                    key={count}
                    onClick={() => navigate(`/bundle/${count}`)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeCount === count
                        ? "bg-black text-white shadow-md transform scale-105"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {count} Pack
                  </button>
                ))}
              </div>
            )}

            {/* Pricing Card */}
            <div className="flex items-center justify-between bg-primary/5 p-6 rounded-xl border border-primary/10">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Total Price
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(activeBundle.price)}
                  </span>
                  <span className="text-lg text-gray-400 line-through decoration-1">
                    {formatCurrency(activeBundle.originalPrice)}
                  </span>
                </div>
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold uppercase">
                Save {activeBundle.savings}
              </div>
            </div>

            {/* Item Selectors List */}
            <div className="space-y-4">
              {selections.map((sel, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveItem(idx)}
                  onClick={() => setActiveItem(idx)}
                  className={`p-6 rounded-xl border-2 transition-all cursor-pointer bg-white ${
                    activeItem === idx
                      ? "border-black shadow-lg scale-[1.01]"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold uppercase tracking-wider text-sm">
                      Item #{idx + 1}
                    </h3>
                    {activeItem === idx && (
                      <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded">
                        EDITING
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Colors */}
                    {availableColors.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                          Select Color:{" "}
                          <span className="text-black ml-1">{sel.color}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((colorName) => {
                            // Simple color hex mapping
                            const colorHex = colorName
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
                                        : "#ccc";
                            return (
                              <button
                                key={colorName}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSelection(idx, "color", colorName);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                                  sel.color === colorName
                                    ? "ring-2 ring-offset-2 ring-black scale-110"
                                    : "hover:scale-110 opacity-80 hover:opacity-100"
                                }`}
                                title={colorName}
                              >
                                <div
                                  className="w-full h-full rounded-full border border-gray-200"
                                  style={{ backgroundColor: colorHex }}
                                ></div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sizes */}
                    {availableSizes.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                          Select Size
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSelection(idx, "size", size);
                              }}
                              className={`h-8 min-w-[32px] px-2 rounded text-xs font-bold border transition-colors ${
                                sel.size === size
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddBundleToCart}
              disabled={isAdding}
              className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-lg hover:bg-gray-900 transition-all shadow-xl disabled:opacity-75 disabled:cursor-wait mt-4"
            >
              {isAdding ? "Adding to Cart..." : "Add Bundle to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bundle;
