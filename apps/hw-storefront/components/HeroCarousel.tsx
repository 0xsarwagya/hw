import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const HeroCarousel: React.FC = () => {
  const slides = [
    {
      id: 1,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB3AEFotmLVaCeKFiroqO3nR0fg1kEAQ063Xq7viRYnc6syGuyLplPQBfxzSLiKTiZG06eoEtFMOocr4GD3W1523tuhUeUqUuN34ygdZvc7itoyxgU8w5tBItnw0qeVF8n4tXpcgJWw5e_xgGI9kZGv-uDHYBXVmgVr7Bpxf-DHtrKm6mdHmg4Mv0qIV9VsF_z0EU3AijbtkpQyuHw8Js9ZzyyibAwe5pWSfNaPxaSWdIq1B748PCwg1ArGi59FrGKXKlICqlSNr61B",
      title: "Your Style.\nYour Statement.",
      subtitle: "Premium Streetwear Essentials",
      cta: "Shop Men's",
      link: "/shop?category=Tees",
    },
    {
      id: 2,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCFEC38fU-fBmMkF4VqHhVBXu7qsAML8JaB09H8ASNnmzPUrklCA512RUbdxbXP_2R6AAuiI7_NFCgZ7ngjueJvUv1R5Lnnooho_slMagc3s-LSmwo2vLXvkfbuSqWqDAaA7XdHaTJ0RsdzDLizLrYXZyDVvkbUXnh3izP1nGxFsAreK2-TT4NC0Dk7oosuNNev7BK8Rp8dHTc7I6bIP8XwL-H1lDiTwQQL2ycZizUpAV5BhpXGHN1bRfVmeXHWpddn_0DNjIs_AiR_",
      title: "New Drop:\nHoodie Season",
      subtitle: "Comfort Meets Chaos",
      cta: "Shop Hoodies",
      link: "/shop?category=Hoodies",
    },
    {
      id: 3,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDkOWosVi1ErOJ9jUk9YsfwNsecOdKePWP7U1t2esLHBgJmMfH_FGoZgX7_TsENPvokqciHZnVPmdSSiARamarYSit51SB32sl88XmZra9vUskylVLsRa6VSdAy8awObO_yX0R2AAeNY8sw_nJkcPO4LSH0bVw_fwybeyRSbmd5CR1Dlr7YJrWnHUYyQeIsuwajT0lQ_ubdgAkxm6H2W1-atIiTGQRlIm21N-BnX_mSRalAeH24W5UplfGncv3tusJQ5_eLMV1g-qQc",
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
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center"
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
                    to={slide.link}
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
