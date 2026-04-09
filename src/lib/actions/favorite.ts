/**
 * @file Favorite Server Actions
 * @description Server-side functions for managing business favorites.
 *
 * Customers can:
 *   - Add a business to their favorites
 *   - Remove a business from their favorites
 *   - Check if a business is favorited
 *   - Get their full list of favorites
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/** Standard result type for favorite actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

/**
 * Toggles a business's favorite status for the current user.
 *
 * If favorited: removes it.
 * If not favorited: adds it.
 *
 * @param businessId - The business to toggle favorite status for
 * @returns Object with `success` or `error` message
 */
export async function toggleFavorite(
  businessId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in to favorite businesses." };
    }

    if (user.role !== "CUSTOMER") {
      return { error: "Only customers can favorite businesses." };
    }

    // Check if already favorited
    const existingFavorite = await db.favorite.findUnique({
      where: {
        customerId_businessId: {
          customerId: user.id,
          businessId,
        },
      },
    });

    if (existingFavorite) {
      // Remove from favorites
      await db.favorite.delete({
        where: { id: existingFavorite.id },
      });

      revalidatePath("/favorites");
      revalidatePath("/browse");

      return { success: "Removed from favorites." };
    } else {
      // Add to favorites
      await db.favorite.create({
        data: {
          customerId: user.id,
          businessId,
        },
      });

      revalidatePath("/favorites");
      revalidatePath("/browse");

      return { success: "Added to favorites!" };
    }
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Checks if a business is favorited by the current user.
 *
 * @param businessId - The business to check
 * @returns true if favorited, false otherwise
 */
export async function isFavorited(businessId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") return false;

  const favorite = await db.favorite.findUnique({
    where: {
      customerId_businessId: {
        customerId: user.id,
        businessId,
      },
    },
  });

  return !!favorite;
}

/**
 * Retrieves all favorited businesses for the current user.
 *
 * @returns Array of business records with basic info
 */
export async function getFavorites() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") return [];

  const favorites = await db.favorite.findMany({
    where: { customerId: user.id },
    include: {
      business: {
        include: {
          _count: {
            select: {
              services: { where: { isActive: true } }, // Count only active services
              reviews: true, // Count all reviews
            },
          },
          reviews: {
            select: { rating: true }, // Fetch ratings for average calculation
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((fav) => fav.business);
}
