/**
 * @file Business Detail Page
 * @description Public-facing business profile page with services, team,
 * reviews, and AI chatbot.
 *
 * Features:
 *   - Business information (name, description, contact, hours)
 *   - Average rating and review count
 *   - List of active services with "Book Now" buttons
 *   - Team tab showing staff members (Phase 15B) — only if staff exist
 *   - Customer reviews with filtering and sentiment badges
 *   - Favorite button for customers
 *   - "Book with [Name]" deep-link per staff member
 *   - AI chatbot widget — floating button + panel
 *
 * URL: /business/[slug]
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, Clock, UserCog } from "lucide-react";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isFavorited } from "@/lib/actions/favorite";
import {
  getReviewStats,
  getBusinessReviews,
} from "@/lib/actions/review-queries";
import { getBusinessStaffPublic } from "@/lib/actions/staff-queries";
import { BUSINESS_CATEGORIES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { StarRating } from "@/components/shared/star-rating";
import { ReviewList } from "@/components/shared/review-list";
import { ChatWidget } from "@/components/shared/chat-widget";
import { formatPrice, formatDuration } from "@/lib/utils";

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BusinessPageProps) {
  const { slug } = await params;

  const business = await db.business.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!business) {
    return { title: "Business Not Found" };
  }

  return {
    title: business.name,
    description:
      business.description ?? `Book appointments at ${business.name}`,
  };
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;

  const user = await getCurrentUser();

  // Fetch business with all data
  const business = await db.business.findUnique({
    where: { slug, isActive: true },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
      BusinessHours: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!business) notFound();

  // Fetch review stats, reviews, favorites, and public staff in parallel
  const [reviewStats, reviewsData, favorited, staffMembers] = await Promise.all(
    [
      getReviewStats(business.id),
      getBusinessReviews(business.id, {
        page: 1,
        limit: 20,
        sortBy: "newest",
      }),
      user ? isFavorited(business.id) : Promise.resolve(false),
      getBusinessStaffPublic(business.id),
    ]
  );

  /** Whether this business has any active staff members. */
  const hasStaff = staffMembers.length > 0;

  // Build business address
  const address = [
    business.address,
    business.city,
    business.state,
    business.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Badge variant="outline">
                {BUSINESS_CATEGORIES[business.category]}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {business.name}
              </h1>
              {reviewStats.totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={reviewStats.averageRating ?? 0}
                    reviewCount={reviewStats.totalCount}
                    showValue
                  />
                </div>
              )}
            </div>

            {/* Favorite button */}
            {user && user.role === "CUSTOMER" && (
              <FavoriteButton
                businessId={business.id}
                initialFavorited={favorited}
              />
            )}
          </div>

          {business.description && (
            <p className="text-muted-foreground">{business.description}</p>
          )}
        </div>

        {/* Main content — two columns */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column: Services, Team (if applicable), and Reviews */}
          <div className="space-y-8 lg:col-span-2">
            <Tabs defaultValue="services">
              <TabsList
                className={`grid w-full ${hasStaff ? "grid-cols-3" : "grid-cols-2"}`}
              >
                <TabsTrigger value="services">
                  Services ({business.services.length})
                </TabsTrigger>
                {hasStaff && (
                  <TabsTrigger value="team">
                    Team ({staffMembers.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="reviews">
                  Reviews ({reviewStats.totalCount})
                </TabsTrigger>
              </TabsList>

              {/* Services tab */}
              <TabsContent value="services" className="mt-6 space-y-4">
                {business.services.length > 0 ? (
                  business.services.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-semibold">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-sm text-muted-foreground">
                                {service.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDuration(service.duration)}
                              </span>
                              <span className="text-lg font-semibold text-foreground">
                                {formatPrice(Number(service.price))}
                              </span>
                            </div>
                          </div>
                          <Button asChild>
                            <Link
                              href={`/business/${business.slug}/book?service=${service.id}`}
                            >
                              Book Now
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No services available at the moment.
                  </p>
                )}
              </TabsContent>

              {/* Team tab — only rendered when business has staff */}
              {hasStaff && (
                <TabsContent value="team" className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {staffMembers.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold">{member.name}</h3>
                                {member.title && (
                                  <p className="text-sm text-muted-foreground">
                                    {member.title}
                                  </p>
                                )}
                              </div>
                              <UserCog className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                            </div>

                            {member.services.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Specializes in
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {member.services.map((ss) => (
                                    <Badge
                                      key={ss.service.id}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {ss.service.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {member.services.length > 0 && (
                              <div className="pt-1">
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <Link
                                    href={`/business/${business.slug}/book?service=${member.services[0].service.id}&staff=${member.id}`}
                                  >
                                    Book with {member.name.split(" ")[0]}
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* Reviews tab */}
              <TabsContent value="reviews" className="mt-6">
                <ReviewList
                  reviews={reviewsData.reviews.map((review) => ({
                    ...review,
                    createdAt: review.createdAt,
                  }))}
                  showService
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column: Business info */}
          <div className="space-y-6">
            {/* Contact info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{address}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-primary hover:underline"
                      >
                        Open in Maps
                      </a>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${business.phone}`}
                      className="text-sm hover:underline"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${business.email}`}
                      className="text-sm hover:underline"
                    >
                      {business.email}
                    </a>
                  </div>
                )}

                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business hours */}
            {business.BusinessHours.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {business.BusinessHours.map((hours) => (
                      <div
                        key={hours.id}
                        className="flex items-center justify-between"
                      >
                        <span className="font-medium capitalize">
                          {hours.dayOfWeek.toLowerCase()}
                        </span>
                        <span className="text-muted-foreground">
                          {hours.isClosed
                            ? "Closed"
                            : `${hours.openTime} - ${hours.closeTime}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* AI Chatbot Widget — Phase 16C */}
      <ChatWidget
        businessContext={{
          businessId: business.id,
          slug: business.slug,
          name: business.name,
        }}
        isAuthenticated={!!user}
      />
    </div>
  );
}
