import React from "react";
import { useShop } from "../../context/ShopContext";
import { Review } from "../../types";

const Reviews: React.FC = () => {
  const { reviews, addReview } = useShop();

  const handleWriteReview = () => {
    // Note: Reviews require variantId and orderId from backend
    // This is a placeholder - real implementation should get these from context
    alert(
      "To write a review, please go to a product page and use the review form after placing an order.",
    );
    // const content = window.prompt("Write your review:");
    // if (content) {
    //   addReview({
    //     variantId: "", // Would need actual variant ID
    //     orderId: "", // Would need actual order ID
    //     rating: 5,
    //     title: "Just Posted",
    //     body: content,
    //   });
    // }
  };

  // Calculate average rating
  const avgRating = (
    reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-4">
          What Our Customers Say
        </h1>
      </header>

      {/* Summary Card */}
      <div className="border border-gray-200 rounded-xl p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-secondary/30">
        <div className="flex items-center gap-6">
          <span className="text-7xl md:text-8xl font-bold text-primary">
            {avgRating}
          </span>
          <div className="flex flex-col">
            <div className="flex text-accent text-2xl">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-icons">
                  {i < Math.round(Number(avgRating)) ? "star" : "star_border"}
                </span>
              ))}
            </div>
            <span className="text-gray-500 mt-1">
              Based on {reviews.length} reviews
            </span>
          </div>
        </div>
        <button
          onClick={handleWriteReview}
          className="bg-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:scale-105 transition-transform shadow-lg shadow-blue-900/20"
        >
          Write a Review
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border border-gray-200 rounded-xl p-6 flex flex-col h-full hover:shadow-lg transition-shadow bg-white group hover:border-primary/30"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex text-accent text-lg">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-icons text-xl">
                    {i < Math.floor(review.rating)
                      ? "star"
                      : i === Math.floor(review.rating) &&
                          review.rating % 1 !== 0
                        ? "star_half"
                        : "star_border"}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400">{review.date}</span>
            </div>
            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
              {review.title}
            </h3>
            <p className="text-gray-600 flex-grow">"{review.content}"</p>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-3">
              {review.avatar && (
                <img
                  src={review.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <p className="font-semibold text-sm">{review.author}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <button className="px-8 py-3 border border-gray-300 rounded-full font-bold uppercase hover:bg-secondary hover:text-primary hover:border-primary transition-colors">
          Load More Reviews
        </button>
      </div>
    </div>
  );
};

export default Reviews;
