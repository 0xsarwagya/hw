import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { Order } from "../types";

const TrackOrder: React.FC = () => {
  const { getOrder } = useShop();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    // Simulate network delay
    setTimeout(() => {
      const foundOrder = getOrder(orderId.trim());
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError("Order not found. Please check the ID and try again.");
      }
      setLoading(false);
    }, 1000);
  };

  // Helper to determine status progress
  const getStatusStep = (status: string) => {
    switch (status) {
      case "Processing":
        return 1;
      case "Shipped":
        return 2;
      case "Delivered":
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStatusStep(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 min-h-[60vh] animate-[fade-in_0.5s_ease-out]">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-4">
          Track Your Order
        </h1>
        <p className="text-gray-500">
          Enter your Order ID to see the current status of your shipment.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Try example ID: ORD-7782-9012
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-16">
        <form onSubmit={handleTrack} className="flex gap-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID (e.g., ORD-7782-9012)"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-primary focus:border-primary text-gray-900 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-75 disabled:cursor-wait transition-all active:scale-95"
          >
            {loading ? "Tracking..." : "Track"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>

      {order && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-[slide-down_0.5s_ease-out]">
          <div className="bg-secondary/30 p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="font-bold text-xl">{order.id}</h2>
              <p className="text-gray-500 text-sm">Placed on {order.date}</p>
            </div>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${
                order.status === "Delivered"
                  ? "bg-green-100 text-green-700"
                  : order.status === "Processing"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="p-8">
            {/* Status Timeline */}
            <div className="relative mb-12 px-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full -z-10"></div>
              <div
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full -z-10 transition-all duration-1000"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>

              <div className="flex justify-between">
                {/* Step 1: Placed */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors duration-500 ${currentStep >= 0 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    <span className="material-icons text-sm">inventory</span>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase transition-colors duration-500 ${currentStep >= 0 ? "text-primary" : "text-gray-400"}`}
                  >
                    Placed
                  </span>
                </div>

                {/* Step 2: Processing */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors duration-500 delay-300 ${currentStep >= 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    <span className="material-icons text-sm">settings</span>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase transition-colors duration-500 delay-300 ${currentStep >= 1 ? "text-primary" : "text-gray-400"}`}
                  >
                    Processing
                  </span>
                </div>

                {/* Step 3: Shipped */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors duration-500 delay-500 ${currentStep >= 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    <span className="material-icons text-sm">
                      local_shipping
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase transition-colors duration-500 delay-500 ${currentStep >= 2 ? "text-primary" : "text-gray-400"}`}
                  >
                    Shipped
                  </span>
                </div>

                {/* Step 4: Delivered */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors duration-500 delay-700 ${currentStep >= 3 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    <span className="material-icons text-sm">check</span>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase transition-colors duration-500 delay-700 ${currentStep >= 3 ? "text-green-600" : "text-gray-400"}`}
                  >
                    Delivered
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-4 uppercase text-sm tracking-wide">
                  Order Items
                </h3>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Size: {item.selectedSize}{" "}
                          {item.selectedColor ? `• ${item.selectedColor}` : ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} x ₹{item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-4 uppercase text-sm tracking-wide">
                  Delivery Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold mb-1">{order.shippingAddress.name}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {order.shippingAddress.street}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zip}
                    <br />
                    Phone: {order.shippingAddress.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
