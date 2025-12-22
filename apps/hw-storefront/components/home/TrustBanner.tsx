import React from "react";

const TrustBanner: React.FC = () => {
  return (
    <section className="bg-secondary/30 py-20 mb-0">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <div className="flex flex-col items-center justify-center gap-4 text-center p-4 group cursor-default">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg mb-2 group-hover:scale-110 transition-transform text-primary">
              <span className="material-icons-outlined text-4xl">verified</span>
            </div>
            <div>
              <h3 className="font-bold text-xl uppercase leading-tight tracking-tight mb-1">
                Authentic Quality
              </h3>
              <p className="text-sm text-gray-600">
                Home grown, premium fabrics.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 text-center p-4 group cursor-default">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg mb-2 group-hover:scale-110 transition-transform text-primary">
              <span className="material-icons-outlined text-4xl">
                autorenew
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xl uppercase leading-tight tracking-tight mb-1">
                7 Days Returns
              </h3>
              <p className="text-sm text-gray-600">
                Easy exchanges, no questions asked.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 text-center p-4 group cursor-default">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg mb-2 group-hover:scale-110 transition-transform text-primary">
              <span className="material-icons-outlined text-4xl">
                local_shipping
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xl uppercase leading-tight tracking-tight mb-1">
                Free Shipping
              </h3>
              <p className="text-sm text-gray-600">
                On all prepaid orders above ₹999.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;
