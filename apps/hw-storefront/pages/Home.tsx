import React from "react";
import FAQ from "../components/FAQ";
import HeroCarousel from "../components/HeroCarousel";
import BestSellers from "../components/home/BestSellers";
import FeaturedCategories from "../components/home/FeaturedCategories";
import InstagramFeed from "../components/home/InstagramFeed";
import Newsletter from "../components/home/Newsletter";
import Testimonials from "../components/home/Testimonials";
import TrustBanner from "../components/home/TrustBanner";
import { SEO } from "../components/SEO";
import { useShop } from "../context/ShopContext";

const Home: React.FC = () => {
  const { products, reviews } = useShop();
  // Requirement: 12 products for best sellers
  const bestSellers = products.slice(0, 12);

  return (
    <div className="w-full">
      <SEO
        title="Hush & Wear - Premium Quality Apparel"
        description="Discover premium quality apparel at Hush & Wear. Shop the latest collections of t-shirts, hoodies, and more. Save up to 45% with our value bundles."
      />
      <HeroCarousel />
      <FeaturedCategories />
      <BestSellers products={bestSellers} />
      <TrustBanner />
      <Testimonials reviews={reviews} />

      {/* FAQ Section */}
      <section className="bg-white">
        <FAQ />
      </section>

      <Newsletter />
      <InstagramFeed products={products} />
    </div>
  );
};

export default Home;
