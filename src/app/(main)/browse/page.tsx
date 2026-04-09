/**
 * @file Browse Businesses Page
 * @description Customer-facing page to discover and filter businesses.
 *
 * This is a Server Component that:
 *   1. Reads filter parameters from the URL search params
 *   2. Queries the database for matching businesses
 *   3. Renders the filter bar, business cards grid, and pagination
 *
 * The filter bar and pagination are Client Components that update
 * the URL, triggering a new server render with updated data.
 *
 * URL: /browse
 * URL with filters: /browse?category=BARBERSHOP&city=Austin&search=cuts&page=2
 */

import { Suspense } from "react";
import { Store } from "lucide-react";

import {
  browseBusinesses,
  getAvailableCities,
} from "@/lib/actions/public-queries";
import { BusinessCard } from "@/components/shared/business-card";
import { BrowseFilters } from "@/components/shared/browse-filters";
import { BrowsePagination } from "@/components/shared/browse-pagination";

export const metadata = {
  title: "Browse Services",
  description:
    "Discover and book appointments with local service providers on Appointly.",
};

/**
 * Next.js passes searchParams to page components automatically.
 * These come from the URL query string.
 */
interface BrowsePageProps {
  searchParams: Promise<{
    category?: string;
    city?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;

  // Fetch available cities for the filter dropdown
  const availableCities = await getAvailableCities();

  // Fetch businesses with current filters
  const { businesses, totalCount, totalPages, currentPage } =
    await browseBusinesses({
      category: params.category,
      city: params.city,
      search: params.search,
      page: params.page ? parseInt(params.page, 10) : 1,
    });

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Services</h1>
          <p className="mt-2 text-muted-foreground">
            Discover local service providers and book your next appointment.
          </p>
        </div>

        {/* Filters — wrapped in Suspense because it uses useSearchParams */}
        <Suspense fallback={<FiltersSkeleton />}>
          <BrowseFilters availableCities={availableCities} />
        </Suspense>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "business" : "businesses"} found
          </p>
        </div>

        {/* Business cards grid OR empty state */}
        {businesses.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={{
                    id: business.id,
                    slug: business.slug,
                    name: business.name,
                    description: business.description,
                    category: business.category,
                    city: business.city,
                    state: business.state,
                    image: business.image,
                    _count: business._count,
                    reviews: business.reviews,
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            <Suspense>
              <BrowsePagination
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </Suspense>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Store className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No businesses found</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Loading skeleton for the filter bar. */
function FiltersSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-[180px]" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-[160px]" />
    </div>
  );
}
