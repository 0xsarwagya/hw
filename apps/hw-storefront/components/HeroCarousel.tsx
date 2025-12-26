"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const HeroCarousel: React.FC = () => {
  const slides = [
    {
      id: 1,
      imageDesktop: "/banners:desktop:1.avif",
      imageMobile: "/banners:mobile:1.avif",
      title: "Your Style.\nYour Statement.",
      subtitle: "Premium Streetwear Essentials",
      cta: "Shop Men's",
      link: "/shop?category=Tees",
    },
    {
      id: 2,
      imageDesktop: "/banners:desktop:2.avif",
      imageMobile: "/banners:mobile:2.avif",
      title: "New Drop:\nHoodie Season",
      subtitle: "Comfort Meets Chaos",
      cta: "Shop Hoodies",
      link: "/shop?category=Hoodies",
    },
    {
      id: 3,
      imageDesktop: "/banners:desktop:3.avif",
      imageMobile: "/banners:mobile:3.avif",
      title: "Unisex\nCollections",
      subtitle: "For Him. For Her. For Everyone.",
      cta: "Shop All",
      link: "/shop",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full h-[85vh] overflow-hidden bg-gray-100">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
        >
          {/* Desktop Banner */}
          <Image
            src={slide.imageDesktop}
            alt={slide.title}
            fill
            className="object-cover object-center hidden md:block"
            priority={index === 0}
            unoptimized
          />
          {/* Mobile Banner */}
          <Image
            src={slide.imageMobile}
            alt={slide.title}
            fill
            className="object-cover object-center block md:hidden"
            priority={index === 0}
            unoptimized
          />
          <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/80 via-transparent to-transparent">
            <div className="max-w-screen-2xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-24 md:pb-32">
              <div className="max-w-3xl animate-[slide-up_0.8s_ease-out]">
                <p className="text-secondary font-bold uppercase tracking-widest mb-4 text-sm md:text-base">
                  {slide.subtitle}
                </p>
                <h1 className="text-5xl md:text-8xl font-bold text-white uppercase leading-[0.9] tracking-tighter mb-8 whitespace-pre-line">
                  {slide.title}
                </h1>
                <div className="flex gap-4">
                  <Link
                    href={slide.link}
                    className="bg-primary text-white px-8 py-4 rounded-full font-bold uppercase tracking-wide hover:bg-white hover:text-black transition-colors shadow-lg shadow-blue-900/40 animate-[pulse_2s_infinite]"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Carousel Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentSlide ? "bg-white w-8" : "bg-white/50 hover:bg-white"}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
