import React from "react";
import { SizeChartContent } from "../components/InfoContent";

const SizeChart: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 animate-[fade-in_0.5s_ease-out]">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">
          Size Chart
        </h1>
        <p className="text-gray-500">
          Find your perfect fit with our detailed measurement guides.
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm">
        <SizeChartContent />
      </div>
    </div>
  );
};

export default SizeChart;
