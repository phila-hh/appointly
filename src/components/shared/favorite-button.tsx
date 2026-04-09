/**
 * @file Favorite Button Component
 * @description Heart icon button for adding/removing businesses from favorites.
 *
 * Features:
 *   - Filled heart when favorited, outline when not
 *   - Optimistic UI update (instant visual feedback)
 *   - Toast notifications
 *   - Requires authentication
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { toggleFavorite } from "@/lib/actions/favorite";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FavoriteButtonProps {
  /** The business ID */
  businessId: string;
  /** Initial favorited state from server */
  initialFavorited: boolean;
  /** Optional className for styling */
  className?: string;
  /** Show as icon-only button (default: true) */
  iconOnly?: boolean;
}

export function FavoriteButton({
  businessId,
  initialFavorited,
  className,
  iconOnly = true,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleToggle() {
    // Optimistic update — change UI immediately
    setIsFavorited(!isFavorited);

    startTransition(async () => {
      const result = await toggleFavorite(businessId);

      if (result.error) {
        // Revert optimistic update on error
        setIsFavorited(isFavorited);
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.success);
        router.refresh();
      }
    });
  }

  const button = (
    <Button
      variant={isFavorited ? "default" : "outline"}
      size={iconOnly ? "icon" : "sm"}
      onClick={handleToggle}
      disabled={isPending}
      className={className}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
      {!iconOnly && (
        <span className="ml-2">{isFavorited ? "Favorited" : "Favorite"}</span>
      )}
    </Button>
  );

  if (iconOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            {isFavorited ? "Remove from favorites" : "Add to favorites"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
