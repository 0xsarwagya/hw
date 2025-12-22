import React from "react";
import { Product } from "../../types";

interface InstagramFeedProps {
  products: Product[];
}

const InstagramFeed: React.FC<InstagramFeedProps> = ({ products }) => {
  const socialImages = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB3AEFotmLVaCeKFiroqO3nR0fg1kEAQ063Xq7viRYnc6syGuyLplPQBfxzSLiKTiZG06eoEtFMOocr4GD3W1523tuhUeUqUuN34ygdZvc7itoyxgU8w5tBItnw0qeVF8n4tXpcgJWw5e_xgGI9kZGv-uDHYBXVmgVr7Bpxf-DHtrKm6mdHmg4Mv0qIV9VsF_z0EU3AijbtkpQyuHw8Js9ZzyyibAwe5pWSfNaPxaSWdIq1B748PCwg1ArGi59FrGKXKlICqlSNr61B",
    products[5]?.image || "",
    products[12]?.image || "",
    products[18]?.image || "",
    products[25]?.image || "",
    products[30]?.image || "",
  ].filter(Boolean);

  return (
    <section className="py-20 border-t border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-4 text-center mb-10">
        <span className="text-primary font-bold uppercase tracking-widest text-sm mb-2 block">
          Social Media
        </span>
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-black">
          Follow Us @HushAndWear
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6">
        {socialImages.map((img, idx) => (
          <div
            key={idx}
            className="aspect-square relative group cursor-pointer overflow-hidden border border-white"
          >
            <img
              src={img}
              alt="Social Feed"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
              <span className="material-icons text-3xl">favorite</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-10">
        <a
          href="#"
          className="inline-flex items-center gap-2 text-black font-bold uppercase tracking-wide border-b-2 border-black pb-1 hover:text-primary hover:border-primary transition-colors"
        >
          View On Instagram{" "}
          <span className="material-icons text-sm">north_east</span>
        </a>
      </div>
    </section>
  );
};

export default InstagramFeed;
