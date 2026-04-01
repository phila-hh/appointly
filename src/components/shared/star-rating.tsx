/**
 * @file Star Rating Component
 * @description Displays a visual star rating (1–5 stars) using filled,
 * half, and empty star icons.
 *
 * Supports:
 *   - Full ratings (e.g., 4.0 → ★★★★☆)
 *   - Half ratings (e.g., 3.5 → ★★★½☆)
 *   - Configurable size
 *   - Optional numeric display alongside stars
 *
 * @example
 * ```tsx
 * <StarRating rating={4.5} />
 * <StarRating rating={3} showValue size="lg" />
 * ```
 */

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

/** Props accepted by the StarRating component. */
interface StarRatingProps {
  /** The rating value (0–5). Rounds to nearest 0.5. */
  rating: number;
  /** Whether to show the numeric value next to the stars. */
  showValue?: boolean;
  /** Number of reviews to display (e.g., "(42 reviews)"). */
  reviewCount?: number;
  /** Size variant for the stars. */
  size?: "sm" | "md" | "lg";
}

/** Icon size classes for each size variant. */
const SIZE_CLASSES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

/**
 * Calculates how to render each of the 5 star positions.
 *
 * @param rating - The numeric rating (0–5)
 * @returns Array of 5 elements: "full", "half", or "empty"
 */
function getStarTypes(rating: number): ("full" | "half" | "empty")[] {
  // Round to nearest 0.5
  const rounded = Math.round(rating * 2) / 2;
  const stars: ("full" | "half" | "empty")[] = [];

  for (let i = 1; i <= 5; i++) {
    if (rounded >= i) {
      stars.push("full");
    } else if (rounded >= i - 0.5) {
      stars.push("half");
    } else {
      stars.push("empty");
    }
  }

  return stars;
}

export function StarRating({
  rating,
  showValue = false,
  reviewCount,
  size = "md",
}: StarRatingProps) {
  const starTypes = getStarTypes(rating);
  const iconClass = SIZE_CLASSES[size];

  return (
    <div className="flex items-center gap-1">
      {/* Star icons */}
      <div className="flex items-center">
        {starTypes.map((type, index) => {
          if (type === "full") {
            return (
              <Star
                key={index}
                className={cn(iconClass, "fill-yellow-400 text-yellow-400")}
              />
            );
          }
          if (type === "half") {
            return (
              <StarHalf
                key={index}
                className={cn(iconClass, "fill-yellow-400 text-yellow-400")}
              />
            );
          }
          return (
            <Star
              key={index}
              className={cn(iconClass, "text-muted-foreground/30")}
            />
          );
        })}
      </div>

      {/* Numeric value */}
      {showValue && (
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      )}

      {/* Review count */}
      {reviewCount !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

/**
 * Calculates the average rating from an array of rating values.
 *
 * @param ratings - Array of individual rating numbers (1–5)
 * @returns Average rating rounded to 1 decimal, or 0 if no ratings
 *
 * @example
 * ```ts
 * calculateAverageRating([5, 4, 5, 3]) // → 4.3
 * calculateAverageRating([])            // → 0
 * ```
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
