import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { useProductVariants } from "../hooks/useApi";
import { Product } from "../types";
import { formatCurrency } from "../utils";
import {
  findVariantBySizeColor,
  getUniqueColors,
  getUniqueSizes,
} from "../utils/variant-helpers";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const { data: variants = [] } = useProductVariants(product?.id);

  const [selectedSize, setSelectedSize] = useState("L");
  const [selectedColor, setSelectedColor] = useState("");
  const [activeImage, setActiveImage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const availableSizes = useMemo(() => getUniqueSizes(variants), [variants]);
  const availableColors = useMemo(() => getUniqueColors(variants), [variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return findVariantBySizeColor(variants, selectedSize, selectedColor);
  }, [variants, selectedSize, selectedColor]);

  useEffect(() => {
    if (product) {
      setActiveImage(product.image || "");
    }
    if (variants.length > 0) {
      if (availableSizes.length > 0) {
        const defaultSize =
          availableSizes.find((s) => s === "L") || availableSizes[0];
        setSelectedSize(defaultSize);
      }
      if (availableColors.length > 0) {
        setSelectedColor(availableColors[0]);
      }
    }
  }, [product, variants, availableSizes, availableColors]);

  if (!isOpen || !product) return null;

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !product) {
      console.error("No variant or product selected");
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product, selectedSize, 1, selectedVariant.id);
      setTimeout(() => {
        setIsAdding(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setIsAdding(false);
    }
  };

  const isFavorite = isInWishlist(product.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 flex flex-col md:flex-row shadow-2xl animate-[pop-in_0.3s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 rounded-full hover:bg-gray-100 transition-colors"
        >
          <span className="material-icons text-gray-500">close</span>
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-secondary/30 min-h-[300px] md:min-h-[500px] relative">
          <img
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-cover absolute inset-0"
          />
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">
            {product.name}
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-medium">
              {formatCurrency(product.price)}
            </span>
            <div className="flex text-accent text-sm">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`material-icons text-base ${i < Math.floor(product.rating) ? "" : "text-gray-300"}`}
                >
                  star
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              ({product.reviews} reviews)
            </span>
          </div>

          <div className="flex-1 space-y-6">
            {/* Color Selector */}
            {availableColors.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                  Color: {selectedColor || "Select"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((colorName) => {
                    const isSelected = selectedColor === colorName;
                    return (
                      <button
                        key={colorName}
                        onClick={() => handleColorChange(colorName)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-primary scale-110" : "border-gray-200 hover:border-gray-300"}`}
                        title={colorName}
                      >
                        <div className="w-6 h-6 rounded-full border border-gray-100 bg-gray-200"></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {availableSizes.length > 0 && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-gray-500">
                    Size: {selectedSize}
                  </span>
                  <button className="text-xs underline text-gray-400 hover:text-black">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
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
                        onClick={() => setSelectedSize(size)}
                        disabled={!isInStock}
                        className={`w-10 h-10 rounded border text-xs font-bold transition-colors ${selectedSize === size ? "bg-primary text-white border-primary" : isInStock ? "bg-white text-gray-600 border-gray-200 hover:border-gray-400" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={
                isAdding ||
                !selectedVariant ||
                (selectedVariant && selectedVariant.inventory === 0)
              }
              className="w-full bg-primary text-white font-bold h-12 rounded-lg uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-75 disabled:cursor-wait"
            >
              {!selectedVariant
                ? "Select Size"
                : selectedVariant.inventory === 0
                  ? "Out of Stock"
                  : isAdding
                    ? "Adding..."
                    : "Add to Cart"}
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => toggleWishlist(product)}
                className={`flex-1 h-12 border rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors ${isFavorite ? "border-red-200 text-red-500 bg-red-50" : "border-gray-200 text-black"}`}
              >
                <span
                  className={`material-icons text-lg ${isFavorite ? "text-red-500" : "text-gray-400"}`}
                >
                  {isFavorite ? "favorite" : "favorite_border"}
                </span>
                {isFavorite ? "Saved" : "Wishlist"}
              </button>
              <button
                onClick={() =>
                  navigate(`/product/${product.slug || product.id}`)
                }
                className="flex-1 h-12 border border-gray-200 rounded-lg font-bold uppercase text-xs hover:bg-gray-50 transition-colors text-black"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
