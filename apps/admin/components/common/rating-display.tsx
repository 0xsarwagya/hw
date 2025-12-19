"use client";

import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  maxRating?: number;
  showValue?: boolean;
  className?: string;
  starClassName?: string;
}

const DEFAULT_MAX_RATING = 5;

/**
 * Reusable rating display component
 * Displays star ratings with consistent styling
 */
export function RatingDisplay({
  rating,
  maxRating = DEFAULT_MAX_RATING,
  showValue = false,
  className,
  starClassName,
}: RatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const isFull = index < fullStars;
        const isHalf = index === fullStars && hasHalfStar;
        const isEmpty = !isFull && !isHalf;

        return (
          <span
            key={index}
            className={cn(
              "text-lg",
              isFull && "text-yellow-500",
              isHalf && "text-yellow-500 opacity-50",
              isEmpty && "text-gray-300",
              starClassName
            )}
          >
            ★
          </span>
        );
      })}
      {showValue && (
        <span className="ml-2 text-sm text-muted-foreground">({rating})</span>
      )}
    </div>
  );
}

