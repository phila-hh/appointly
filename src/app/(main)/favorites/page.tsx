/**
 * @file Favorites Page
 * @description Displays all businesses favorited by the current customer.
 *
 * Features:
 *   - Grid of favorited businesses
 *   - Quick access to book appointments
 *   - Empty state for users with no favorites
 *
 * URL: /favorites
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { getFavorites } from "@/lib/actions/favorite";
import { BusinessCard } from "@/components/shared/business-card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "My Favorites",
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "CUSTOMER") {
    redirect("/");
  }

  const favorites = await getFavorites();

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Favorites</h1>
          <p className="mt-2 text-muted-foreground">
            Businesses you&apos;ve saved for quick access.
          </p>
        </div>

        {/* Favorites grid or empty state */}
        {favorites.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No favorites yet</h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              Start adding businesses to your favorites by clicking the heart
              icon on business cards.
            </p>
            <Button asChild>
              <Link href="/browse">Browse Businesses</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
