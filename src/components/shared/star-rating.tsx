/**
 * @file Star Rating Component
 * @description Displays a visual star rating (1–5 stars) using filled,
 * half, and empty star icons.
 *
 * Features:
 *   - Displays partial stars for decimal ratings (e.g., 4.5 stars)
 *   - Optional count display (e.g., "4.5 (127 reviews)")
 *   - Multiple size variants
 *   - Used for showing business average ratings
 */

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Props accepted by the StarRating component. */
interface StarRatingProps {
  /** Rating value (0-5, supports decimals) */
  rating: number;
  /** Whether to show the numeric value next to the stars. */
  showValue?: boolean;
  /** Optional, number of reviews to display (e.g., "(42 reviews)"). */
  reviewCount?: number;
  /** Size variant for the stars. */
  size?: "sm" | "md" | "lg";
}

/** Icon size classes for each size variant. */
const SIZE_CLASSES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

const TEXT_SIZE_CLASSES = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function StarRating({
  rating,
  showValue = false,
  reviewCount,
  size = "md",
}: StarRatingProps) {
  const clampedRating = Math.max(0, Math.min(5, rating));
  const iconClass = SIZE_CLASSES[size];
  const textClass = TEXT_SIZE_CLASSES[size];

  return (
    <div className="flex items-center gap-1">
      {/* Star icons */}
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.max(0, Math.min(1, clampedRating - star + 1));

          return (
            <div key={star} className="relative">
              {/* Background (empty) star */}
              <Star className={cn(iconClass, "fill-none text-gray-300")} />

              {/* Foreground (filled) star with clip-path for partial fill */}
              {fill > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className={cn(iconClass, "fill-yellow-400 text-yellow-400")}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Numeric value */}
      {showValue && (
        <span className={cn(textClass, "font-medium")}>
          {rating.toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {reviewCount !== undefined && (
        <span className={cn(textClass, "text-muted-foreground")}>
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
