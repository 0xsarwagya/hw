import React from "react";
import { Review } from "../../types";

interface TestimonialsProps {
  reviews: Review[];
}

const Testimonials: React.FC<TestimonialsProps> = ({ reviews }) => {
  // Triple the reviews for smooth marquee effect
  const marqueeReviews = [...reviews, ...reviews, ...reviews];

  return (
    <section className="py-24 bg-dark text-white overflow-hidden">
      <div className="text-center mb-16 px-4">
        <span className="text-primary font-bold uppercase tracking-widest text-sm mb-2 block">
          Testimonials
        </span>
        <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight text-white mb-2">
          Vibe Check
        </h2>
        <p className="text-gray-400 mt-2">
          Join thousands of satisfied customers.
        </p>
      </div>

      <div className="relative w-full">
        <div className="flex gap-6 animate-marquee-slow hover:pause-on-hover w-max px-4">
          {marqueeReviews.map((review, idx) => (
            <div
              key={`${review.id}-${idx}`}
              className="w-[300px] md:w-[400px] bg-white/5 border border-white/10 rounded-2xl p-8 flex-shrink-0 backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                {review.avatar ? (
                  <img
                    src={review.avatar}
                    alt={review.author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-white text-lg">
                    {review.author[0]}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white uppercase tracking-wide">
                    {review.author}
                  </p>
                  <div className="flex text-accent text-sm">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-icons text-base">
                        star
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-2 text-secondary">
                "{review.title}"
              </h4>
              <p className="text-gray-300 italic leading-relaxed text-sm md:text-base">
                {review.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
