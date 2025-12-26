"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import ImageSlider from "../../components/ImageSlider";
import InfoModal from "../../components/InfoModal";
import LazyImage from "../../components/LazyImage";
import LoadingSpinner from "../../components/LoadingSpinner";
import ReviewModal from "../../components/ReviewModal";
import { SEO } from "../../components/SEO";
import { productMapper, useShop } from "../../context/ShopContext";
import {
  useProduct,
  useProductRecommendations,
  useProductVariants,
  useReviewAggregate,
} from "../../hooks/useApi";
import type { Product as BackendProduct } from "../../lib/validations/product";
import { Product } from "../../types";
import { formatCurrency } from "../../utils";
import {
  findVariantBySizeColor,
  getUniqueColors,
  getUniqueSizes,
} from "../../utils/variant-helpers";

const ProductDetails: React.FC = () => {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const {
    data: backendProduct,
    isLoading: productLoading,
    error: productError,
    refetch: refetchProduct,
  } = useProduct(productId);
  const { data: variants = [], isLoading: variantsLoading } =
    useProductVariants(backendProduct?.id);
  const { data: backendRecommendations = [] } = useProductRecommendations(
    backendProduct?.id,
  ) as { data: BackendProduct[] };

  // Map recommendations to UI Product type
  const recommendations = useMemo(() => {
    return backendRecommendations.map((p) => productMapper(p, []));
  }, [backendRecommendations]);

  // Refetch product when id changes
  React.useEffect(() => {
    if (productId) {
      // Use a small delay to ensure the query key has updated
      const timer = setTimeout(() => {
        refetchProduct();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [productId]); // Only depend on productId, not refetchProduct

  // Map backend product to UI Product type
  const product = useMemo(() => {
    if (!backendProduct) return null;
    return productMapper(backendProduct, variants);
  }, [backendProduct, variants]);

  const [selectedSize, setSelectedSize] = useState("L");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [activeImage, setActiveImage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Fake stats for urgency
  const [viewingCount, setViewingCount] = useState(12);
  const [deliveryDate, setDeliveryDate] = useState("");

  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  const isLoading = productLoading || variantsLoading;

  // Extract sizes and colors from variants
  const availableSizes = useMemo(() => getUniqueSizes(variants), [variants]);
  const availableColors = useMemo(() => getUniqueColors(variants), [variants]);

  useEffect(() => {
    if (product) {
      // Use first image from backend images array, or fallback to image field
      const firstImage =
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
          ? product.images[0]
          : product.image || "";
      if (firstImage) setActiveImage(firstImage); // Reset image on product change
    }

    if (variants.length > 0) {
      // Set default size from variants
      if (availableSizes.length > 0) {
        const defaultSize =
          availableSizes.find((s) => s === "L") || availableSizes[0];
        if (defaultSize) setSelectedSize(defaultSize);
      }
      // Set default color from variants
      if (availableColors.length > 0 && availableColors[0]) {
        setSelectedColor(availableColors[0]);
      }
      // If no size/color fields, select first variant by default
      if (
        availableSizes.length === 0 &&
        availableColors.length === 0 &&
        !selectedVariantId &&
        variants[0]
      ) {
        setSelectedVariantId(variants[0].id);
      }
    }

    // Randomize viewing count
    setViewingCount(Math.floor(Math.random() * (45 - 15 + 1)) + 15);

    // Calculate estimated delivery (3 days from now)
    const date = new Date();
    date.setDate(date.getDate() + 3);
    setDeliveryDate(
      date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    );
  }, [product, variants, availableSizes, availableColors]);

  // Find selected variant based on size and color, or by variant ID if no size/color fields
  // MUST be called before early returns to follow Rules of Hooks
  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;

    // If variants don't have size/color fields, use selectedVariantId or first variant
    if (availableSizes.length === 0 && availableColors.length === 0) {
      if (selectedVariantId) {
        return (
          variants.find((v) => v.id === selectedVariantId) ||
          variants[0] ||
          null
        );
      }
      return variants[0] || null;
    }

    return findVariantBySizeColor(variants, selectedSize, selectedColor);
  }, [
    variants,
    selectedSize,
    selectedColor,
    selectedVariantId,
    availableSizes.length,
    availableColors.length,
  ]);

  // Fetch review aggregate for selected variant
  // MUST be called before early returns to follow Rules of Hooks
  const { data: reviewAggregate } = useReviewAggregate(selectedVariant?.id);

  // Construct a gallery for the slider
  // Uses product.images from backend if available, ensuring the active (color-selected) image is first.
  // MUST be called before early returns to follow Rules of Hooks
  const galleryImages = useMemo(() => {
    if (!product) {
      return [
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5YTlhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=",
      ];
    }

    // First, try product.images array (this should be populated from backend)
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      // Filter out empty strings and invalid URLs, but keep all valid URLs
      const validImages = product.images.filter(
        (img) => img && typeof img === "string" && img.trim() !== "",
      );
      if (validImages.length > 0) {
        return validImages;
      }
    }

    // Fallback to product.image (single image field)
    if (
      product.image &&
      product.image.trim() !== "" &&
      !product.image.startsWith("data:image/svg+xml")
    ) {
      return [product.image];
    }

    // Fallback to activeImage (if set from variant selection)
    if (
      activeImage &&
      activeImage.trim() !== "" &&
      !activeImage.startsWith("data:image/svg+xml")
    ) {
      return [activeImage];
    }

    // Last resort: placeholder image (only if truly no images available)
    return [
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5YTlhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=",
    ];
  }, [product, product?.images, product?.image, activeImage]);

  // Ensure active image is first in gallery
  // MUST be called before early returns to follow Rules of Hooks
  const orderedGalleryImages = useMemo(() => {
    if (!activeImage) return galleryImages;
    const images = [...galleryImages];
    const activeIndex = images.indexOf(activeImage);
    if (activeIndex === -1) {
      // If active image is not in the list, add it to the front
      return [activeImage, ...images];
    } else if (activeIndex > 0) {
      // If it is in the list but not first, move it to front
      images.splice(activeIndex, 1);
      return [activeImage, ...images];
    }
    return images;
  }, [galleryImages, activeImage]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (productError || !product) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-4">
          {productError?.message ||
            "The product you are looking for does not exist."}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => refetchProduct()}
            className="px-6 py-3 bg-primary text-white rounded-lg font-bold uppercase hover:bg-blue-800 transition-colors"
          >
            Retry
          </button>
          <Link
            href="/shop"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold uppercase hover:bg-gray-300 transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleColorChange = (colorName: string) => {
    if (colorName) setSelectedColor(colorName);
    // Find variant with this color to get image if available
    const colorVariant = variants.find((v) => v.color === colorName);
    // For now, keep using product image - images would come from product_images table
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      console.error("No variant selected");
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product, selectedSize, 1, selectedVariant.id);
      setTimeout(() => {
        setIsAdding(false);
      }, 500);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setIsAdding(false);
    }
  };

  const isFavorite = isInWishlist(product.id);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 animate-[fade-in_0.3s_ease-out]">
      <SEO
        title={product.name || backendProduct?.title || "Product Details"}
        description={
          product.description ||
          backendProduct?.description ||
          "View product details and add to cart"
        }
        type="product"
        product={{
          name: product.name,
          price: product.price.toString(),
          currency: "INR",
          availability: "in_stock",
          condition: "new",
          image: product.image,
        }}
      />
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        defaultTab="size"
      />
      {selectedVariant && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          variantId={selectedVariant.id}
          productName={product.name}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Gallery - Slider with Swipe Support */}
        <div className="flex flex-col gap-4 relative lg:sticky lg:top-24 lg:self-start">
          <ImageSlider
            images={orderedGalleryImages}
            className="shadow-sm max-w-xl mx-auto rounded-xl"
            aspectRatio="9:16"
          />

          {/* Social Proof */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-pulse max-w-xl mx-auto w-full">
            <span className="material-icons text-red-500 text-lg">
              local_fire_department
            </span>
            <span className="font-bold text-red-600">
              {viewingCount} people
            </span>{" "}
            are viewing this right now
          </div>
        </div>

        {/* Info - Scrolls Naturally */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {product.category}
            </span>
            <span className="text-gray-300">|</span>
            <div className="flex text-accent text-sm">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-icons text-base">
                  {i < Math.floor(product.rating || 0) ? "star" : "star_border"}
                </span>
              ))}
              <span className="text-gray-400 text-xs ml-1">
                ({product.reviews || 0})
              </span>
            </div>
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold uppercase tracking-tight mb-2">
            {product.name}
          </h1>
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-end gap-3">
              <p className="text-3xl lg:text-4xl font-bold text-primary">
                {formatCurrency(product.price)}
              </p>
              {product.originalPrice &&
                product.originalPrice !== product.price && (
                  <p className="text-xl text-gray-400 line-through mb-1">
                    {formatCurrency(product.originalPrice)}
                  </p>
                )}
            </div>
            {/* Show all pricelist prices */}
            {product.pricelistPrices && product.pricelistPrices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {product.pricelistPrices.map(
                  (plPrice: {
                    priceListId: string;
                    priceListName: string;
                    price: number;
                    overrideType: string;
                    overrideValue: number;
                  }) => (
                    <div
                      key={plPrice.priceListId}
                      className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                    >
                      <span className="font-semibold text-blue-700">
                        {plPrice.priceListName}:
                      </span>
                      <span className="ml-1 text-blue-900">
                        {formatCurrency(plPrice.price)}
                      </span>
                      {plPrice.overrideType === "PERCENTAGE" && (
                        <span className="ml-1 text-xs text-blue-600">
                          ({plPrice.overrideValue > 0 ? "-" : "+"}
                          {Math.abs(plPrice.overrideValue)}%)
                        </span>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="border-t border-b border-gray-100 py-6 space-y-6">
            {/* Variant Selector - Show if variants exist but no size/color fields */}
            {variants.length > 0 &&
              availableSizes.length === 0 &&
              availableColors.length === 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-3">
                    Select Variant
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantLabel =
                        variant.size ||
                        variant.color ||
                        variant.sku ||
                        `Variant ${variant.id.slice(0, 8)}`;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            // Set selected variant directly by ID
                            setSelectedVariantId(variant.id);
                            // Also update size/color if available
                            if (variant.size) setSelectedSize(variant.size!);
                            if (variant.color) setSelectedColor(variant.color!);
                          }}
                          disabled={variant.inventory === 0}
                          className={`h-12 px-4 flex items-center justify-center rounded-lg border text-sm font-bold transition-all active:scale-95
                                            ${
                                              isSelected
                                                ? "bg-primary text-white border-primary shadow-md"
                                                : variant.inventory > 0
                                                  ? "bg-white text-black border-gray-200 hover:border-black"
                                                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                            }`}
                        >
                          {variantLabel}
                        </button>
                      );
                    })}
                  </div>
                  {/* Stock Status */}
                  {selectedVariant && (
                    <p
                      className={`text-xs font-bold mt-2 flex items-center gap-1 ${selectedVariant.inventory > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {selectedVariant.inventory > 0
                        ? `✓ In Stock (${selectedVariant.inventory} available)`
                        : "✗ Out of Stock"}
                    </p>
                  )}
                </div>
              )}

            {/* Color Selector */}
            {availableColors.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3">
                  Color:{" "}
                  <span className="text-gray-500 font-normal ml-1">
                    {selectedColor || "Select"}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((colorName) => {
                    const isSelected = selectedColor === colorName;
                    return (
                      <button
                        key={colorName}
                        onClick={() => handleColorChange(colorName)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 relative group
                                            ${isSelected ? "border-primary" : "border-gray-200"}`}
                        title={colorName}
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-black/10 shadow-sm bg-gray-200"
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
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {availableSizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Size:{" "}
                    <span className="text-gray-500 font-normal ml-1">
                      {selectedSize}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="text-xs underline text-gray-500 hover:text-primary"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => {
                    const variantForSize = variants.find(
                      (v) => v.size === size,
                    );
                    const isInStock = variantForSize
                      ? variantForSize.inventory > 0
                      : false;
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (size) setSelectedSize(size);
                        }}
                        disabled={!isInStock}
                        className={`h-12 w-12 flex items-center justify-center rounded-lg border text-sm font-bold transition-all active:scale-95
                                            ${
                                              selectedSize === size
                                                ? "bg-primary text-white border-primary shadow-md"
                                                : isInStock
                                                  ? "bg-white text-black border-gray-200 hover:border-black"
                                                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                            }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {/* Stock Status */}
                {selectedVariant && (
                  <p
                    className={`text-xs font-bold mt-2 flex items-center gap-1 ${selectedVariant.inventory > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {selectedVariant.inventory > 0
                      ? `✓ In Stock (${selectedVariant.inventory} available)`
                      : "✗ Out of Stock"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleAddToCart}
              disabled={
                isAdding ||
                !selectedVariant ||
                (selectedVariant && selectedVariant.inventory === 0)
              }
              className={`w-full bg-primary text-white font-bold h-14 rounded-lg uppercase tracking-wider text-lg hover:bg-blue-800 transition-all active:scale-[0.99] shadow-xl shadow-blue-900/20 ${isAdding || !selectedVariant || (selectedVariant && selectedVariant.inventory === 0) ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {!selectedVariant
                ? "Select Size"
                : selectedVariant.inventory === 0
                  ? "Out of Stock"
                  : isAdding
                    ? "Adding..."
                    : "Add to Cart"}
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className={`w-full bg-white text-black border border-gray-300 font-bold h-14 rounded-lg uppercase tracking-wide hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 active:scale-[0.99] ${isFavorite ? "text-red-500 border-red-200 bg-red-50" : ""}`}
            >
              <span
                className={`material-icons-outlined text-xl ${isFavorite ? "text-red-500" : ""}`}
              >
                {isFavorite ? "favorite" : "favorite_border"}
              </span>
              {isFavorite ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>
          </div>

          {/* Delivery Estimator */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-primary">
              <span className="material-icons">local_shipping</span>
            </div>
            <div>
              <p className="text-sm font-bold">
                Order in the next 4 hrs 30 mins
              </p>
              <p className="text-xs text-gray-500">
                to get it by{" "}
                <span className="font-bold text-black">{deliveryDate}</span>
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="material-icons-outlined text-gray-400">
                verified_user
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-600">
                100% Authentic
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-icons-outlined text-gray-400">
                lock
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-600">
                Secure Payment
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="material-icons-outlined text-gray-400">
                sync_alt
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-600">
                Easy Returns
              </span>
            </div>
          </div>

          {product.description && (
            <div className="mt-8 prose prose-sm max-w-none text-gray-600">
              <h3 className="font-bold text-black uppercase mb-2">
                Description
              </h3>
              <div className="whitespace-pre-wrap">{product.description}</div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16 border-t border-gray-200 pt-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <button
            onClick={() => setShowReviewModal(true)}
            className="px-4 py-2 bg-primary text-white font-bold uppercase text-sm rounded-lg hover:bg-blue-800 transition-colors"
          >
            Add A Review
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="text-center md:text-left">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold">
                {(
                  reviewAggregate?.averageRating ||
                  product.rating ||
                  0
                ).toFixed(1)}
              </span>
              <span className="text-xl text-gray-500">/5</span>
            </div>
            <div className="flex text-accent mt-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-icons text-xl">
                  {i <
                  Math.floor(
                    reviewAggregate?.averageRating || product.rating || 0,
                  )
                    ? "star"
                    : "star_border"}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Based on {reviewAggregate?.reviewCount || product.reviews || 0}{" "}
              reviews
            </p>
          </div>

          <div className="flex-1 w-full max-w-md space-y-3">
            {reviewAggregate
              ? // Use backend data
                [5, 4, 3, 2, 1].map((rating) => {
                  const count =
                    rating === 5
                      ? reviewAggregate.rating5Count
                      : rating === 4
                        ? reviewAggregate.rating4Count
                        : rating === 3
                          ? reviewAggregate.rating3Count
                          : rating === 2
                            ? reviewAggregate.rating2Count
                            : reviewAggregate.rating1Count;
                  const percentage =
                    reviewAggregate.reviewCount > 0
                      ? (count / reviewAggregate.reviewCount) * 100
                      : 0;
                  return (
                    <div
                      key={rating}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-2">{rating}</span>
                      <span className="material-icons text-xs text-gray-400">
                        star
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })
              : // Fallback to placeholder if no aggregate data
                [5, 4, 3, 2, 1].map((rating, idx) => (
                  <div key={rating} className="flex items-center gap-3 text-sm">
                    <span className="w-2">{rating}</span>
                    <span className="material-icons text-xs text-gray-400">
                      star
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      0
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Frequently Bought Together / Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.slice(0, 4).map((item) => (
              <Link
                href={`/product/${item.id}`}
                key={item.id}
                className="group"
              >
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden mb-4 relative">
                  <LazyImage
                    src={item.image || ""}
                    alt={item.name}
                    aspectRatio="9:16"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-white/90 text-[10px] font-bold px-2 py-1 rounded">
                    {formatCurrency(item.priceIncludingGst || item.price)}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
