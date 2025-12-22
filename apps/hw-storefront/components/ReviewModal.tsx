import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { useAddReview } from "../hooks/useApi";
import { useOrders } from "../hooks/useOrders";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantId: string;
  productName: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  variantId,
  productName,
}) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const { isAuthenticated } = useShop();
  const { data: orders = [] } = useOrders();
  const addReviewMutation = useAddReview();

  // Filter orders that contain this variant and are completed/delivered
  const eligibleOrders = React.useMemo(() => {
    return orders.filter((order) => {
      // Check if order is completed/delivered
      const isCompleted =
        order.status === "delivered" ||
        order.status === "completed" ||
        order.status === "confirmed";
      if (!isCompleted) return false;

      // Check if order contains this variant
      return order.items?.some((item) => item.productVariantId === variantId);
    });
  }, [orders, variantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrderId) {
      alert("Please select an order");
      return;
    }

    if (!body.trim()) {
      alert("Please write a review");
      return;
    }

    try {
      await addReviewMutation.mutateAsync({
        variantId,
        orderId: selectedOrderId,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      });

      // Reset form
      setRating(5);
      setTitle("");
      setBody("");
      setSelectedOrderId("");
      onClose();
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className="bg-white rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-[pop-in_0.3s_ease-out]">
          <h2 className="text-xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to write a review.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl animate-[pop-in_0.3s_ease-out]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
          <h2 className="text-lg font-bold uppercase tracking-tight">
            Write A Review
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <span className="material-icons text-gray-500">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Reviewing:{" "}
              <span className="font-bold text-black">{productName}</span>
            </p>
          </div>

          {/* Order Selection */}
          {eligibleOrders.length > 0 ? (
            <div>
              <label className="block text-sm font-bold uppercase mb-2">
                Select Order *
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                required
              >
                <option value="">Select an order...</option>
                {eligibleOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.orderNumber || order.id.slice(-8)} -{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                You need to purchase this product before you can write a review.
              </p>
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2">
              Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  <span className="material-icons">star</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Summarize your review..."
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2">
              Review *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-none"
              placeholder="Share your experience with this product..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {body.length}/2000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !selectedOrderId ||
                !body.trim() ||
                addReviewMutation.isPending ||
                eligibleOrders.length === 0
              }
              className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
