/**
 * @file Star Rating Input Component
 * @description Interactive star rating selector for forms.
 *
 * Features:
 *   - Click to set rating (1-5 stars)
 *   - Hover preview (shows what rating would be selected)
 *   - Keyboard accessible (arrow keys to change rating)
 *   - Visual feedback (filled vs outline stars)
 *   - Works with react-hook-form
 */

"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  /** Current rating value (1-5) */
  value: number;
  /** Callback when rating changes */
  onChange: (rating: number) => void;
  /**  Disabled state */
  disabled?: boolean;
  /** Size of stars */
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  size = "md",
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || value;

  function handleClick(rating: number) {
    if (!disabled) {
      onChange(rating);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, rating: number) {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(rating);
    }

    if (e.key === "ArrowRight" && rating < 5) {
      e.preventDefault();
      onChange(rating);
    }

    if (e.key === "ArrowLeft" && rating > 1) {
      e.preventDefault();
      onChange(rating);
    }
  }

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= displayRating;

        return (
          <Button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !disabled && setHoverRating(rating)}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            disabled={disabled}
            className={cn(
              "bg-black transition-all",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hoverscale-110"
            )}
            aria-label={`Rate ${rating} star${rating > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                SIZE_CLASSES[size],
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300",
                "transition colors"
              )}
            />
          </Button>
        );
      })}

      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value} {value === 1 ? "star" : "stars"}
        </span>
      )}
    </div>
  );
}
