"use client";

import React from "react";
import FAQ from "../components/FAQ";
import HeroCarousel from "../components/HeroCarousel";
import BestSellers from "../components/home/BestSellers";
import FeaturedCategories from "../components/home/FeaturedCategories";
import InstagramFeed from "../components/home/InstagramFeed";
import Newsletter from "../components/home/Newsletter";
import Testimonials from "../components/home/Testimonials";
import TrustBanner from "../components/home/TrustBanner";
import { useShop } from "../context/ShopContext";

// Force dynamic rendering since this page uses ShopProvider
export const dynamic = "force-dynamic";

export default function Home() {
  const { products, reviews } = useShop();
  // Requirement: 12 products for best sellers
  const bestSellers = products.slice(0, 12);

  return (
    <div className="w-full">
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
}
