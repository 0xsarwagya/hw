import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20 animate-[fade-in_0.5s_ease-out]">
      <span className="material-icons text-9xl text-gray-200 mb-4 select-none">
        error_outline
      </span>
      <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-4">
        404
      </h1>
      <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide mb-4">
        Page Not Found
      </h2>
      <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="bg-primary text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
      >
        Return Home
      </Link>
    </div>
  );
};

export default NotFound;
