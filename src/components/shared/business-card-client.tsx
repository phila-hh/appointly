/**
 * @file Business Card Client Component
 * @description Client-safe business card used exclusively
 * inside the AI search results (ai-search-bar.tsx).
 *
 * Unlike the server-side BusinessCard, this component:
 *   - Has no server-side data fetching (no db, no session)
 *   - Computes average rating from the reviews array directly
 *   - Does not include favorite functionality
 *
 * This exists solely to avoid importing server-only code into
 * client components.
 */

"use client";

import Link from "next/link";
import { MapPin, Scissors, ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shared/star-rating";
import { BUSINESS_CATEGORIES } from "@/constants";
import type { AISearchBusinessResult } from "@/lib/actions/ai-search";

interface BusinessCardClientProps {
  business: AISearchBusinessResult;
}

export function BusinessCardClient({ business }: BusinessCardClientProps) {
  const categoryLabel =
    BUSINESS_CATEGORIES[business.category] ?? business.category;

  // Compute average rating client-side from the reviews array
  const averageRating =
    business.reviews.length > 0
      ? parseFloat(
          (
            business.reviews.reduce((sum, r) => sum + r.rating, 0) /
            business.reviews.length
          ).toFixed(1)
        )
      : null;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="relative">
        {/* Category badge */}
        <div className="mb-2">
          <Badge variant="secondary" className="text-xs">
            {categoryLabel}
          </Badge>
        </div>

        {/* Business name */}
        <Link
          href={`/business/${business.slug}`}
          className="text-lg font-semibold leading-tight hover:text-primary transition-colors"
        >
          {business.name}
        </Link>

        {/* Location */}
        {business.city && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {business.city}
              {business.state ? `, ${business.state}` : ""}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {/* Description */}
        {business.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {business.description}
          </p>
        )}

        {/* Matching services (AI search bonus info) */}
        {business.matchingServices && business.matchingServices.length > 0 && (
          <div className="mt-2 space-y-1">
            {business.matchingServices.slice(0, 3).map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span className="truncate">{service.name}</span>
                <span className="ml-2 shrink-0 font-medium">
                  ETB {service.price}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Rating and service count */}
        <div className="mt-3 flex items-center justify-between">
          {business._count.reviews > 0 ? (
            <StarRating
              rating={averageRating ?? 0}
              showValue
              reviewCount={business._count.reviews}
              size="sm"
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              No reviews yet
            </span>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Scissors className="h-3.5 w-3.5" />
            <span>
              {business._count.services}{" "}
              {business._count.services === 1 ? "service" : "services"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/business/${business.slug}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
