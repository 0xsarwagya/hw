import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { productMapper, useShop } from "../context/ShopContext";
import { useCollections, useProducts } from "../hooks/useApi";
import { Product } from "../types";
import { formatCurrency } from "../utils";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { cart, openCart, isAuthenticated } = useShop();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Fetch products for search
  const { data: productsData } = useProducts({
    limit: 50,
    search: searchQuery || undefined,
  });
  const backendProducts = productsData?.data || [];
  const searchProducts = backendProducts
    .map((p) => productMapper(p, []))
    .slice(0, 6);

  // Fetch collections for navigation
  const { data: collections = [], isLoading: collectionsLoading } =
    useCollections();

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      // Results will come from useProducts hook above
      setSearchResults(searchProducts);
    } else {
      setSearchResults([]);
    }
  };

  // Update search results when products change
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchProducts);
    }
  }, [searchProducts, searchQuery]);

  // Handle standard form submission (Fallback/Desktop enter key)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchResults([]); // Close dropdown
      setIsSearchFocused(false);
    }
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear search on route change
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);
  }, [location.pathname]);

  const NavLinks = () => {
    // Sort collections by position, then by name
    const sortedCollections = [...collections].sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return a.name.localeCompare(b.name);
    });

    return (
      <>
        {sortedCollections.length > 0 ? (
          sortedCollections.map((collection, index) => (
            <React.Fragment key={collection.id}>
              <Link
                to={`/shop?collectionId=${collection.id}`}
                className="text-sm font-bold hover:underline hover:text-primary transition-colors whitespace-nowrap uppercase"
              >
                {collection.name}
              </Link>
              {index < sortedCollections.length - 1 && (
                <span className="text-gray-300 hidden lg:inline">|</span>
              )}
            </React.Fragment>
          ))
        ) : (
          // Fallback to default links if no collections are loaded
          <>
            <Link
              to="/shop?category=Tees"
              className="text-sm font-bold hover:underline hover:text-primary transition-colors whitespace-nowrap"
            >
              MEN'S
            </Link>
            <span className="text-gray-300 hidden lg:inline">|</span>
            <Link
              to="/shop?category=Unisex"
              className="text-sm font-bold hover:underline hover:text-primary transition-colors whitespace-nowrap"
            >
              UNISEX
            </Link>
            <span className="text-gray-300 hidden lg:inline">|</span>
            <Link
              to="/bundles"
              className="text-sm font-bold hover:underline hover:text-primary transition-colors whitespace-nowrap"
            >
              BUNDLES
            </Link>
            <span className="text-gray-300 hidden lg:inline">|</span>
            <Link
              to="/shop?category=Hoodies"
              className="text-sm font-bold hover:underline hover:text-primary transition-colors whitespace-nowrap"
            >
              HOODIES
            </Link>
          </>
        )}
      </>
    );
  };

  return (
    <>
      {/* Announcement Banner */}
      {showBanner && (
        <div className="bg-primary text-white text-xs md:text-sm font-bold py-3 relative z-[60] overflow-hidden whitespace-nowrap">
          <div className="inline-flex animate-marquee items-center">
            <span className="mx-8">
              FREE SHIPPING ON ALL PREPAID ORDERS | 7-DAY EASY RETURNS | USE
              CODE: NEW15
            </span>
            <span className="mx-8">★</span>
            <span className="mx-8">
              FREE SHIPPING ON ALL PREPAID ORDERS | 7-DAY EASY RETURNS | USE
              CODE: NEW15
            </span>
            <span className="mx-8">★</span>
            <span className="mx-8">
              FREE SHIPPING ON ALL PREPAID ORDERS | 7-DAY EASY RETURNS | USE
              CODE: NEW15
            </span>
            <span className="mx-8">★</span>
            <span className="mx-8">
              FREE SHIPPING ON ALL PREPAID ORDERS | 7-DAY EASY RETURNS | USE
              CODE: NEW15
            </span>
            <span className="mx-8">★</span>
            <span className="mx-8">
              FREE SHIPPING ON ALL PREPAID ORDERS | 7-DAY EASY RETURNS | USE
              CODE: NEW15
            </span>
            <span className="mx-8">★</span>
            <span className="mx-8">
              FREE SHIPPING ON ALL PREPAID ORDERS | 7-DAY EASY RETURNS | USE
              CODE: NEW15
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-white transition-colors bg-black/20 rounded-full p-1 z-10"
          >
            <span className="material-icons text-sm">close</span>
          </button>
        </div>
      )}

      <header
        className={`bg-white sticky z-50 transition-all duration-300 top-0 shadow-sm`}
      >
        {/* Main Navbar */}
        <div className="border-b border-gray-100">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex justify-between items-center relative">
              {/* Logo */}
              <div className="flex-shrink-0 z-10">
                <Link
                  to="/"
                  className="block hover:scale-105 transition-transform origin-left"
                >
                  <img
                    src="https://s6.imgcdn.dev/YT5tM2.png"
                    alt="Hush & Wear"
                    className="h-16 md:h-20 w-auto object-contain"
                  />
                </Link>
              </div>

              {/* Centered Navigation (Desktop) */}
              <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-6">
                <NavLinks />
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-4 z-10">
                <Link
                  to={isAuthenticated ? "/account" : "/login"}
                  className="text-black hover:text-primary p-1 hidden md:block hover:scale-110 transition-transform"
                  title={isAuthenticated ? "My Account" : "Sign In"}
                >
                  <span className="material-icons-outlined">
                    person_outline
                  </span>
                </Link>

                <div className="relative">
                  <button
                    onClick={openCart}
                    className="text-black hover:text-primary p-1 block hover:scale-110 transition-transform"
                  >
                    <span className="material-icons">shopping_cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold animate-[pop-in_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  className="lg:hidden text-black p-1"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="material-icons">menu</span>
                </button>
              </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden mt-4 pb-4 space-y-2 border-t pt-4 animate-[slide-down_0.3s_ease-out]">
                <Link
                  to="/shop"
                  className="block text-sm font-medium text-black py-2 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  SHOP ALL
                </Link>
                {collections.length > 0 ? (
                  collections
                    .sort((a, b) => {
                      if (
                        a.position !== undefined &&
                        b.position !== undefined
                      ) {
                        return a.position - b.position;
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/shop?collectionId=${collection.id}`}
                        className="block text-sm font-medium text-black py-2 hover:text-primary uppercase"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {collection.name}
                      </Link>
                    ))
                ) : (
                  <>
                    <Link
                      to="/bundles"
                      className="block text-sm font-medium text-black py-2 hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      BUNDLES
                    </Link>
                  </>
                )}
                <Link
                  to="/track-order"
                  className="block text-sm font-medium text-black py-2 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  TRACK ORDER
                </Link>
                <Link
                  to="/contact"
                  className="block text-sm font-medium text-black py-2 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  CONTACT US
                </Link>
                <Link
                  to="/reviews"
                  className="block text-sm font-medium text-black py-2 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  REVIEWS
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/account"
                    className="block text-sm font-medium text-black py-2 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    MY ACCOUNT
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="block text-sm font-medium text-black py-2 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    SIGN IN / REGISTER
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Second Row: Search Bar (Left) & Info Links (Right) */}
        <div
          className="bg-gray-50 border-b border-gray-100 relative"
          ref={searchContainerRef}
        >
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar - Aligned Left/Center on Desktop */}
              <div className="w-full md:max-w-xl relative">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search for products, brands and more..."
                    className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-shadow"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                  />
                  <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    search
                  </span>

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  )}
                </form>

                {/* Search Dropdown Results */}
                {isSearchFocused && searchQuery.trim() && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-[fade-in_0.2s_ease-out]">
                    {searchResults.length > 0 ? (
                      <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                        {searchResults.map((product) => (
                          <li key={product.id}>
                            <Link
                              to={`/product/${product.id}`}
                              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                              onClick={() => {
                                setSearchQuery("");
                                setSearchResults([]);
                                setIsSearchFocused(false);
                              }}
                            >
                              <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200 group-hover:border-primary/30">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-sm text-gray-900 group-hover:text-primary">
                                  {product.name}
                                </h4>
                                <p className="text-xs text-gray-500 uppercase">
                                  {product.category}
                                </p>
                              </div>
                              <span className="font-bold text-primary">
                                {formatCurrency(product.price)}
                              </span>
                            </Link>
                          </li>
                        ))}
                        <li className="p-3 bg-gray-50 text-center border-t border-gray-100">
                          <button
                            onClick={handleSearchSubmit}
                            className="text-xs font-bold uppercase text-primary hover:underline"
                          >
                            View All Results
                          </button>
                        </li>
                      </ul>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <span className="material-icons text-4xl mb-2 text-gray-300">
                          search_off
                        </span>
                        <p className="font-medium">
                          No products found for "{searchQuery}"
                        </p>
                        <p className="text-xs mt-1">
                          Try checking your spelling or using different
                          keywords.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side Links (Track & Contact) */}
              <div className="flex items-center gap-6 whitespace-nowrap">
                <Link
                  to="/track-order"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-primary transition-colors"
                >
                  <span className="material-icons text-base">
                    local_shipping
                  </span>
                  Track Order
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-primary transition-colors"
                >
                  <span className="material-icons text-base">
                    support_agent
                  </span>
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
