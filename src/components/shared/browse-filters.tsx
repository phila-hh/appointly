/**
 * @file Browse Filters Component
 * @description Filter controls for the business browse page.
 *
 * Features:
 *   - Search input with debounced URL updates
 *   - Category dropdown (from BusinessCategory enum)
 *   - City dropdown (from available cities in database)
 *   - "Clear filters" button
 *   - All filters are stored as URL search parameters for shareability
 *
 * URL-based state means:
 *   - Filters survive page refreshes
 *   - Filtered pages can be shared via URL
 *   - Browser back/forward navigates filter history
 *   - Server Components can read filters for SSR
 */

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BUSINESS_CATEGORIES } from "@/constants";

/** Props accepted by the BrowseFilters component. */
interface BrowseFiltersProps {
  /** List of cities that have active businesses (for the city dropdown). */
  availableCities: string[];
}

export function BrowseFilters({ availableCities }: BrowseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // isPending is true while a navigation is in progress (used for loading states)
  const [isPending, startTransition] = useTransition();

  // Local state for the search input (updated on every keystroke)
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? ""
  );

  /**
   * Builds a new URL with updated search parameters.
   * Removes parameters with empty values to keep the URL clean.
   *
   * @param updates - Key-value pairs to set or remove
   */
  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Apply all updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Always reset to page 1 when filters change
      params.delete("page");

      return params.toString();
    },
    [searchParams]
  );

  /**
   * Updates the URL with new filter parameters.
   * Uses startTransition for non-blocking UI updates.
   */
  function updateFilters(updates: Record<string, string>) {
    const queryString = createQueryString(updates);
    startTransition(() => {
      router.push(`${pathname}?${queryString}`, { scroll: false });
    });
  }

  /**
   * Debounced search: updates URL 400ms after the user stops typing.
   * Prevents firing a new navigation on every single keystroke.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get("search") ?? "";
      if (searchValue !== currentSearch) {
        updateFilters({ search: searchValue });
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  /** Clears all filters and resets the search input. */
  function clearFilters() {
    setSearchValue("");
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  // Check if any filters are active (to show/hide the clear button)
  const hasActiveFilters =
    searchParams.has("search") ||
    searchParams.has("category") ||
    searchParams.has("city");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <Select
          value={searchParams.get("category") ?? "ALL"}
          onValueChange={(value) => updateFilters({ category: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {Object.entries(BUSINESS_CATEGORIES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City filter */}
        {availableCities.length > 0 && (
          <Select
            value={searchParams.get("city") ?? "ALL"}
            onValueChange={(value) =>
              updateFilters({ city: value === "ALL" ? "" : value })
            }
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Cities</SelectItem>
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear filters</span>
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
