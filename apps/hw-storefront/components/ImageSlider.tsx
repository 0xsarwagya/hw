import React, { useEffect, useRef, useState } from "react";
import LazyImage from "./LazyImage";

interface ImageSliderProps {
  images: string[];
  aspectRatio?: string;
  className?: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  aspectRatio = "aspect-[4/5] md:aspect-square",
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Always show slider, even with placeholder if no images
  const displayImages =
    images && images.length > 0
      ? images
      : [
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5YTlhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=",
        ];

  // Reset index when images array changes significantly
  useEffect(() => {
    setCurrentIndex(0);
  }, [displayImages.length, displayImages[0] || ""]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0]?.clientX || 0;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    if (touchStartX.current - touchEndX.current > swipeThreshold) {
      // Swipe Left (Next)
      nextSlide();
    }
    if (touchStartX.current - touchEndX.current < -swipeThreshold) {
      // Swipe Right (Prev)
      prevSlide();
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1,
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1,
    );
  };

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  return (
    <div
      className={`relative w-full overflow-hidden group rounded-2xl bg-gray-100 ${aspectRatio} ${className}`}
    >
      {/* Images container */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {displayImages.map((img, idx) => (
          <div
            key={idx}
            className="w-full h-full flex-shrink-0 flex items-center justify-center bg-secondary/10"
          >
            <LazyImage
              src={img}
              alt={`Slide ${idx + 1}`}
              aspectRatio="9:16"
              className="w-full h-full"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Always Visible) */}
      {displayImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 md:p-3 rounded-full shadow-lg z-10 flex items-center justify-center transition-transform active:scale-95 md:hover:scale-110"
            aria-label="Previous Image"
          >
            <span className="material-icons text-black text-lg">
              chevron_left
            </span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 md:p-3 rounded-full shadow-lg z-10 flex items-center justify-center transition-transform active:scale-95 md:hover:scale-110"
            aria-label="Next Image"
          >
            <span className="material-icons text-black text-lg">
              chevron_right
            </span>
          </button>
        </>
      )}

      {/* Dots */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {displayImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                goToSlide(idx);
              }}
              className={`h-1.5 rounded-full transition-all shadow-sm ${idx === currentIndex ? "bg-primary w-6" : "bg-white/70 w-1.5 hover:bg-white"}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter Badge */}
      {displayImages.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm z-10">
          {currentIndex + 1} / {displayImages.length}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
