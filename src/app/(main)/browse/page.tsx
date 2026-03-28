/**
 * @file Browse Businesses Page
 * @description Customer-facing page to discover and search businesses.
 *
 * URL: /browse
 */

export const metadata = {
  title: "Browse Services",
};

export default function BrowsePage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Services</h1>
          <p className="mt-2 text-muted-foreground">
            Discover local service providers and book your next appointment.
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Business listings with search and filters coming soon...
        </div>
      </div>
    </div>
  );
}
