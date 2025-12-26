import React from "react";
import { ShippingContent } from "../../components/InfoContent";

const Shipping: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 animate-[fade-in_0.5s_ease-out]">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">
          Shipping Policy
        </h1>
        <p className="text-gray-500">
          Everything you need to know about delivery times and costs.
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm">
        <ShippingContent />
      </div>
    </div>
  );
};

export default Shipping;
