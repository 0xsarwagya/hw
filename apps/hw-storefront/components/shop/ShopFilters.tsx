import React, { useMemo } from "react";
import { useCollections } from "../../hooks/useApi";
import { useCategories } from "../../hooks/useCategories";
import { Product } from "../../types";
import { formatCurrency } from "../../utils";
import { getColorHexWithFallback } from "../../utils/color-map";
import { getUniqueColors, getUniqueSizes } from "../../utils/variant-helpers";

interface ShopFiltersProps {
  products: Product[];
  selectedCategories: string[];
  selectedCollections: string[];
  selectedColors: string[];
  selectedSizes: string[];
  priceRange: [number, number];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedCollections: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>;
}

const ShopFilters: React.FC<ShopFiltersProps> = ({
  products,
  selectedCategories,
  selectedCollections,
  selectedColors,
  selectedSizes,
  priceRange,
  setSelectedCategories,
  setSelectedCollections,
  setSelectedColors,
  setSelectedSizes,
  setPriceRange,
}) => {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data || [];

  const { data: collections = [] } = useCollections();
  // Sort collections by position, then by name
  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return a.name.localeCompare(b.name);
    });
  }, [collections]);

  // Extract unique colors and sizes from products (would ideally come from variants)
  // For now, use product.colors and product.sizes if available
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => {
      if (p.colors) {
        p.colors.forEach((c) => colors.add(c));
      }
    });
    return Array.from(colors).sort();
  }, [products]);

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((p) => {
      if (p.sizes) {
        p.sizes.forEach((s) => sizes.add(s));
      }
    });
    return Array.from(sizes).sort();
  }, [products]);

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
    <div className="space-y-8">
      {/* Collections */}
      {sortedCollections.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider">
              Collections
            </h3>
            <button
              onClick={() => setSelectedCollections([])}
              className="text-xs text-gray-400 hover:text-black"
            >
              Reset
            </button>
          </div>
          <div className="space-y-2">
            {sortedCollections.map((collection) => (
              <label
                key={collection.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${selectedCollections.includes(collection.id) ? "bg-primary border-primary" : "border-gray-300 bg-white group-hover:border-primary"}`}
                >
                  {selectedCollections.includes(collection.id) && (
                    <span className="material-icons text-white text-xs font-bold">
                      check
                    </span>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedCollections.includes(collection.id)}
                  onChange={() =>
                    toggleFilter(
                      collection.id,
                      selectedCollections,
                      setSelectedCollections,
                    )
                  }
                />
                <span
                  className={`text-sm ${selectedCollections.includes(collection.id) ? "font-bold text-primary" : "text-gray-600 group-hover:text-black"}`}
                >
                  {collection.name}
                </span>
                {collection.productCount !== undefined && (
                  <span className="text-xs text-gray-400 ml-auto">
                    {collection.productCount}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider">
              Category
            </h3>
            <button
              onClick={() => setSelectedCategories([])}
              className="text-xs text-gray-400 hover:text-black"
            >
              Reset
            </button>
          </div>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${selectedCategories.includes(cat.id) ? "bg-primary border-primary" : "border-gray-300 bg-white group-hover:border-primary"}`}
                >
                  {selectedCategories.includes(cat.id) && (
                    <span className="material-icons text-white text-xs font-bold">
                      check
                    </span>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() =>
                    toggleFilter(
                      cat.id,
                      selectedCategories,
                      setSelectedCategories,
                    )
                  }
                />
                <span
                  className={`text-sm ${selectedCategories.includes(cat.id) ? "font-bold text-primary" : "text-gray-600 group-hover:text-black"}`}
                >
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {products.filter((p) => p.category === cat.id).length}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm uppercase tracking-wider">Price</h3>
          <button
            onClick={() => setPriceRange([0, 5000])}
            className="text-xs text-gray-400 hover:text-black"
          >
            Reset
          </button>
        </div>
        <div className="px-2">
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], parseInt(e.target.value)])
            }
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-2 text-sm font-medium">
            <span>{formatCurrency(priceRange[0])}</span>
            <span>{formatCurrency(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Colors */}
      {availableColors.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider">
              Color
            </h3>
            <button
              onClick={() => setSelectedColors([])}
              className="text-xs text-gray-400 hover:text-black"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              // Use color map for proper hex values
              const colorHex = getColorHexWithFallback(color);
              return (
                <button
                  key={color}
                  onClick={() =>
                    toggleFilter(color, selectedColors, setSelectedColors)
                  }
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedColors.includes(color) ? "border-primary scale-110" : "border-transparent hover:scale-105"}`}
                  title={color}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: colorHex }}
                  >
                    {selectedColors.includes(color) && (
                      <span className="material-icons text-white text-[10px] drop-shadow-md">
                        check
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sizes */}
      {availableSizes.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider">Size</h3>
            <button
              onClick={() => setSelectedSizes([])}
              className="text-xs text-gray-400 hover:text-black"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() =>
                  toggleFilter(size, selectedSizes, setSelectedSizes)
                }
                className={`py-2 text-xs font-bold rounded border transition-colors ${
                  selectedSizes.includes(size)
                    ? "bg-primary text-white border-primary"
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
  );
};

export default ShopFilters;
