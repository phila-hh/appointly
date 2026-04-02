/**
 * @file Business Detail Page
 * @description Public-facing pages showing full business information.
 *
 * Displays:
 *   - Business profile (name, category, description, contact, location)
 *   - Service catalogue with pricing and duration
 *   - Weekly operating hours with today highlighted
 *   - Customer reviews with star ratings
 *   - Call-to-action to book an appointment
 *
 * Uses dynamic route parameter [slug] for SEO friendly URLs.
 * Example: /business/fresh-cuts-barbershop
 *
 * Generates dynamic metadata (page title, description) for SEO.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Phone, Mail, Globe, Clock, CalendarPlus } from "lucide-react";

import { getBusinessBySlug } from "@/lib/actions/public-queries";
import { formatPrice, formatDuration } from "@/lib/utils";
import {
  StarRating,
  calculateAverageRating,
} from "@/components/shared/star-rating";
import { ScheduleDisplay } from "@/components/shared/schedule-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BUSINESS_CATEGORIES } from "@/constants";

/** Page props with the dynamic slug parameters. */
interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates dynamic metadata for SEO.
 * Each business page has a unique title and description.
 */
export async function generateMetadata({
  params,
}: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return { title: "Business not found" };
  }

  return {
    title: business.name,
    description:
      business.description ??
      `Book appointments with ${business.name} on Appointly.`,
  };
}

export default async function BusinessDetailPage({
  params,
}: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  // Show 404 if business doesn't exist or is inactive
  if (!business) {
    notFound();
  }

  const averageRating = calculateAverageRating(
    business.reviews.map((r) => r.rating)
  );
  const categoryLabel =
    BUSINESS_CATEGORIES[business.category] ?? business.category;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* ================================================================ */}
        {/* Main Content — Left 2/3                                          */}
        {/* ================================================================ */}
        <div className="space-y-8 lg:col-span-2">
          {/* Business header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categoryLabel}</Badge>
              {business._count.reviews > 0 && (
                <StarRating
                  rating={averageRating}
                  showValue
                  reviewCount={business._count.reviews}
                />
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {business.name}
            </h1>

            {business.city && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {business.address && `${business.address}, `}
                  {business.city}
                  {business.state && `, ${business.state}`}
                  {business.zipCode && ` ${business.zipCode}`}
                </span>
              </div>
            )}

            {business.description && (
              <p className="max-w-2xl text-muted-foreground leading-relaxed">
                {business.description}
              </p>
            )}
          </div>

          <Separator />

          {/* ============================================================== */}
          {/* Services Section                                                */}
          {/* ============================================================== */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Services</h2>

            {business.services.length > 0 ? (
              <div className="space-y-3">
                {business.services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      {/* Service info */}
                      <div className="space-y-1">
                        <h3 className="font-medium">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(service.duration)}
                          </span>
                        </div>
                      </div>

                      {/* Price and book button */}
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold">
                          {formatPrice(Number(service.price))}
                        </span>
                        {/* Book button — functionality in Phase 8 */}
                        <Button size="sm" asChild>
                          <Link
                            href={`/business/${business.slug}/book?service=${service.id}`}
                          >
                            <CalendarPlus className="mr-1.5 h-4 w-4" />
                            Book
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No services available at this time.
              </p>
            )}
          </section>

          <Separator />

          {/* ============================================================== */}
          {/* Reviews Section                                                 */}
          {/* ============================================================== */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Reviews ({business._count.reviews})
              </h2>
              {business._count.reviews > 0 && (
                <StarRating rating={averageRating} showValue size="lg" />
              )}
            </div>

            {business.reviews.length > 0 ? (
              <div className="space-y-4">
                {business.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Reviewer avatar */}
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {review.customer.name
                              ? review.customer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-1">
                          {/* Name and rating */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {review.customer.name ?? "Anonymous"}
                            </span>
                            <StarRating rating={review.rating} size="sm" />
                          </div>

                          {/* Date */}
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>

                          {/* Comment */}
                          {review.comment && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No reviews yet. Be the first to leave a review!
              </p>
            )}
          </section>
        </div>

        {/* ================================================================ */}
        {/* Sidebar — Right 1/3                                              */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {/* Business hours card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {business.BusinessHours.length > 0 ? (
                <ScheduleDisplay
                  hours={business.BusinessHours.map((h) => ({
                    dayOfWeek: h.dayOfWeek,
                    openTime: h.openTime,
                    closeTime: h.closeTime,
                    isClosed: h.isClosed,
                  }))}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Hours not available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact info card */}
          {(business.phone || business.email || business.website) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {business.phone}
                  </a>
                )}
                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {business.email}
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
