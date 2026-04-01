/**
 * @file Browse Pagination Component
 * @description Page navigation for the browse business listing.
 *
 * Uses URL search parameters for the page number, consistent with
 * the filter approach. Built on shadcn's Pagination primitives.
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/** Props accepted by the BrowsePagination component. */
interface BrowsePaginationProps {
  /** Current active page (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
}

export function BrowsePagination({
  currentPage,
  totalPages,
}: BrowsePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  /**
   * Builds a URL for a specific page, preserving existing filters.
   * @param page - The target page number
   */
  function getPageUrl(page: number): string {
    const params = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  /**
   * Navigate to a specific page.
   */
  function goToPage(page: number) {
    router.push(getPageUrl(page), { scroll: true });
  }

  /**
   * Generates the array of page numbers to display.
   * Shows at most 5 page numbers centered around the current page.
   *
   * Examples:
   *   Current 1, Total 10: [1, 2, 3, 4, 5]
   *   Current 5, Total 10: [3, 4, 5, 6, 7]
   *   Current 10, Total 10: [6, 7, 8, 9, 10]
   */
  function getPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        {/* Previous button */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => goToPage(currentPage - 1)}
            className={
              currentPage <= 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>

        {/* Page numbers */}
        {pageNumbers.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => goToPage(page)}
              isActive={page === currentPage}
              className="cursor-pointer"
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Next button */}
        <PaginationItem>
          <PaginationNext
            onClick={() => goToPage(currentPage + 1)}
            className={
              currentPage >= totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
