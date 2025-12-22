import React from "react";

export const SizeChartContent: React.FC = () => (
  <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
    {/* Tees */}
    <div>
      <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
        <span className="material-icons text-primary">checkroom</span>
        T-Shirts (Regular Fit)
      </h3>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-xs uppercase font-bold text-gray-600">
              <th className="p-3 border-b border-gray-200">Size</th>
              <th className="p-3 border-b border-gray-200">Chest (in)</th>
              <th className="p-3 border-b border-gray-200">Length (in)</th>
              <th className="p-3 border-b border-gray-200">Shoulder (in)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { s: "S", c: "38", l: "27", sh: "17.5" },
              { s: "M", c: "40", l: "28", sh: "18" },
              { s: "L", c: "42", l: "29", sh: "19" },
              { s: "XL", c: "44", l: "30", sh: "19.5" },
              { s: "XXL", c: "46", l: "31", sh: "20.5" },
            ].map((row, i) => (
              <tr
                key={row.s}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              >
                <td className="p-3 border-b border-gray-100 font-bold">
                  {row.s}
                </td>
                <td className="p-3 border-b border-gray-100">{row.c}</td>
                <td className="p-3 border-b border-gray-100">{row.l}</td>
                <td className="p-3 border-b border-gray-100">{row.sh}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        * Measurements are true to size. For an oversized fit, we recommend
        sizing up.
      </p>
    </div>

    {/* Hoodies */}
    <div>
      <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
        <span className="material-icons text-primary">hood_cloak</span>
        Hoodies (Relaxed Fit)
      </h3>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-xs uppercase font-bold text-gray-600">
              <th className="p-3 border-b border-gray-200">Size</th>
              <th className="p-3 border-b border-gray-200">Chest (in)</th>
              <th className="p-3 border-b border-gray-200">Length (in)</th>
              <th className="p-3 border-b border-gray-200">Sleeve (in)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { s: "S", c: "40", l: "27", sl: "24" },
              { s: "M", c: "42", l: "28", sl: "25" },
              { s: "L", c: "44", l: "29", sl: "25.5" },
              { s: "XL", c: "46", l: "30", sl: "26" },
              { s: "XXL", c: "48", l: "31", sl: "26.5" },
            ].map((row, i) => (
              <tr
                key={row.s}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              >
                <td className="p-3 border-b border-gray-100 font-bold">
                  {row.s}
                </td>
                <td className="p-3 border-b border-gray-100">{row.c}</td>
                <td className="p-3 border-b border-gray-100">{row.l}</td>
                <td className="p-3 border-b border-gray-100">{row.sl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="bg-secondary/20 p-4 rounded-lg flex items-start gap-3">
      <span className="material-icons text-primary mt-1">info</span>
      <div className="text-sm text-gray-700">
        <p className="font-bold mb-1">How to Measure</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Chest:</strong> Measure around the fullest part of your
            chest.
          </li>
          <li>
            <strong>Length:</strong> Measure from the highest point of the
            shoulder to the bottom hem.
          </li>
        </ul>
      </div>
    </div>
  </div>
);

export const ShippingContent: React.FC = () => (
  <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-gray-200 p-4 rounded-xl bg-gray-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
            <span className="material-icons">local_shipping</span>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase">Standard Shipping</h4>
            <p className="text-xs text-gray-500">Free on orders above ₹999</p>
          </div>
        </div>
        <p className="text-sm font-bold mt-2">3-5 Business Days</p>
      </div>

      <div className="border border-primary/30 p-4 rounded-xl bg-secondary/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
            <span className="material-icons">rocket_launch</span>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase">Express Shipping</h4>
            <p className="text-xs text-gray-500">Available at Checkout</p>
          </div>
        </div>
        <p className="text-sm font-bold mt-2">1-2 Business Days</p>
      </div>
    </div>

    <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
      <p>
        <strong className="text-black block mb-1">Processing Time</strong>
        Orders are processed within 24 hours of placement. Orders placed on
        weekends or holidays will be processed the next business day.
      </p>
      <p>
        <strong className="text-black block mb-1">Tracking</strong>
        Once your order has shipped, you will receive an email with a tracking
        number. You can track your order status on our{" "}
        <a href="/track-order" className="underline text-primary">
          Track Order
        </a>{" "}
        page.
      </p>
      <p>
        <strong className="text-black block mb-1">Cash on Delivery</strong>
        COD is available for most pin codes. A flat fee of ₹50 is applicable on
        COD orders.
      </p>
    </div>
  </div>
);

export const WashingContent: React.FC = () => (
  <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
    <div className="grid grid-cols-2 gap-4">
      {[
        {
          icon: "local_laundry_service",
          title: "Machine Wash Cold",
          desc: "Use gentle cycle",
        },
        {
          icon: "do_not_disturb_on",
          title: "Do Not Bleach",
          desc: "Avoid harsh chemicals",
        },
        { icon: "iron", title: "Iron Low Heat", desc: "Do not iron on print" },
        {
          icon: "dry",
          title: "Tumble Dry Low",
          desc: "Or hang dry for best results",
        },
      ].map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center text-center p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
        >
          <span className="material-icons text-3xl text-gray-600 mb-2">
            {item.icon}
          </span>
          <h4 className="font-bold text-sm mb-1">{item.title}</h4>
          <p className="text-xs text-gray-500">{item.desc}</p>
        </div>
      ))}
    </div>

    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg flex gap-3">
      <span className="material-icons text-yellow-600">tips_and_updates</span>
      <div className="text-sm text-yellow-800">
        <p className="font-bold mb-1">Pro Tip for Longevity</p>
        <p>
          To keep your prints looking fresh and fabric soft, always wash your
          garments inside out. This reduces friction on the printed area and
          prevents pilling.
        </p>
      </div>
    </div>
  </div>
);
