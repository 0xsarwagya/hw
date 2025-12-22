import React from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";
import LazyImage from "../LazyImage";
import LoadingSpinner from "../LoadingSpinner";

const FeaturedCategories: React.FC = () => {
  const { data: categoriesData, isLoading } = useCategories();
  const categories = categoriesData?.data || [];

  // Take first 3 categories, or show bundles link as 3rd item
  const displayCategories = categories.slice(0, 2);
  const hasBundles = categories.length >= 3;

  if (isLoading) {
    return (
      <section className="py-20 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-black">
            Shop By Category
          </h2>
        </div>
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <section className="py-20 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-black">
          Shop By Category
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayCategories.map((category) => (
          <Link
            key={category.id}
            to={`/shop?categoryId=${category.id}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-2xl mb-6 bg-gray-100 shadow-sm">
              {category.image ? (
                <LazyImage
                  src={category.image}
                  alt={category.name}
                  aspectRatio="9:16"
                  className="transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="aspect-[9/16] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400 uppercase">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <span className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 group-hover:text-black group-hover:border-black transition-all">
                Explore Collection
              </span>
            </div>
          </Link>
        ))}

        {/* Bundles Link - Always show as 3rd item */}
        <Link to="/bundles" className="group block">
          <div className="relative overflow-hidden rounded-2xl mb-6 bg-gray-100 shadow-sm">
            <LazyImage
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB4PwueFyx_SM4ZjCWoo7-L8UznMDSkO8cfhSUCtoB2jDhdOPpVnFVUBZWsZklLQHwmi7UOza52s6e6kuSzAvr0vte2K-edCha53sHE6y1eVI0dbKwKj89t2OB6io_e84qWu3Tcy-GLPN__lWhNuytgtkFN_VkXopjH__TUomHMIi9mftFGH1ImQgEyDBtEXwv3I-1h17M5CMM1pyWnsvQGWNR3MSQRBLtfaE1mscMvnsdKApLb90ukV1MwMW9zL5CpEvo_7x9fkrj"
              alt="Bundles"
              aspectRatio="9:16"
              className="transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
              Bundles
            </h3>
            <span className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 group-hover:text-black group-hover:border-black transition-all">
              Save Up To 45%
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedCategories;
