import React, { useEffect, useRef, useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1" | "auto";
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  aspectRatio = "9:16",
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjUzMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+",
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.currentTarget;
    const failedSrc = imgElement.src;
    console.error("Image failed to load:", {
      src: failedSrc,
      originalSrc: src,
      error: e.nativeEvent,
      imgElement: imgElement,
    });

    // If it's a data URI placeholder, don't show error - it's expected
    if (src.startsWith("data:image/svg+xml")) {
      console.log("Placeholder image used (expected)");
      return;
    }

    setHasError(true);
    onError?.();
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "9:16":
        return "aspect-[9/16]";
      case "16:9":
        return "aspect-video";
      case "1:1":
        return "aspect-square";
      default:
        return "";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${getAspectRatioClass()} ${className}`}
    >
      {!hasError && (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {isInView && (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              onLoad={handleLoad}
              onError={handleError}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
            />
          )}
        </>
      )}
      {hasError && !src.startsWith("data:image/svg+xml") && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-4">
          <span className="text-gray-400 text-sm mb-2">
            Image not available
          </span>
          <span className="text-gray-300 text-xs text-center break-all">
            {src}
          </span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
