import React from "react";

const Newsletter: React.FC = () => {
  return (
    <section className="py-24 bg-primary text-white text-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <span className="text-[20rem] font-bold leading-none absolute -top-20 -left-20">
          H
        </span>
        <span className="text-[20rem] font-bold leading-none absolute -bottom-20 -right-20">
          W
        </span>
      </div>
      <div className="max-w-2xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-4">
          Join The Club
        </h2>
        <p className="text-blue-100 mb-8 text-lg">
          Sign up for exclusive early access to drops, secret sales, and 10% off
          your first order.
        </p>
        <form className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:bg-white/20 focus:border-white transition-colors"
          />
          <button className="px-8 py-4 bg-white text-primary font-bold rounded-full uppercase tracking-wide hover:bg-secondary transition-colors shadow-xl">
            Subscribe
          </button>
        </form>
        <p className="text-xs text-blue-300 mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
};

export default Newsletter;
