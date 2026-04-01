/**
 * @file Business Card Component
 * @description Displays a business summary card for the browse listing.
 *
 * Shows:
 *   - Business name and category badge
 *   - Description (truncated to 2 lines)
 *   - City/location
 *   - Average star rating with review count
 *   - Number of active services
 *   - "View" link to the business detail page
 *
 * Used on the browse page in a responsive grid layout.
 */

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
import {
  StarRating,
  calculateAverageRating,
} from "@/components/shared/star-rating";
import { BUSINESS_CATEGORIES } from "@/constants";

/** Props accepted by the BusinessCard component. */
interface BusinessCardProps {
  business: {
    slug: string;
    name: string;
    description: string | null;
    category: string;
    city: string | null;
    state: string | null;
    image: string | null;
    _count: {
      services: number;
      reviews: number;
    };
    reviews: {
      rating: number;
    }[];
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  const averageRating = calculateAverageRating(
    business.reviews.map((r) => r.rating)
  );

  const categoryLabel =
    BUSINESS_CATEGORIES[business.category] ?? business.category;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
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

        {/* Rating and service count */}
        <div className="mt-3 flex items-center justify-between">
          {business._count.reviews > 0 ? (
            <StarRating
              rating={averageRating}
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
