/**
 * @file AI Search Bar Component
 * @description Natural language search input powered by AI.
 *
 * Features:
 *   - Sparkle-themed input field with "Ask AI" branding
 *   - Example search suggestions as clickable chips
 *   - Loading state with animated indicator
 *   - "AI understood" explanation banner showing extracted intent
 *   - Results grid using the same BusinessCard component
 *   - Rate limit indicator (searches remaining)
 *   - Sign-in prompt for unauthenticated users
 *   - Clear/dismiss results to return to standard browse
 *
 * This component is fully client-side and calls the aiSearch
 * server action directly.
 */

"use client";

import { useState } from "react";
import {
  Sparkles,
  Search,
  Loader2,
  X,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { aiSearch, type AISearchResult } from "@/lib/actions/ai-search";
import { BusinessCardClient } from "@/components/shared/business-card-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BUSINESS_CATEGORIES } from "@/constants";

/** Props accepted by the AISearchBar component. */
interface AISearchBarProps {
  /** Whether the user is authenticated (controls sign-in prompt). */
  isAuthenticated: boolean;
}

/**
 * Example search suggestions shown as clickable chips.
 * These help users understand what kind of queries are possible.
 */
const SEARCH_EXAMPLES = [
  "Affordable haircut in Mekelle",
  "Spa massage this weekend",
  "Dentist near Bole",
  "Yoga classes on Saturday",
  "Pet grooming in Addis Ababa",
  "Photography studio for wedding",
];

export function AISearchBar({ isAuthenticated }: AISearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<AISearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  /**
   * Execute the AI search.
   */
  async function handleSearch(searchQuery?: string) {
    const searchText = searchQuery ?? query;

    if (!searchText.trim()) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      const searchResult = await aiSearch(query);
      setResult(searchResult);

      if (searchQuery) {
        setQuery(searchQuery);
      }
    } catch {
      setResult({
        success: false,
        error: "Something went wrong. Please try again.",
        businesses: [],
        totalCount: 0,
        usedAI: false,
      });
    } finally {
      setIsSearching(false);
    }
  }

  /**
   * Handle form submission.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch();
  }

  /**
   * Handle clicking an example suggestion.
   */
  function handleExampleClick(example: string) {
    handleSearch(example);
  }

  /**
   * Dismiss AI search results and return to standard browse.
   */
  function handleDismiss() {
    setShowResults(false);
    setResult(null);
    setQuery("");
  }

  return (
    <div className="space-y-4">
      {/* AI Search card */}
      <Card className="border-primary/20 bg-linear-to-r from-primary/5 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI-Powered Search</h3>
              <Badge variant="outline" className="text-xs">
                Beta
              </Badge>
            </div>

            {isAuthenticated ? (
              <>
                {/* Search input */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder='Try "cheap haircut near Bole open Saturday"...'
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9"
                      disabled={isSearching}
                    />
                  </div>
                  <Button type="submit" disabled={isSearching || !query.trim()}>
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Ask AI
                      </>
                    )}
                  </Button>
                </form>

                {/* Example suggestions */}
                {!showResults && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Try searching with natural language:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SEARCH_EXAMPLES.map((example) => (
                        <button
                          key={example}
                          onClick={() => handleExampleClick(example)}
                          disabled={isSearching}
                          className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rate limit indicator */}
                {result?.remaining !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {result.remaining} AI search
                    {result.remaining !== 1 ? "es" : ""} remaining this hour
                  </p>
                )}
              </>
            ) : (
              /* Sign-in prompt for unauthenticated users */
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Sign in to search with natural language powered by AI.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/sign-in">
                    Sign In
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Search Results */}
      {showResults && result && (
        <div className="space-y-4">
          {/* Error state */}
          {!result.success && result.error && (
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <CardContent className="flex items-center justify-between p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {result.error}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success state — AI explanation banner */}
          {result.success && (
            <>
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div className="space-y-1">
                        {/* AI explanation */}
                        {result.intent?.explanation && (
                          <p className="text-sm font-medium">
                            AI understood:{" "}
                            <span className="text-muted-foreground font-normal">
                              {result.intent.explanation}
                            </span>
                          </p>
                        )}

                        {/* Extracted filters as badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {result.intent?.category && (
                            <Badge variant="secondary" className="text-xs">
                              {BUSINESS_CATEGORIES[result.intent.category] ??
                                result.intent.category}
                            </Badge>
                          )}
                          {result.intent?.city && (
                            <Badge variant="secondary" className="text-xs">
                              📍 {result.intent.city}
                            </Badge>
                          )}
                          {result.intent?.maxPrice && (
                            <Badge variant="secondary" className="text-xs">
                              💰 Under ETB {result.intent.maxPrice}
                            </Badge>
                          )}
                          {result.intent?.dayOfWeek &&
                            result.intent.dayOfWeek.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                📅{" "}
                                {result.intent.dayOfWeek
                                  .map(
                                    (d) =>
                                      d.charAt(0) + d.slice(1).toLowerCase()
                                  )
                                  .join(", ")}
                              </Badge>
                            )}
                          {result.intent?.serviceKeywords &&
                            result.intent.serviceKeywords.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                🔍 {result.intent.serviceKeywords.join(", ")}
                              </Badge>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {result.totalCount}{" "}
                          {result.totalCount === 1 ? "result" : "results"} found
                          {!result.usedAI && " (basic search fallback)"}
                        </p>
                      </div>
                    </div>

                    {/* Dismiss button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="shrink-0"
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Results grid */}
              {result.businesses.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {result.businesses.map((business) => (
                    <BusinessCardClient
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
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                  <Sparkles className="mb-4 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No businesses matched your AI search. Try rephrasing or use
                    the standard filters below.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleDismiss}
                    className="mt-2"
                  >
                    Return to all businesses
                  </Button>
                </div>
              )}

              <Separator />
            </>
          )}
        </div>
      )}
    </div>
  );
}
